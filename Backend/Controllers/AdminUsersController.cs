using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
    public class AdminUsersController : ControllerBase
    {
        private readonly ILogger<AdminUsersController> _logger;

        public AdminUsersController(ILogger<AdminUsersController> logger)
        {
            _logger = logger;
        }

        [HttpGet("search")]
        public IActionResult SearchUsers([FromQuery] string emailOrId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int adminUserId = int.Parse(userIdClaim.Value);
                string adminUserName = User.FindFirst("name")?.Value ?? "Unknown";

                // Log the search request
                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) searched for users with query: {Query}",
                    adminUserName, adminUserId, emailOrId ?? "empty");

                if (string.IsNullOrWhiteSpace(emailOrId))
                {
                    return BadRequest(new { success = false, message = "Search query is required" });
                }

                // Perform the search (limited to 5 results)
                DBservices dbServices = new DBservices();
                var users = dbServices.SearchUsersForAdmin(emailOrId, 5);

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users with query: {Query}", emailOrId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
