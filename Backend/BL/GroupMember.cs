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
    }
}
