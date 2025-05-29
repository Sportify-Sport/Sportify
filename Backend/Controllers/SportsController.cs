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
                var sports = Sport.GetAllSports(_memoryCache);
                return Ok(sports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sports");
                return StatusCode(500, "An error occurred while retrieving sports");
            }
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public IActionResult GetSportById(int id)
        {
            try
            {
                var sport = Sport.GetSportById(id, _memoryCache);
                if (sport == null)
                {
                    return NotFound(new { success = false, message = "Sport not found" });
                }

                return Ok(sport);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sport {SportId}", id);
                return StatusCode(500, "An error occurred while retrieving the sport");
            }
        }

        //[AllowAnonymous]
        //[HttpGet("debug-cache")]
        //public IActionResult CheckCache()
        //{
        //    bool isCached = _memoryCache.TryGetValue("ALL_SPORTS", out List<Sport> sports);

        //    return Ok(new
        //    {
        //        Cached = isCached,
        //        Count = sports?.Count ?? 0
        //    });
        //}

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
