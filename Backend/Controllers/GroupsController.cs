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
        //[AllowAnonymous]
        //[HttpGet("group/{groupId}")]
        //public IActionResult GetGroupDetails(int groupId)
        //{
        //    try
        //    {
        //        var groupDetails = Group.GetGroupDetails(groupId);

        //        if (groupDetails == null)
        //        {
        //            return NotFound($"Group with ID {groupId} not found");
        //        }

        //        return Ok(groupDetails);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"An error occurred while retrieving group details: {ex.Message}");
        //    }
        //}


        [AllowAnonymous]
        [HttpGet("GetGroups")]
        public IActionResult GetGroups([FromQuery] int? lastGroupId = null, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate pagination parameters
                if (pageSize < 1 || pageSize > 50) pageSize = 10;

                // Get paginated groups
                var result = Group.GetGroupsPaginated(lastGroupId, pageSize);

                return Ok(new
                {
                    success = true,
                    data = result.Groups,
                    hasMore = result.HasMore
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }


        [AllowAnonymous]
        [HttpGet("{groupId}")]
        public IActionResult GetGroupDetails(int groupId)
        {
            try
            {
                int? userId = null;
                if (User.Identity.IsAuthenticated)
                {
                    userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                }

                var groupDetails = BL.Group.GetGroupDetailsWithMembershipStatus(groupId, userId);

                if (groupDetails == null)
                {
                    return NotFound(new { success = false, message = $"Group with ID {groupId} not found" });
                }

                return Ok(new { success = true, data = groupDetails });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }


        [Authorize(Roles = "User")]
        [HttpPost("joinRequest/{groupId}")]
        public IActionResult RequestToJoinGroup(int groupId)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                string result = Group.SubmitJoinRequest(groupId, userId);

                bool success = result.Contains("successfully");

                return Ok(new { success, message = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "User")]

        [HttpGet("{groupId}/upcoming-events")]
        public IActionResult GetUpcomingGroupEvents(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
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

                (List<object> events, bool hasMore) = Group.GetUpcomingGroupEvents(groupId, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = events,
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

        
    }
}
