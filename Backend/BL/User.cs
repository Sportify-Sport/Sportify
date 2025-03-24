using Microsoft.IdentityModel.Tokens;

namespace Backend.BL
{
    public class User
    {
        private int userId;
        private string firstName;
        private string lastName;
        private DateTime birthDate;
        private string email;
        private string passwordHash;
        private int favSportId;
        private int cityId;
        private string profileImage;
        private string bio;
        private string gender;
        private bool isGroupAdmin;
        private bool isCityOrganizer;
        private List<int> adminForGroups;
        private List<int> organizerForCities;


        public User()
        {
            AdminForGroups = new List<int>();
            OrganizerForCities = new List<int>();
        }
        public User(int userId, string firstName, string lastName, DateTime birthDate, string email, string passwordHash, int favSportId, int cityId, string profileImage, string bio, string gender, bool isGroupAdmin, bool isCityOrganizer, List<int> adminForGroups, List<int> organizerForCities)
        {
            this.UserId = userId;
            this.FirstName = firstName;
            this.LastName = lastName;
            this.BirthDate = birthDate;
            this.Email = email;
            this.PasswordHash = passwordHash;
            this.FavSportId = favSportId;
            this.CityId = cityId;
            this.ProfileImage = profileImage;
            this.Bio = bio;
            this.Gender = gender;
            this.IsGroupAdmin = isGroupAdmin;
            this.IsCityOrganizer = isCityOrganizer;
            this.AdminForGroups = adminForGroups ?? new List<int>();
            this.OrganizerForCities = organizerForCities ?? new List<int>();
        }

        public int UserId { get => userId; set => userId = value; }
        public string FirstName { get => firstName; set => firstName = value; }
        public string LastName { get => lastName; set => lastName = value; }
        public DateTime BirthDate { get => birthDate; set => birthDate = value; }
        public string Email { get => email; set => email = value; }
        public string PasswordHash { get => passwordHash; set => passwordHash = value; }
        public int FavSportId { get => favSportId; set => favSportId = value; }
        public int CityId { get => cityId; set => cityId = value; }
        public string ProfileImage { get => profileImage; set => profileImage = value; }
        public string Bio { get => bio; set => bio = value; }
        public string Gender { get => gender; set => gender = value; }
        public bool IsGroupAdmin { get => isGroupAdmin; set => isGroupAdmin = value; }
        public bool IsCityOrganizer { get => isCityOrganizer; set => isCityOrganizer = value; }
        public List<int> AdminForGroups { get => adminForGroups; set => adminForGroups = value; }
        public List<int> OrganizerForCities { get => organizerForCities; set => organizerForCities = value; }
    }
}
