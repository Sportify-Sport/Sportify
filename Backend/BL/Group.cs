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


        //// This method gets all details for a specific group
        //public static Group GetGroupDetails(int groupId)
        //{
        //    try
        //    {
        //        DBservices dBservices = new DBservices();
        //        return dBservices.GetGroupDetails(groupId);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw ex;
        //    }
        //}

        //--------------------------------------------------------------------------------------------------
        // Get paginated groups for infinite scrolling
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Groups, bool HasMore) GetGroupsPaginated(int? lastGroupId = null, int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetGroupsPaginated(lastGroupId, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Get group details with optional user membership status
        //--------------------------------------------------------------------------------------------------
        public static object GetGroupDetailsWithMembershipStatus(int groupId, int? userId = null)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetGroupDetailsWithMembershipStatus(groupId, userId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        //--------------------------------------------------------------------------------------------------
        // Gets upcoming events for a specific group with pagination
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Events, bool HasMore) GetUpcomingGroupEvents(int groupId, int page = 1, int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetUpcomingGroupEvents(groupId, page, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Updates group details
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) UpdateGroup(int groupId, string groupName, string description)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.UpdateGroup(groupId, groupName, description);
            }
            catch (Exception ex)
            {
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Updates group image
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) UpdateGroupImage(int groupId, string imageFileName)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.UpdateGroupImage(groupId, imageFileName);
            }
            catch (Exception ex)
            {
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Gets group current image
        //--------------------------------------------------------------------------------------------------
        public static string GetCurrentGroupImage(int groupId)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.GetGroupImage(groupId);
            }
            catch (Exception)
            {
                return null;
            }
        }

    }
}
