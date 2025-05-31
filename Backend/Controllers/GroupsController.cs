using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Backend.Models;
using Backend.Helpers;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupsController : ControllerBase
    {
        private readonly ILogger<GroupsController> _logger;

        public GroupsController(ILogger<GroupsController> logger)
        {
            _logger = logger;
        }

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

        [HttpPut("{groupId}")]
        [Authorize(AuthenticationSchemes = "Bearer,AdminScheme", Roles = "GroupAdmin,CityOrganizer")]
        public IActionResult UpdateGroup(int groupId, [FromBody] UpdateGroupDto updateDto)
        {
            try
            {
                // Get user ID from claims
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Input validation
                if (string.IsNullOrWhiteSpace(updateDto.GroupName))
                {
                    return BadRequest(new { success = false, message = "Group name is required" });
                }

                if (updateDto.GroupName.Length > 100)
                {
                    return BadRequest(new { success = false, message = "Group name cannot exceed 100 characters" });
                }

                if (updateDto.Description?.Length > 500)
                {
                    return BadRequest(new { success = false, message = "Description cannot exceed 500 characters" });
                }

                // Check authorization - first get the group's city id
                DBservices dbServices = new DBservices();
                var groupCityId = dbServices.GetGroupCityId(groupId);
                if (!groupCityId.HasValue)
                {
                    return NotFound(new { success = false, message = "Group not found" });
                }

                // Check if user is group admin or city organizer
                bool isGroupAdmin = GroupMember.IsUserGroupAdmin(groupId, currentUserId);
                bool isCityOrganizer = dbServices.IsUserCityOrganizer(currentUserId, groupCityId.Value);

                if (!isGroupAdmin && !isCityOrganizer)
                {
                    _logger.LogWarning("Unauthorized group update attempt: User {UserName} (ID: {UserId}) tried to update group {GroupId}",
                        userName, currentUserId, groupId);
                    return StatusCode(403, new { success = false, message = "You do not have permission to edit this group" });
                }

                // Update group
                string editorRole = isGroupAdmin ? "GroupAdmin" : "CityOrganizer";
                var (success, message) = Group.UpdateGroup(groupId, updateDto.GroupName.Trim(), updateDto.Description?.Trim());

                if (success)
                {
                    _logger.LogInformation("{EditorRole} {UserName} (ID: {UserId}) updated group {GroupId}",
                        editorRole, userName, currentUserId, groupId);
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    _logger.LogWarning("{EditorRole} {UserName} (ID: {UserId}) failed to update group {GroupId}: {Message}",
                        editorRole, userName, currentUserId, groupId, message);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating group {GroupId}", groupId);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the group" });
            }
        }

        [HttpPut("{groupId}/image")]
        [Authorize(AuthenticationSchemes = "Bearer,AdminScheme", Roles = "GroupAdmin,CityOrganizer")]
        public async Task<IActionResult> UpdateGroupImage(int groupId, IFormFile groupImage)
        {
            try
            {
                // Get user ID from claims
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                if (groupImage == null || groupImage.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No image file provided" });
                }

                // Check authorization
                DBservices dbServices = new DBservices();
                var groupCityId = dbServices.GetGroupCityId(groupId);
                if (!groupCityId.HasValue)
                {
                    _logger.LogWarning("Group image update failed: User {UserName} (ID: {UserId}) - Group {GroupId} not found",
                        userName, currentUserId, groupId);
                    return NotFound(new { success = false, message = "Group not found" });
                }

                // Check if user is group admin or city organizer
                bool isGroupAdmin = GroupMember.IsUserGroupAdmin(groupId, currentUserId);
                bool isCityOrganizer = dbServices.IsUserCityOrganizer(currentUserId, groupCityId.Value);

                if (!isGroupAdmin && !isCityOrganizer)
                {
                    _logger.LogWarning("Unauthorized group image update: User {UserName} (ID: {UserId}) tried to update group {GroupId}",
                        userName, currentUserId, groupId);
                    return StatusCode(403, new { success = false, message = "You do not have permission to edit this group" });
                }

                // Get current group image
                string currentImage = Group.GetCurrentGroupImage(groupId);

                // Process the image
                string imageFileName = await ImageHelper.ProcessImage(groupImage, "group", groupId, currentImage);

                // Update the group image in the database
                var (success, message) = Group.UpdateGroupImage(groupId, imageFileName);

                if (success)
                {
                    string editorRole = isGroupAdmin ? "GroupAdmin" : "CityOrganizer";
                    _logger.LogInformation("{EditorRole} {UserName} (ID: {UserId}) updated image for group {GroupId}",
                        editorRole, userName, currentUserId, groupId);

                    return Ok(new { success = true, message = message });
                }
                else
                {
                    // Delete the newly uploaded image if database update failed
                    ImageHelper.DeleteImage(imageFileName);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating image for group {GroupId}", groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}
