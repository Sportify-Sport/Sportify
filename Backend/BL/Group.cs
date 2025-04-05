namespace Backend.BL
{
    public class Group
    {
        private int groupId;
        private string groupName;
        private string description;
        private int sportId;
        private string groupImage;
        private int cityId;
        private DateTime foundedAt;
        private int maxMemNum;
        private int totalMembers;
        private int minAge;
        private string gender;
        private int matches;
        private int wins;
        private int loses;

        public Group() { }
        public Group(int groupId, string groupName, string description, int sportId, string groupImage, int cityId, DateTime foundedAt, int maxMemNum, int totalMembers, int minAge, string gender, int matches, int wins, int loses)
        {
            this.groupId = groupId;
            this.groupName = groupName;
            this.description = description;
            this.sportId = sportId;
            this.groupImage = groupImage;
            this.cityId = cityId;
            this.foundedAt = foundedAt;
            this.maxMemNum = maxMemNum;
            this.totalMembers = totalMembers;
            this.minAge = minAge;
            this.gender = gender;
            this.matches = matches;
            this.wins = wins;
            this.loses = loses;
        }

        public int GroupId { get => groupId; set => groupId = value; }
        public string GroupName { get => groupName; set => groupName = value; }
        public string Description { get => description; set => description = value; }
        public int SportId { get => sportId; set => sportId = value; }
        public string GroupImage { get => groupImage; set => groupImage = value; }
        public int CityId { get => cityId; set => cityId = value; }
        public DateTime FoundedAt { get => foundedAt; set => foundedAt = value; }
        public int MaxMemNum { get => maxMemNum; set => maxMemNum = value; }
        public int TotalMembers { get => totalMembers; set => totalMembers = value; }
        public int MinAge { get => minAge; set => minAge = value; }
        public string Gender { get => gender; set => gender = value; }
        public int Matches { get => matches; set => matches = value; }
        public int Wins { get => wins; set => wins = value; }
        public int Loses { get => loses; set => loses = value; }


        // This method gets all details for a specific group
        public static Group GetGroupDetails(int groupId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetGroupDetails(groupId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // This method checks if a user is an admin for a specific group
        //--------------------------------------------------------------------------------------------------
        public static bool IsUserGroupAdmin(int userId, int groupId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.IsUserGroupAdmin(userId, groupId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}
