using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
    public class AdminCityController : ControllerBase
    {
        private readonly ILogger<AdminCityController> _logger;

        public AdminCityController(ILogger<AdminCityController> logger)
        {
            _logger = logger;
        }

        [HttpGet("managed-cities")]
        public IActionResult GetManagedCities()
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Log the action
                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested managed cities list at {Timestamp}",
                    userName, userId, DateTime.UtcNow);

                // Get the cities from the database
                DBservices dbServices = new DBservices();
                var cities = dbServices.GetManagedCities(userId);

                return Ok(cities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting managed cities");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("dashboard-stats/{cityId}")]
        public IActionResult GetDashboardStats(int cityId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access stats for city {CityId}",
                        userName, userId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Log dashboard access (audit log)
                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) accessed dashboard for city {CityId} at {Timestamp}",
                    userName, userId, cityId, DateTime.UtcNow);

                // Get dashboard statistics
                var stats = dbServices.GetCityDashboardStats(cityId);

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats for city {CityId}", cityId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
