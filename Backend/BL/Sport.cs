using Microsoft.Extensions.Caching.Memory;

namespace Backend.BL
{
    public class Sport
    {
        private int sportId;
        private string sportName;
        private string sportImage;

        public Sport() { }
        public Sport(int sportId, string sportName, string sportImage)
        {
            this.sportId = sportId;
            this.sportName = sportName;
            this.sportImage = sportImage;
        }

        public int SportId { get => sportId; set => sportId = value; }
        public string SportName { get => sportName; set => sportName = value; }
        public string SportImage { get => sportImage; set => sportImage = value; }

        // Get all sports from database
        public static List<Sport> GetAllSports()
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetAllSports();
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Get sport by Id
        public static Sport GetSportById(int sportId)
        {
            try
            {
                var sports = GetAllSports();
                return sports.FirstOrDefault(s => s.SportId == sportId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Validate sport Id
        public static bool ValidateSportId(int sportId)
        {
            try
            {
                var sport = GetSportById(sportId);
                return sport != null;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        // Add new sport
        public static (bool Success, string Message, int SportId) AddSport(string sportName, string sportImage)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.AddSport(sportName, sportImage);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Update sport image
        public static (bool Success, string Message) UpdateSportImage(int sportId, string sportImage)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.UpdateSportImage(sportId, sportImage);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Delete sport
        public static (bool Success, string Message, string SportImage) DeleteSport(int sportId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.DeleteSport(sportId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Get current sport image
        public static string GetCurrentSportImage(int sportId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetSportImage(sportId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}
