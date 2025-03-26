namespace Backend.BL
{
    public class GroupMember
    {
        private int groupId;
        private int userId;
        private DateTime joinedAt;

        public GroupMember(int groupId, int userId, DateTime joinedAt)
        {
            this.groupId = groupId;
            this.userId = userId;
            this.joinedAt = joinedAt;
        }

        public int GroupId { get => groupId; set => groupId = value; }
        public int UserId { get => userId; set => userId = value; }
        public DateTime JoinedAt { get => joinedAt; set => joinedAt = value; }
    }
}
