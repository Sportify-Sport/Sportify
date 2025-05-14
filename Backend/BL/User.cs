using Backend.Models;
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
        private bool isEventAdmin;
        private List<int> adminForGroups;
        private List<int> organizerForCities;


        public User()
        {
            AdminForGroups = new List<int>();
            OrganizerForCities = new List<int>();
        }
        public User(int userId, string firstName, string lastName, DateTime birthDate, string email, string passwordHash, int favSportId, int cityId, string profileImage, string bio, string gender, bool isGroupAdmin, bool isCityOrganizer, bool isEventAdmin, List<int> adminForGroups, List<int> organizerForCities)
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
            this.IsEventAdmin = isEventAdmin;
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
        public bool IsEventAdmin { get => isEventAdmin; set => isEventAdmin = value; }
        public List<int> AdminForGroups { get => adminForGroups; set => adminForGroups = value; }
        public List<int> OrganizerForCities { get => organizerForCities; set => organizerForCities = value; }


        public List<object> GetTop4Groups()
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetTop4UserGroups(this.UserId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        public static object GetUserProfile(int userId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetUserProfile(userId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Update user profile
        //public static bool UpdateUserProfile(int userId, UserUpdateModel model, string imageFileName)
        //{
        //    try
        //    {
        //        DBservices dBservices = new DBservices();
        //        return dBservices.UpdateUserProfile(userId, model, imageFileName);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw ex;
        //    }
        //}


        //--------------------------------------------------------------------------------------------------
        // This method updates a user's profile details (without the image)
        //--------------------------------------------------------------------------------------------------
        public static bool UpdateUserDetails(int userId, UserUpdateModel model)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.UpdateUserDetails(userId, model);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // This method updates only a user's profile image
        //--------------------------------------------------------------------------------------------------
        public static bool UpdateProfileImage(int userId, string imageFileName)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.UpdateProfileImage(userId, imageFileName);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        //--------------------------------------------------------------------------------------------------
        // Get current profile image path
        //--------------------------------------------------------------------------------------------------
        public static string GetCurrentProfileImage(int userId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetUserProfileImage(userId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        public List<object> GetAllGroups()
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetAllUserGroups(this.UserId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        //--------------------------------------------------------------------------------------------------
        // Get events that a user has registered for (directly or via group membership)
        //--------------------------------------------------------------------------------------------------
        public static object GetUserEvents(int userId, int limit = 4)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetUserEvents(userId, limit);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Get paginated events that a user has registered for
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Events, bool HasMore) GetUserEventsPaginated(
            int userId,
            DateTime? lastEventDate = null,
            int? lastEventId = null,
            int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetUserEventsPaginated(userId, lastEventDate, lastEventId, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}
