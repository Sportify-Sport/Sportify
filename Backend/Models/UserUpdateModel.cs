namespace Backend.Models
{
    public class UserUpdateModel
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public int FavSportId { get; set; }
        public int CityId { get; set; }
        public string Bio { get; set; }
    }
}
