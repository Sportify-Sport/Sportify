using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SportsController : ControllerBase
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<SportsController> _logger;
        private const string SPORTS_CACHE_KEY = "ALL_SPORTS";

        // Inject the IMemoryCache service
        public SportsController(IMemoryCache memoryCache, ILogger<SportsController> logger)
        {
            _memoryCache = memoryCache;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetAllSports()
        {
            try
            {
                // Try to get sports from cache first
                if (_memoryCache.TryGetValue(SPORTS_CACHE_KEY, out var sports))
                {
                    //_logger.LogInformation("Cache HIT for sports data"); // For debuging
                    //Response.Headers.Add("X-Cache", "HIT"); // For debuging
                    return Ok(sports);
                }

                //_logger.LogInformation("Cache MISS for sports data - fetching from database"); // For debuging

                // Cache miss - get from database
                //Response.Headers.Add("X-Cache", "MISS");// For debuging
                var sportsFromDb = Sport.GetAllSports();

                // Cache the result with a long expiration since sports rarely change
                var cacheOptions = new MemoryCacheEntryOptions()
                    //.SetAbsoluteExpiration(TimeSpan.FromMinutes(1))  // Cache for 1 minute (testing)
                    .SetAbsoluteExpiration(TimeSpan.FromDays(30))  // Cache for 30 days
                    .SetPriority(CacheItemPriority.High);          // High priority to avoid removal

                _memoryCache.Set(SPORTS_CACHE_KEY, sportsFromDb, cacheOptions);

                return Ok(sportsFromDb);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sports");
                return StatusCode(500, "An error occurred while retrieving sports");
            }
        }

        //[Authorize(Roles = "Admin")]  // Restrict to admins
        //[HttpPost]
        //public IActionResult AddSport([FromBody] Sport newSport)
        //{
        //    try
        //    {
        //        // Add to database
        //        bool success = Sport.AddSport(newSport);

        //        if (success)
        //        {
        //            // Remove cached sports to force a refresh on next request
        //            _memoryCache.Remove(SPORTS_CACHE_KEY);
        //            return Ok(new { success = true });
        //        }

        //        return BadRequest(new { success = false });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, "An error occurred");
        //    }
        //}

    }
}
