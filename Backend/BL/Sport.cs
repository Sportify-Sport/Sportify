using Microsoft.Extensions.Caching.Memory;

namespace Backend.BL
{
    public class Sport
    {
        private int sportId;
        private string sportName;
        private string sportImage;
        private const string SPORTS_CACHE_KEY = "ALL_SPORTS";

        public Sport() { }
        public Sport(int sportId, string sportName, string sportImage)
        {
            this.sportId = sportId;
            this.sportName = sportName;
            this.sportImage = sportImage;
        }

        public int SportId { get => sportId; set => sportId = value; }
        public string SportName { get => sportName; set => sportName = value; }
        public string SportImage { get => sportImage; set => sportImage = value; }

        // Get all sports from database with caching
        public static List<Sport> GetAllSports(IMemoryCache memoryCache = null)
        {
            try
            {
                // Try to get sports from cache first
                if (memoryCache.TryGetValue(SPORTS_CACHE_KEY, out List<Sport> sports))
                {
                    //Console.WriteLine("✔️ Returned sports from cache");
                    return sports;
                }

                // Cache miss - get from database
                //Console.WriteLine("❌ Cache miss - fetching sports from DB");
                DBservices dBservices = new DBservices();
                var sportsFromDb = dBservices.GetAllSports();

                // Cache the result with a long expiration since sports rarely change
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(30))  // Cache for 30 days
                    .SetPriority(CacheItemPriority.High);          // High priority to avoid removal

                memoryCache.Set(SPORTS_CACHE_KEY, sportsFromDb, cacheOptions);

                return sportsFromDb;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Get sport by ID with caching
        public static Sport GetSportById(int sportId, IMemoryCache memoryCache = null)
        {
            try
            {
                var sports = GetAllSports(memoryCache);
                return sports.FirstOrDefault(s => s.SportId == sportId);
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        // Validate sport ID with caching
        public static bool ValidateSportId(int sportId, IMemoryCache memoryCache = null)
        {
            try
            {
                var sport = GetSportById(sportId, memoryCache);
                return sport != null;
            }
            catch (Exception ex)
            {
                // In case of error, return false for validation
                return false;
            }
        }

        // Method to invalidate cache (for admin operations)
        public static void InvalidateCache(IMemoryCache memoryCache)
        {
            if (memoryCache != null)
            {
                memoryCache.Remove(SPORTS_CACHE_KEY);
            }
        }
    }
}
