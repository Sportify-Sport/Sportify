using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Caching.Memory;
using Backend.Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SportsController : ControllerBase
    {
        private readonly SportService _sportsHelper;
        private readonly ILogger<SportsController> _logger;

        public SportsController(SportService sportsHelper, ILogger<SportsController> logger)
        {
            _sportsHelper = sportsHelper;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetAllSports()
        {
            try
            {
                var sports = _sportsHelper.GetAllSports();
                return Ok(sports);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sports");
                return StatusCode(500, "An error occurred while retrieving sports");
            }
        }

        //[AllowAnonymous]
        //[HttpGet("{id}")]
        //public IActionResult GetSportById(int id)
        //{
        //    try
        //    {
        //        var sport = _sportsHelper.GetSportById(id);
        //        if (sport == null)
        //        {
        //            return NotFound(new { success = false, message = "Sport not found" });
        //        }

        //        return Ok(sport);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error retrieving sport {SportId}", id);
        //        return StatusCode(500, "An error occurred while retrieving the sport");
        //    }
        //}

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

    }
}
