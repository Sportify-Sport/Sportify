namespace Backend.Models
{
    public class EventDetailsAdmin
    {
        public int EventId { get; set; }
        public string EventName { get; set; }
        public bool RequiresTeams { get; set; }
        public string Description { get; set; }
        public DateTime StartDatetime { get; set; }
        public DateTime EndDatetime { get; set; }
        public int CityId { get; set; }
        public string LocationName { get; set; }
        public int SportId { get; set; }
        public DateTime CreatedAt { get; set; }
        public int MinAge { get; set; }
        public string Gender { get; set; }
        public string EventImage { get; set; }

        // For team events
        public int? MaxTeams { get; set; }
        public int? TeamsNum { get; set; }

        // For individual events
        public int? MaxParticipants { get; set; }
        public int? ParticipantsNum { get; set; }

        // Admin info
        public int? EventAdminId { get; set; }
        public string EventAdminName { get; set; }
        public string EventAdminImage { get; set; }
    }
}
