namespace Backend.Models
{
    public class CityOrganizerDetails
    {
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string ProfileImage { get; set; }
        public int CityId { get; set; }
        public bool IsSuperAdmin { get; set; }
    }
}
