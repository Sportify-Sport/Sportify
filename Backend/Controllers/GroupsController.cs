using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupsController : ControllerBase
    {
        [AllowAnonymous]
        [HttpGet("group/{groupId}")]
        public IActionResult GetGroupDetails(int groupId)
        {
            try
            {
                var groupDetails = Group.GetGroupDetails(groupId);

                if (groupDetails == null)
                {
                    return NotFound($"Group with ID {groupId} not found");
                }

                return Ok(groupDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving group details: {ex.Message}");
            }
        }

        [HttpGet("group/{groupId}/isAdmin")]
        [Authorize(Roles = "User")]
        public IActionResult IsUserGroupAdmin(int groupId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                bool isAdmin = Group.IsUserGroupAdmin(userId, groupId);

                return Ok(new { success = true, isAdmin });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}
