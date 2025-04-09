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

        //--------------------------------------------------------------------------------------------------
        // This method gets all pending join requests for the specified group
        //--------------------------------------------------------------------------------------------------
        public static (List<object>, bool) GetPendingJoinRequests(int groupId, int page = 1, int pageSize = 10)
        {
            DBservices db = new DBservices();
            return db.GetGroupPendingJoinRequests(groupId, page, pageSize);
        }

        //--------------------------------------------------------------------------------------------------
        // Submit a request to join a group
        //--------------------------------------------------------------------------------------------------
        public static string SubmitJoinRequest(int groupId, int userId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                string result = dBservices.SubmitGroupJoinRequest(groupId, userId);

                // Map result to appropriate user-friendly message
                switch (result)
                {
                    case "Success":
                        return "Your request to join the group has been submitted successfully.";

                    case "AlreadyMember":
                        return "You are already a member of this group.";

                    case "AlreadyInSportGroup":
                        return "You are already a member of another group with the same sport type. You can only join one group per sport.";

                    case "PendingRequestExists":
                        return "You already have a pending request to join this group.";

                    case "CooldownActive":
                        return "You cannot request to join this group at this time. Please try again after 1 week from your last rejection or removal or leaving of the group.";

                    default:
                        return "An error occurred while processing your request.";
                }
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }


        //--------------------------------------------------------------------------------------------------
        // Approve Join Requests
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) ApproveJoinRequest(int requestId, int groupId)
        {
            DBservices db = new DBservices();
            return db.ApproveJoinRequest(requestId, groupId);
        }

        //--------------------------------------------------------------------------------------------------
        // Reject Join Requests
        //--------------------------------------------------------------------------------------------------
        public static bool RejectJoinRequest(int requestId, int groupId)
        {
            DBservices db = new DBservices();
            return db.RejectJoinRequest(requestId, groupId);
        }

        //--------------------------------------------------------------------------------------------------
        // Remove Member from group
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) RemoveGroupMember(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.RemoveGroupMember(groupId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Leave from the  group
        //--------------------------------------------------------------------------------------------------
        public static bool LeaveGroup(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.LeaveGroup(groupId, userId);
        }

        //--------------------------------------------------------------------------------------------------
        // Gets User details that have pending request in a group
        //--------------------------------------------------------------------------------------------------
        public static object GetUserWithPendingRequest(int groupId, int userId)
        {
            DBservices db = new DBservices();
            return db.GetUserWithPendingRequest(groupId, userId);
        }
    }
}
