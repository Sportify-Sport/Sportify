namespace Backend.BL
{
    public static class Search
    {
        //--------------------------------------------------------------------------------------------------
        // Searches for group based on provided filters with pagination
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Results, bool HasMore) SearchGroups(
            string name = null,
            int? sportId = null,
            int? cityId = null,
            int? minAge = null,
            int? maxAge = null,
            string gender = null,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.SearchGroups(name, sportId, cityId, minAge, maxAge, gender, page, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        //--------------------------------------------------------------------------------------------------
        // Searches for events based on provided filters with pagination
        //--------------------------------------------------------------------------------------------------
        public static (List<object> Results, bool HasMore) SearchEvents(
            string name = null,
            int? sportId = null,
            int? cityId = null,
            int? minAge = null,
            int? maxAge = null,
            string gender = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int page = 1,
            int pageSize = 10)
        {
            try
            {
                DBservices dBservices = new DBservices();
                return dBservices.SearchEvents(name, sportId, cityId, minAge, maxAge, gender, startDate, endDate, page, pageSize);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }
    }
}
