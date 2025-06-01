using Backend.BL;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.Helpers
{
    public class SportsHelper
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<SportsHelper> _logger;
        private const string SPORTS_CACHE_KEY = "ALL_SPORTS";

        // Single semaphore for sports since we cache all sports together
        private static readonly SemaphoreSlim _semaphore = new(1, 1);

        public SportsHelper(IMemoryCache memoryCache, ILogger<SportsHelper> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        // Gets all sports with caching and thread safety
        public async Task<List<Sport>> GetAllSportsAsync()
        {
            try
            {
                // Check cache first (fast path)
                if (_memoryCache.TryGetValue(SPORTS_CACHE_KEY, out List<Sport> sports))
                {
                    return sports;
                }

                // Wait for exclusive access
                await _semaphore.WaitAsync();

                try
                {
                    // Double-check cache after acquiring lock
                    if (_memoryCache.TryGetValue(SPORTS_CACHE_KEY, out sports))
                    {
                        return sports;
                    }

                    _logger.LogDebug("Fetching sports from database");

                    // Only one thread will reach here
                    var sportsFromDb = Sport.GetAllSports();

                    // Cache the result
                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetAbsoluteExpiration(TimeSpan.FromDays(30))
                        .SetPriority(CacheItemPriority.High);

                    _memoryCache.Set(SPORTS_CACHE_KEY, sportsFromDb, cacheOptions);

                    return sportsFromDb;
                }
                finally
                {
                    _semaphore.Release();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sports");
                throw;
            }
        }

        // Synchronous version for backward compatibility
        public List<Sport> GetAllSports()
        {
            return GetAllSportsAsync().GetAwaiter().GetResult();
        }

        // Gets a sport by Id with caching
        public async Task<Sport> GetSportByIdAsync(int sportId)
        {
            try
            {
                var sports = await GetAllSportsAsync();
                return sports.FirstOrDefault(s => s.SportId == sportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sport {SportId}", sportId);
                throw;
            }
        }

        public Sport GetSportById(int sportId)
        {
            return GetSportByIdAsync(sportId).GetAwaiter().GetResult();
        }

        // Validates if a sport Id exists
        public async Task<bool> ValidateSportIdAsync(int sportId)
        {
            try
            {
                if (sportId <= 0)
                    return false;

                var sport = await GetSportByIdAsync(sportId);
                return sport != null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating sport {SportId}", sportId);
                return false;
            }
        }

        public bool ValidateSportId(int sportId)
        {
            return ValidateSportIdAsync(sportId).GetAwaiter().GetResult();
        }

        // Gets the name of a sport by Id
        public async Task<string> GetSportNameAsync(int sportId)
        {
            try
            {
                var sport = await GetSportByIdAsync(sportId);
                return sport?.SportName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sport name for {SportId}", sportId);
                return null;
            }
        }

        public string GetSportName(int sportId)
        {
            return GetSportNameAsync(sportId).GetAwaiter().GetResult();
        }

        public void ClearCache()
        {
            _memoryCache.Remove(SPORTS_CACHE_KEY);
            _logger.LogInformation("Sports cache cleared");
        }
    }
}
