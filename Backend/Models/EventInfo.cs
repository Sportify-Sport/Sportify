namespace Backend.Models
{
    public class EventInfo
    {
        public string EventName { get; set; }
        public bool RequiresTeams { get; set; }
        public string Description { get; set; }
        public DateTime StartDatetime { get; set; }
        public DateTime EndDatetime { get; set; }
        public int CityId { get; set; }
        public string LocationName { get; set; }
        public int SportId { get; set; }
        public bool IsPublic { get; set; }
        public int MinAge { get; set; }
        public string Gender { get; set; }
        public int? MaxTeams { get; set; }
        public int? MaxParticipants { get; set; }
        public string ProfileImage { get; set; }
    }
}
