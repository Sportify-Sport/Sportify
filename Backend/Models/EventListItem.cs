namespace Backend.Models
{
    public class EventListItem
    {
        public int EventId { get; set; }
        public string EventName { get; set; }
        public bool RequiresTeams { get; set; }
        public DateTime StartDatetime { get; set; }
        public DateTime EndDatetime { get; set; }
        public int SportId { get; set; }
        public string EventImage { get; set; }
        public int CityId { get; set; }
        public string Gender { get; set; }
        public bool IsPublic { get; set; }
        public string LocationName { get; set; }
    }
}
