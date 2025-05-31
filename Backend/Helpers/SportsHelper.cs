using Backend.BL;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Helpers
{
    public class SportsHelper
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<SportsHelper> _logger;
        private const string SPORTS_CACHE_KEY = "ALL_SPORTS";

        public SportsHelper(IMemoryCache memoryCache, ILogger<SportsHelper> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        // Gets all sports with caching
        public List<Sport> GetAllSports()
        {
            try
            {
                // Try to get sports from cache first
                if (_memoryCache.TryGetValue(SPORTS_CACHE_KEY, out List<Sport> sports))
                {
                    return sports;
                }

                // Cache miss - get from database using the Sport class
                var sportsFromDb = Sport.GetAllSports();

                // Cache the result
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(30))
                    .SetPriority(CacheItemPriority.High);

                _memoryCache.Set(SPORTS_CACHE_KEY, sportsFromDb, cacheOptions);

                return sportsFromDb;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sports");
                throw;
            }
        }

        // Gets a sport by Id with caching
        public Sport GetSportById(int sportId)
        {
            try
            {
                // Get all sports (from cache if available)
                var sports = GetAllSports();

                // Find the sport by ID
                return sports.FirstOrDefault(s => s.SportId == sportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sport {SportId}", sportId);
                throw;
            }
        }

        // Validates if a sport Id exists
        public bool ValidateSportId(int sportId)
        {
            try
            {
                if (sportId <= 0)
                    return false;

                var sport = GetSportById(sportId);
                return sport != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating sport {SportId}", sportId);
                return false;
            }
        }

        // Gets the name of a sport by Id
        public string GetSportName(int sportId)
        {
            try
            {
                var sport = GetSportById(sportId);
                return sport?.SportName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sport name for {SportId}", sportId);
                return null;
            }
        }
    }
}
