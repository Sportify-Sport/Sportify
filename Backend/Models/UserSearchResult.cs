namespace Backend.Models
{
    public class UserSearchResult
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Gender { get; set; }
        public string ProfileImage { get; set; }
        public int CityId { get; set; }
    }
}
