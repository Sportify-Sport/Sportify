namespace Backend.Services
{
    public interface IEmbeddingService
    {
        float[] GetEmbedding(string text);
        float CalculateCosineSimilarity(float[] vector1, float[] vector2);
        bool IsModelLoaded { get; }
    }
}
