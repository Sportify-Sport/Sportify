namespace Backend.BL
{
    public class EventParticipant
    {
        private int userId;
        private int eventId;
        private bool playWatch;

        public EventParticipant() { }
        public EventParticipant(int userId, int eventId, bool playWatch)
        {
            this.UserId = userId;
            this.EventId = eventId;
            this.PlayWatch = playWatch;
        }

        public int UserId { get => userId; set => userId = value; }
        public int EventId { get => eventId; set => eventId = value; }
        public bool PlayWatch { get => playWatch; set => playWatch = value; }



        //--------------------------------------------------------------------------------------------------
        // Get Event Players with pagination
        //--------------------------------------------------------------------------------------------------
        public static (List<object>, bool) GetEventPlayers(int eventId, int page, int pageSize)
        {
            DBservices db = new DBservices();
            return db.GetEventPlayers(eventId, page, pageSize);
        }

        //--------------------------------------------------------------------------------------------------
        // Join requests for playing and watching the events
        //--------------------------------------------------------------------------------------------------
        public static string ProcessJoinRequest(int eventId, int userId, bool playWatch)
        {
            DBservices db = new DBservices();
            return db.ProcessEventJoinRequest(eventId, userId, playWatch);
        }


        //--------------------------------------------------------------------------------------------------
        // This function is for canceling registeration to an event if he is watching or canceling a join request to play in a event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) CancelEventJoinRequest(int eventId, int userId)
        {
            DBservices db = new DBservices();
            return db.CancelEventJoinRequest(eventId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Process a request for a user to leave an event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) LeaveEvent(int eventId, int userId)
        {
            DBservices db = new DBservices();
            return db.LeaveEvent(eventId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Allows an admin to remove a player from an event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) RemovePlayerFromEvent(int eventId, int playerUserId, int adminUserId)
        {
            DBservices db = new DBservices();
            return db.AdminRemoveEventPlayer(eventId, playerUserId, adminUserId);
        }

        //--------------------------------------------------------------------------------------------------
        // Allows an admin to process (approve/reject) a join request
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage) AdminProcessJoinRequest(int eventId, int requestUserId, int adminUserId, bool approve)
        {
            DBservices db = new DBservices();
            return db.AdminProcessJoinRequest(eventId, requestUserId, adminUserId, approve);
        }

        //--------------------------------------------------------------------------------------------------
        // Gets all pending join requests for an event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage, List<object> Requests, bool HasMore) GetPendingJoinRequests(int eventId, int adminUserId, int page, int pageSize)
        {
            DBservices db = new DBservices();
            return db.GetEventPendingJoinRequests(eventId, adminUserId, page, pageSize);
        }


        //--------------------------------------------------------------------------------------------------
        // Gets details of a user with pending request for an event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage, object UserDetails) GetPendingRequestUserDetails(int eventId, int userId, int adminUserId)
        {
            DBservices db = new DBservices();
            return db.GetEventPendingRequestUserDetails(eventId, userId, adminUserId);
        }

        //--------------------------------------------------------------------------------------------------
        // Gets details of a user who is a player in an event
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string ErrorMessage, object UserDetails) GetPlayerDetails(int eventId, int userId, int adminUserId)
        {
            DBservices db = new DBservices();
            return db.GetEventPlayerDetails(eventId, userId, adminUserId);
        }
    }
}
