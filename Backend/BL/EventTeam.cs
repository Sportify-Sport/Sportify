namespace Backend.BL
{
    public class EventTeam
    {
        private int eventId;
        private int groupId;
        private int scoreNum;

        public EventTeam() { }
        public EventTeam(int eventId, int groupId, int scoreNum)
        {
            this.EventId = eventId;
            this.GroupId = groupId;
            this.ScoreNum = scoreNum;
        }

        public int EventId { get => eventId; set => eventId = value; }
        public int GroupId { get => groupId; set => groupId = value; }
        public int ScoreNum { get => scoreNum; set => scoreNum = value; }

        //--------------------------------------------------------------------------------------------------
        // Join a team event as a spectator
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) JoinTeamEventAsSpectator(int eventId, int userId)
        {
            DBservices db = new DBservices();
            return db.JoinTeamEventAsSpectator(eventId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Cancel spectating a team event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) CancelTeamEventSpectating(int eventId, int userId)
        {
            DBservices db = new DBservices();
            return db.CancelTeamEventSpectating(eventId, userId);
        }


        //--------------------------------------------------------------------------------------------------
        // Gets paginated list of groups registered in a team event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage, List<object> Groups, bool HasMore) GetTeamEventGroups(int eventId, int page, int pageSize)
        {
            DBservices db = new DBservices();
            return db.GetTeamEventGroups(eventId, page, pageSize);
        }

        //--------------------------------------------------------------------------------------------------
        // This method is for removing a group from the specified event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) RemoveGroupFromEvent(int eventId, int groupId, int adminUserId)
        {
            DBservices db = new DBservices();
            return db.RemoveGroupFromEvent(eventId, groupId, adminUserId);
        }

        //--------------------------------------------------------------------------------------------------
        // This method is for adding a group for the specified event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) AddGroupToEvent(int eventId, int groupId, int adminUserId)
        {
            DBservices db = new DBservices();
            return db.AddGroupToEvent(eventId, groupId, adminUserId);
        }
    }
}
