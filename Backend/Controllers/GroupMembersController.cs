using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupMembersController : ControllerBase
    {
        [Authorize(Roles = "User")]
        [HttpGet("members/{groupId}")]
        public IActionResult GetGroupMembers(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                (List<object> members, bool hasMore) = GroupMember.GetGroupMembers(groupId, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = members,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        hasMore = hasMore
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("{groupId}/users/{userId}/details")]
        [Authorize(Roles = "GroupAdmin")]
        public IActionResult GetGroupUserDetails(int groupId, int userId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group" });
                }

                if (!GroupMember.IsUserGroupMember(groupId, userId))
                {
                    return BadRequest(new { success = false, message = "User is not a member of this group" });
                }

                var userDetails = GroupMember.GetGroupUserDetails(groupId, userId);

                if (userDetails == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                return Ok(new { success = true, data = userDetails });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}
