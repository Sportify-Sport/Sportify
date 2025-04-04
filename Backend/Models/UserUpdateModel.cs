namespace Backend.Models
{
    public class UserUpdateModel
    {
        public DateTime BirthDate { get; set; }
        public int FavSportId { get; set; }
        public int CityId { get; set; }
        public string Bio { get; set; }
        public string Gender { get; set; }
    }
}
