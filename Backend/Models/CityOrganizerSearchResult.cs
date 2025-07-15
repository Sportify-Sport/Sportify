namespace Backend.Models
{
    public class CityOrganizerSearchResult
    {
        public List<CityOrganizerDetails> Organizers { get; set; }
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }
}
