using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Principal;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        [HttpGet("groups/top3")]
        [Authorize(Roles = "User")]
        public IActionResult GetTop3Groups()
        {
            try
            {                
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                User user = new User { UserId = userId };

                var groups = user.GetTop3Groups();

                return Ok(groups);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving user groups");
            }
        }

        [HttpGet("profile")]
        [Authorize(Roles = "User")]
        public IActionResult GetUserProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var userProfile = BL.User.GetUserProfile(userId);

                if (userProfile == null)
                {
                    return NotFound($"User with ID {userId} not found");
                }

                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving user profile: {ex.Message}");
            }
        }
    }
}
