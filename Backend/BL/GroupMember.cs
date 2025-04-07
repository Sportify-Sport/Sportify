namespace Backend.BL
{
    public class GroupMember
    {
        private int groupId;
        private int userId;
        private DateTime joinedAt;

        public GroupMember() { }

        public GroupMember(int groupId, int userId, DateTime joinedAt)
        {
            this.groupId = groupId;
            this.userId = userId;
            this.joinedAt = joinedAt;
        }

        public int GroupId { get => groupId; set => groupId = value; }
        public int UserId { get => userId; set => userId = value; }
        public DateTime JoinedAt { get => joinedAt; set => joinedAt = value; }

        //--------------------------------------------------------------------------------------------------
        // Gets all members of a specific group with pagination
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Members, bool HasMore) GetGroupMembers(int groupId, int page = 1, int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetGroupMembers(groupId, page, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Check if user is an admin of this group
        //--------------------------------------------------------------------------------------------------
        public static bool IsUserGroupAdmin(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.IsUserGroupAdmin(groupId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Check if user is a member of this group
        //--------------------------------------------------------------------------------------------------
        public static bool IsUserGroupMember(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.IsUserGroupMember(groupId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Get user details for a group member
        //--------------------------------------------------------------------------------------------------
        public static object GetGroupUserDetails(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.GetGroupUserDetails(groupId, userId);
        }
    }
}
