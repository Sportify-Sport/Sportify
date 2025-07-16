using Backend.Models;

namespace Backend.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly IEmbeddingService _embeddingService;
        private readonly CityService _cityService;
        private readonly SportService _sportService;

        public RecommendationService(IEmbeddingService embeddingService, CityService cityService, SportService sportService)
        {
            _embeddingService = embeddingService;
            _cityService = cityService;
            _sportService = sportService;
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
                    // Case: User not found
                    return GetRandomEventsResult(count, "User not found. Showing random events.");
                }

                // Cast to dynamic to access properties
                dynamic userProfile = userProfileObj;

                // Build user profile string
                var userProfileString = await BuildUserProfileStringAsync(userProfile);

                // Get eligible events for the user (not just active events)
                var eligibleEvents = dbServices.GetEligibleEventsForUser(userId);

                if (eligibleEvents == null || eligibleEvents.Count == 0)
                {
                    // Case 3: User Logged In + Model Works + No Eligible Events
                    return GetRandomEventsResult(count, "No events match your criteria. Here are some popular events!");
                }

                // Check if ML model is loaded
                if (!_embeddingService.IsModelLoaded)
                {
                    // Case 4: User Logged In + Model Failed to Load
                    return GetRandomEventsFromList(eligibleEvents, count, "Recommendation system unavailable. Showing active events.");
                }

                // Generate recommendations
                var recommendations = await GenerateRecommendationsAsync(
                    userProfileString,
                    eligibleEvents,
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

                // Determine which case we're in based on results
                if (eventRecommendations.Count >= count)
                {
                    // Case 1: User Logged In + Model Works + Events Available
                    return new RecommendationResult
                    {
                        Success = true,
                        Message = "Personalized recommendations based on your profile",
                        Data = eventRecommendations.Take(count).ToList(),
                        IsRecommended = true
                    };
                }
                else if (eventRecommendations.Count > 0)
                {
                    // Case 2: User Logged In + Model Works + Few Events Found
                    // Fill remaining slots with random events
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

                    return new RecommendationResult
                    {
                        Success = true,
                        Message = "Personalized recommendations with some popular events",
                        Data = eventRecommendations.Take(count).ToList(),
                        IsRecommended = true
                    };
                }
                else
                {
                    // No recommendations generated
                    return GetRandomEventsResult(count, "No events match your criteria. Here are some popular events!");
                }
            }
            catch (Exception ex)
            {
                // Case 6: Any System Error
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
