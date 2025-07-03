namespace Backend.Models
{
    public class RecommendationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public List<EventRecommendation> Data { get; set; } = new();
        public bool IsRecommended { get; set; }
    }

    public class EventRecommendation
    {
        public int EventId { get; set; }
        public string EventName { get; set; }
        public string ProfileImage { get; set; }
        public float? RecommendationScore { get; set; }

        // Additional fields for better UX
        public DateTime StartDatetime { get; set; }
        public string SportName { get; set; }
        public string CityName { get; set; }
        public string Description { get; set; }
    }

    public class EventForRecommendation
    {
        public int EventId { get; set; }
        public string EventName { get; set; }
        public string ProfileImage { get; set; }
        public DateTime StartDatetime { get; set; }
        public DateTime EndDatetime { get; set; }
        public int CityId { get; set; }
        public int SportId { get; set; }
        public int MinAge { get; set; }
        public string Gender { get; set; }
        public string Description { get; set; }
    }

    public class EventWithScore
    {
        public EventForRecommendation Event { get; set; }
        public float Score { get; set; }
    }
}
