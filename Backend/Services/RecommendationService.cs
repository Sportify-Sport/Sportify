using Backend.Models;

namespace Backend.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly IEmbeddingService _embeddingService;
        private readonly CityService _cityService;
        private readonly SportService _sportService;
        private readonly ILogger<RecommendationService> _logger;

        public RecommendationService(
            IEmbeddingService embeddingService,
            CityService cityService,
            SportService sportService,
            ILogger<RecommendationService> logger)
        {
            _embeddingService = embeddingService;
            _cityService = cityService;
            _sportService = sportService;
            _logger = logger;
        }

        public async Task<RecommendationResult> GetRecommendedEventsAsync(int userId, int count = 5)
        {
            try
            {
                // Get user profile
                DBservices dbServices = new DBservices();
                var userProfileObj = dbServices.GetUserProfile(userId);

                if (userProfileObj == null)
                {
                    _logger.LogWarning("User {UserId} not found", userId);
                    return GetRandomEventsResult(count, "User not found. Showing random events.");
                }

                // Cast to dynamic to access properties
                dynamic userProfile = userProfileObj;

                // Build user profile string
                var userProfileString = await BuildUserProfileStringAsync(userProfile);

                // Get active events (not ended)
                var activeEvents = dbServices.GetActiveEvents();

                if (activeEvents == null || activeEvents.Count == 0)
                {
                    _logger.LogInformation("No active events found");
                    return GetRandomEventsResult(count, "No active events available. Showing random events.");
                }

                // Check if ML model is loaded
                if (!_embeddingService.IsModelLoaded)
                {
                    _logger.LogWarning("ML model not loaded");
                    return GetRandomEventsFromList(activeEvents, count, "Recommendation system unavailable. Showing active events.");
                }

                // Generate recommendations
                var recommendations = await GenerateRecommendationsAsync(
                    userProfileString,
                    activeEvents,
                    count
                );

                // Convert to EventRecommendation format
                var eventRecommendations = new List<EventRecommendation>();
                foreach (var rec in recommendations)
                {
                    var sportName = _sportService.GetSportName(rec.Event.SportId) ?? "Sport";
                    var cityName = await _cityService.GetCityEnglishNameAsync(rec.Event.CityId) ?? "Unknown";

                    eventRecommendations.Add(new EventRecommendation
                    {
                        EventId = rec.Event.EventId,
                        EventName = rec.Event.EventName,
                        ProfileImage = rec.Event.ProfileImage ?? "",
                        RecommendationScore = rec.Score,
                        StartDatetime = rec.Event.StartDatetime,
                        SportName = sportName,
                        CityName = cityName,
                        Description = rec.Event.Description
                    });
                }

                // If we don't have enough recommendations, fill with random
                if (eventRecommendations.Count < count)
                {
                    var remainingCount = count - eventRecommendations.Count;
                    var randomEventsObj = dbServices.GetRandomEvents(remainingCount);

                    if (randomEventsObj is List<object> randomEvents)
                    {
                        foreach (var evt in randomEvents)
                        {
                            dynamic randomEvent = evt;
                            if (!eventRecommendations.Any(e => e.EventId == randomEvent.EventId))
                            {
                                eventRecommendations.Add(new EventRecommendation
                                {
                                    EventId = randomEvent.EventId,
                                    EventName = randomEvent.EventName,
                                    ProfileImage = randomEvent.ProfileImage ?? "",
                                    RecommendationScore = null // Indicates it's a random event
                                });
                            }
                        }
                    }
                }

                return new RecommendationResult
                {
                    Success = true,
                    Message = eventRecommendations.All(e => e.RecommendationScore.HasValue)
                        ? "Personalized recommendations based on your profile"
                        : "Personalized recommendations with some popular events",
                    Data = eventRecommendations.Take(count).ToList(),
                    IsRecommended = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations for user {UserId}", userId);
                return GetRandomEventsResult(count, "An error occurred. Showing random events.");
            }
        }

        private async Task<string> BuildUserProfileStringAsync(dynamic userProfile)
        {
            try
            {
                var age = CalculateAge((DateTime)userProfile.BirthDate);
                var gender = userProfile.Gender == "M" ? "male" : "female";
                var cityName = await _cityService.GetCityEnglishNameAsync((int)userProfile.CityId) ?? "Unknown";
                var sportName = _sportService.GetSportName((int)userProfile.FavSportId) ?? "sports";

                var profileString = $"{age}-year-old {gender} from {cityName} who likes {sportName}";

                // Add bio if available
                if (!string.IsNullOrWhiteSpace(userProfile.Bio?.ToString()))
                {
                    profileString += $" and {userProfile.Bio}";
                }

                return profileString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building user profile");
                return "sports enthusiast";
            }
        }

        private async Task<List<EventWithScore>> GenerateRecommendationsAsync(
            string userProfile,
            List<EventForRecommendation> events,
            int count)
        {
            var userEmbedding = _embeddingService.GetEmbedding(userProfile);
            var eventScores = new List<EventWithScore>();

            foreach (var evt in events)
            {
                try
                {
                    var eventString = await BuildEventStringAsync(evt);
                    var eventEmbedding = _embeddingService.GetEmbedding(eventString);
                    var similarity = _embeddingService.CalculateCosineSimilarity(userEmbedding, eventEmbedding);

                    eventScores.Add(new EventWithScore
                    {
                        Event = evt,
                        Score = similarity
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing event {EventId}", evt.EventId);
                }
            }

            return eventScores
                .OrderByDescending(x => x.Score)
                .Take(count)
                .ToList();
        }

        private async Task<string> BuildEventStringAsync(EventForRecommendation evt)
        {
            try
            {
                var sportName = _sportService.GetSportName(evt.SportId) ?? "Sport";
                var cityName = await _cityService.GetCityEnglishNameAsync(evt.CityId) ?? "City";
                var gender = evt.Gender.ToLower();
                var minAge = evt.MinAge;
                var description = evt.Description ?? "";

                var eventString = $"{sportName} {evt.EventName} in {cityName} for {gender} aged {minAge} and up";

                if (!string.IsNullOrWhiteSpace(description))
                {
                    eventString += $". {description}";
                }

                return eventString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building event string");
                return $"Sports event {evt.EventName}";
            }
        }

        private int CalculateAge(DateTime birthDate)
        {
            var today = DateTime.Today;
            var age = today.Year - birthDate.Year;
            if (birthDate.Date > today.AddYears(-age)) age--;
            return age;
        }

        private RecommendationResult GetRandomEventsResult(int count, string message)
        {
            var dbServices = new DBservices();
            var randomEventsObj = dbServices.GetRandomEvents(count);

            var events = new List<EventRecommendation>();
            if (randomEventsObj is List<object> randomEvents)
            {
                foreach (var evt in randomEvents)
                {
                    dynamic randomEvent = evt;
                    events.Add(new EventRecommendation
                    {
                        EventId = randomEvent.EventId,
                        EventName = randomEvent.EventName,
                        ProfileImage = randomEvent.ProfileImage ?? "",
                        RecommendationScore = null
                    });
                }
            }

            return new RecommendationResult
            {
                Success = true,
                Message = message,
                Data = events,
                IsRecommended = false
            };
        }

        private RecommendationResult GetRandomEventsFromList(List<EventForRecommendation> activeEvents, int count, string message)
        {
            var random = new Random();
            var selectedEvents = activeEvents
                .OrderBy(x => random.Next())
                .Take(count)
                .ToList();

            var events = new List<EventRecommendation>();
            foreach (var evt in selectedEvents)
            {
                events.Add(new EventRecommendation
                {
                    EventId = evt.EventId,
                    EventName = evt.EventName,
                    ProfileImage = evt.ProfileImage ?? "",
                    RecommendationScore = null
                });
            }

            return new RecommendationResult
            {
                Success = true,
                Message = message,
                Data = events,
                IsRecommended = false
            };
        }
    }
}
