namespace Backend.BL
{
    public class Event
    {
        private int eventId;
        private string eventName;
        private bool requiresTeams;
        private DateTime startDatetime;
        private DateTime endDatetime;
        private int cityId;
        private int? locationId;
        private int sportId;
        private int? maxTeams;
        private DateTime createdAt;
        private bool isPublic;
        private int? winnerId;
        private int? waxParticipants;
        private int minAge;
        private string gender;
        private int participantsNum;
        private int teamsNum;
        private string profileImage;

        private string locationName;
        private double? latitude;
        private double? longitude;

        public Event() { }
        public Event(int eventId, string eventName, bool requiresTeams, DateTime startDatetime, DateTime endDatetime, int cityId, int? locationId, int sportId, int? maxTeams, DateTime createdAt, bool isPublic, int? winnerId, int? waxParticipants, int minAge, string gender, int participantsNum, int teamsNum, string profileImage, string locationName, double? latitude, double? longitude)
        {
            this.eventId = eventId;
            this.eventName = eventName;
            this.requiresTeams = requiresTeams;
            this.startDatetime = startDatetime;
            this.endDatetime = endDatetime;
            this.cityId = cityId;
            this.locationId = locationId;
            this.sportId = sportId;
            this.maxTeams = maxTeams;
            this.createdAt = createdAt;
            this.isPublic = isPublic;
            this.winnerId = winnerId;
            this.waxParticipants = waxParticipants;
            this.minAge = minAge;
            this.gender = gender;
            this.participantsNum = participantsNum;
            this.teamsNum = teamsNum;
            this.profileImage = profileImage;
            this.locationName = locationName;
            this.latitude = latitude;
            this.longitude = longitude;
        }

        public int EventId { get => eventId; set => eventId = value; }
        public string EventName { get => eventName; set => eventName = value; }
        public bool RequiresTeams { get => requiresTeams; set => requiresTeams = value; }
        public DateTime StartDatetime { get => startDatetime; set => startDatetime = value; }
        public DateTime EndDatetime { get => endDatetime; set => endDatetime = value; }
        public int CityId { get => cityId; set => cityId = value; }
        public int? LocationId { get => locationId; set => locationId = value; }
        public int SportId { get => sportId; set => sportId = value; }
        public int? MaxTeams { get => maxTeams; set => maxTeams = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }
        public bool IsPublic { get => isPublic; set => isPublic = value; }
        public int? WinnerId { get => winnerId; set => winnerId = value; }
        public int? WaxParticipants { get => waxParticipants; set => waxParticipants = value; }
        public int MinAge { get => minAge; set => minAge = value; }
        public string Gender { get => gender; set => gender = value; }
        public int ParticipantsNum { get => participantsNum; set => participantsNum = value; }
        public int TeamsNum { get => teamsNum; set => teamsNum = value; }
        public string ProfileImage { get => profileImage; set => profileImage = value; }
        public string LocationName { get => locationName; set => locationName = value; }
        public double? Latitude { get => latitude; set => latitude = value; }
        public double? Longitude { get => longitude; set => longitude = value; }





        //--------------------------------------------------------------------------------------------------
        // Get details for a specific event
        //--------------------------------------------------------------------------------------------------
        public static Event GetEventDetailsWithoutStatus(int eventId)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetEventDetailsWithoutStatus(eventId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Get random upcoming public events
        //--------------------------------------------------------------------------------------------------
        public static object GetRandomEvents(int count = 5)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetRandomEvents(count);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Get paginated events for infinite scrolling
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Events, bool HasMore) GetEventsPaginated(DateTime? lastEventDate = null, int? lastEventId = null, int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetEventsPaginated(lastEventDate, lastEventId, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Get event details with user participation status
        //--------------------------------------------------------------------------------------------------
        public static object GetEventDetailsWithParticipationStatus(int eventId, int? userId = null)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.GetEventDetailsWithParticipationStatus(eventId, userId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Checks if the user is the admin of the event
        //--------------------------------------------------------------------------------------------------
        public static bool IsUserEventAdmin(int eventId, int userId)
        {
            DBservices db = new DBservices();
            return db.IsUserEventAdmin(eventId, userId);
        }


        //--------------------------------------------------------------------------------------------------
        // Checks if the event requires teams or participants
        //--------------------------------------------------------------------------------------------------
        public static bool? EventRequiresTeams(int eventId)
        {
            DBservices db = new DBservices();
            return db.EventRequiresTeams(eventId);
        }

        //--------------------------------------------------------------------------------------------------
        // Used to update event details
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) UpdateEvent(int eventId, string eventName, string description, string locationName)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.UpdateEvent(eventId, eventName, description, locationName);
            }
            catch (Exception ex)
            {
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Used to update event image
        //--------------------------------------------------------------------------------------------------
        public static (bool Success, string Message) UpdateEventImage(int eventId, string imageFileName)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.UpdateEventImage(eventId, imageFileName);
            }
            catch (Exception ex)
            {
                return (false, $"An error occurred: {ex.Message}");
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Used to get event image
        //--------------------------------------------------------------------------------------------------
        public static string GetCurrentEventImage(int eventId)
        {
            try
            {
                DBservices dbServices = new DBservices();
                return dbServices.GetEventImage(eventId);
            }
            catch (Exception)
            {
                return null;
            }
        }

    }
}
