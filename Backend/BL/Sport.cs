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
    }
}
