using Microsoft.ML.OnnxRuntime;
using Microsoft.ML.OnnxRuntime.Tensors;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Backend.Services
{
    public class EmbeddingService : IEmbeddingService, IDisposable
    {
        private readonly InferenceSession _session;
        private readonly Dictionary<string, int> _vocabulary;
        private readonly int _maxLength = 256;
        private readonly int _padTokenId = 0;
        private readonly int _clsTokenId = 101;
        private readonly int _sepTokenId = 102;
        private readonly int _unkTokenId = 100;

        public bool IsModelLoaded { get; private set; }

        public EmbeddingService(IWebHostEnvironment env)
        {
            try
            {
                var modelPath = Path.Combine(env.WebRootPath, "ml-models", "model.onnx");
                var vocabPath = Path.Combine(env.WebRootPath, "ml-models", "vocab.txt");

                if (!File.Exists(modelPath))
                {
                    IsModelLoaded = false;
                    return;
                }

                _session = new InferenceSession(modelPath);
                _vocabulary = LoadVocabulary(vocabPath);
                IsModelLoaded = true;

            }
            catch (Exception ex)
            {
                IsModelLoaded = false;
            }
        }

        public float[] GetEmbedding(string text)
        {
            if (!IsModelLoaded)
            {
                return new float[384]; // all-MiniLM-L6-v2 has 384 dimensions
            }

            try
            {
                if (string.IsNullOrWhiteSpace(text))
                {
                    return new float[384];
                }

                // Tokenize text
                var tokens = TokenizeText(text);

                // Create flat arrays for tensors
                var inputIdsFlat = new long[_maxLength];
                var attentionMaskFlat = new long[_maxLength];

                // Fill input arrays
                for (int i = 0; i < Math.Min(tokens.Count, _maxLength); i++)
                {
                    inputIdsFlat[i] = tokens[i];
                    attentionMaskFlat[i] = 1;
                }

                // Create tensors with correct constructor
                var inputIdsTensor = new DenseTensor<long>(inputIdsFlat, new ReadOnlySpan<int>(new[] { 1, _maxLength }));
                var attentionMaskTensor = new DenseTensor<long>(attentionMaskFlat, new ReadOnlySpan<int>(new[] { 1, _maxLength }));

                // Create inputs
                var inputs = new List<NamedOnnxValue>
                {
                    NamedOnnxValue.CreateFromTensor("input_ids", inputIdsTensor),
                    NamedOnnxValue.CreateFromTensor("attention_mask", attentionMaskTensor)
                };

                // Run inference
                using var results = _session.Run(inputs);
                var outputTensor = results.First().AsTensor<float>();

                // Apply mean pooling - fixed to work with flat arrays
                var embeddings = MeanPooling(outputTensor, attentionMaskFlat);
                return NormalizeVector(embeddings);
            }
            catch (Exception ex)
            {
                return new float[384];
            }
        }

        public float CalculateCosineSimilarity(float[] vector1, float[] vector2)
        {
            if (vector1.Length != vector2.Length)
                return 0f;

            float dotProduct = 0f;
            float magnitude1 = 0f;
            float magnitude2 = 0f;

            for (int i = 0; i < vector1.Length; i++)
            {
                dotProduct += vector1[i] * vector2[i];
                magnitude1 += vector1[i] * vector1[i];
                magnitude2 += vector2[i] * vector2[i];
            }

            magnitude1 = (float)Math.Sqrt(magnitude1);
            magnitude2 = (float)Math.Sqrt(magnitude2);

            if (magnitude1 == 0f || magnitude2 == 0f)
                return 0f;

            return dotProduct / (magnitude1 * magnitude2);
        }

        private List<int> TokenizeText(string text)
        {
            var tokens = new List<int> { _clsTokenId };

            // Simple word tokenization
            var words = Regex.Split(text.ToLower(), @"\W+")
                           .Where(w => !string.IsNullOrEmpty(w))
                           .ToList();

            foreach (var word in words.Take(_maxLength - 2))
            {
                if (_vocabulary.TryGetValue(word, out int tokenId))
                {
                    tokens.Add(tokenId);
                }
                else
                {
                    tokens.Add(_unkTokenId);
                }
            }

            tokens.Add(_sepTokenId);
            return tokens;
        }

        private Dictionary<string, int> LoadVocabulary(string vocabPath)
        {
            var vocab = new Dictionary<string, int>();

            try
            {
                if (File.Exists(vocabPath))
                {
                    var lines = File.ReadAllLines(vocabPath);
                    for (int i = 0; i < lines.Length; i++)
                    {
                        vocab[lines[i].Trim()] = i;
                    }
                }
                else
                {
                    vocab = CreateSportsVocabulary();
                }
            }
            catch (Exception ex)
            {
                vocab = CreateSportsVocabulary();
            }

            return vocab;
        }

        private Dictionary<string, int> CreateSportsVocabulary()
        {
            return new Dictionary<string, int>
            {
                // Special tokens
                { "[PAD]", 0 }, { "[UNK]", 100 }, { "[CLS]", 101 }, { "[SEP]", 102 },
                
                // Sports
                { "football", 1000 }, { "basketball", 1001 }, { "marathon", 1002 },
                { "soccer", 1003 }, { "running", 1004 }, { "sport", 1005 },
                
                // Event types
                { "tournament", 1010 }, { "match", 1011 }, { "game", 1012 },
                { "competition", 1013 }, { "event", 1014 }, { "race", 1015 },
                
                // Demographics
                { "male", 1020 }, { "female", 1021 }, { "mixed", 1022 },
                { "men", 1023 }, { "women", 1024 },
                
                // Age/Time
                { "year", 1030 }, { "old", 1031 }, { "age", 1032 },
                { "aged", 1033 }, { "young", 1034 }, { "adult", 1035 },
                
                // Actions
                { "likes", 1040 }, { "enjoys", 1041 }, { "plays", 1042 },
                { "who", 1043 }, { "from", 1044 }, { "in", 1045 },
                { "for", 1046 }, { "and", 1047 }, { "up", 1048 }
            };
        }

        private float[] MeanPooling(Tensor<float> modelOutput, long[] attentionMask)
        {
            var batchSize = modelOutput.Dimensions[0];
            var seqLength = modelOutput.Dimensions[1];
            var hiddenSize = modelOutput.Dimensions[2];

            var pooled = new float[hiddenSize];
            int validTokens = 0;

            for (int i = 0; i < seqLength; i++)
            {
                if (attentionMask[i] == 1)
                {
                    for (int j = 0; j < hiddenSize; j++)
                    {
                        pooled[j] += modelOutput[0, i, j];
                    }
                    validTokens++;
                }
            }

            if (validTokens > 0)
            {
                for (int i = 0; i < hiddenSize; i++)
                {
                    pooled[i] /= validTokens;
                }
            }

            return pooled;
        }

        private float[] NormalizeVector(float[] vector)
        {
            float magnitude = (float)Math.Sqrt(vector.Sum(x => x * x));
            if (magnitude == 0f) return vector;

            for (int i = 0; i < vector.Length; i++)
            {
                vector[i] /= magnitude;
            }

            return vector;
        }

        public void Dispose()
        {
            _session?.Dispose();
        }
    }
}
