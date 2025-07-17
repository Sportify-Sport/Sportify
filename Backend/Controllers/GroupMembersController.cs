using Backend.BL;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupMembersController : ControllerBase
    {
        private readonly ILogger<GroupMembersController> _logger;
        private readonly IPushNotificationService _pushNotificationService;

        public GroupMembersController(ILogger<GroupMembersController> logger, IPushNotificationService pushNotificationService)
        {
            _logger = logger;
            _pushNotificationService = pushNotificationService;
        }


        [AllowAnonymous]
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
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";


                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to view user details for user {UserId} in group {GroupId} without being a group admin",
                        adminName, currentUserId, userId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                if (!GroupMember.IsUserGroupMember(groupId, userId))
                {
                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) attempted to view details for non-member user {UserId} in group {GroupId}",
                        adminName, currentUserId, userId, groupId);
                    return BadRequest(new { success = false, message = "User is not a member of this group" });
                }

                var userDetails = GroupMember.GetGroupUserDetails(groupId, userId);

                if (userDetails == null)
                {
                    //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested details for non-existent user {UserId} in group {GroupId}",
                    //    adminName, currentUserId, userId, groupId);
                    return NotFound(new { success = false, message = "User not found" });
                }

                return Ok(new { success = true, data = userDetails });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving group user details for user {UserId} in group {GroupId}", userId, groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("{groupId}/join-requests/pending")]
        [Authorize(Roles = "GroupAdmin")]
        public IActionResult GetPendingJoinRequests(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to view pending join requests for group {GroupId} without being a group admin",
                        adminName, currentUserId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                var (requests, hasMore) = GroupMember.GetPendingJoinRequests(groupId, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = requests,
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
                _logger.LogError(ex, "Error retrieving pending join requests for group {GroupId}", groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpPost("joinRequest/{groupId}")]
        public IActionResult RequestToJoinGroup(int groupId)
        {
            try
            {
                if (groupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid group Id" });
                }

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                if (GroupMember.IsUserGroupAdmin(groupId, userId))
                {
                    return BadRequest(new { success = false, message = "Group admins cannot join the group he is admin to" });
                }

                string result = GroupMember.SubmitJoinRequest(groupId, userId);

                bool success = result.Contains("successfully");

                return Ok(new { success, message = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{groupId}/join-requests/{requestId}/approve")]
        [Authorize(Roles = "GroupAdmin")]
        public async Task<IActionResult> ApproveJoinRequest(int groupId, int requestId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to approve join request {RequestId} for group {GroupId} without being a group admin",
                        adminName, currentUserId, requestId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                (bool success, string message) = GroupMember.ApproveJoinRequest(requestId, groupId);

                if (success)
                {
                    var dbServices = new DBservices();
                    int userId = dbServices.GetUserIdFromGroupJoinRequest(requestId);
                    var groupName = dbServices.GetGroupName(groupId);

                    if (userId == 0)
                    {
                        return NotFound(new { success = false, message = "Join request not found" });
                    }

                    // Send notification to the user
                    await NotificationHelper.SendUserNotificationAsync(
                        _pushNotificationService,
                        userId,
                        "Welcome to the Group! 🎉",
                        $"Your request to join the group '{groupName}' has been approved!",
                        "group_join_approved",
                        new Dictionary<string, object>
                        {
                            { "groupId", groupId },
                            { "groupName", groupName }
                        }
                    );

                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) approved join request {RequestId} for group {GroupId}",
                        adminName, currentUserId, requestId, groupId);
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) failed to approve join request {RequestId} for group {GroupId}: {Message}",
                        adminName, currentUserId, requestId, groupId, message);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving join request {RequestId} for group {GroupId}", requestId, groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{groupId}/join-requests/{requestId}/reject")]
        [Authorize(Roles = "GroupAdmin")]
        public async Task<IActionResult> RejectJoinRequest(int groupId, int requestId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to reject join request {RequestId} for group {GroupId} without being a group admin",
                        adminName, currentUserId, requestId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                bool rejected = GroupMember.RejectJoinRequest(requestId, groupId);

                if (rejected)
                {
                    var dbServices = new DBservices();
                    int userId = dbServices.GetUserIdFromGroupJoinRequest(requestId);
                    var groupName = dbServices.GetGroupName(groupId);

                    if (userId == 0)
                    {
                        return NotFound(new { success = false, message = "Join request not found" });
                    }

                    // Send notification to the user
                    await NotificationHelper.SendUserNotificationAsync(
                        _pushNotificationService,
                        userId,
                        "Group Request Rejected",
                        $"Your request to join the group '{groupName}' has been rejected.",
                        "group_join_rejected",
                        new Dictionary<string, object>
                        {
                            { "groupId", groupId },
                            { "groupName", groupName }
                        }
                    );

                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) rejected join request {RequestId} for group {GroupId}",
                       adminName, currentUserId, requestId, groupId);
                    return Ok(new { success = true, message = "Join request rejected successfully" });
                }
                else
                {
                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) failed to reject join request {RequestId} for group {GroupId}",
                        adminName, currentUserId, requestId, groupId);
                    return BadRequest(new { success = false, message = "Failed to reject the request or request doesn't exist" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rejecting join request {RequestId} for group {GroupId}", requestId, groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }


        [HttpDelete("{groupId}/members/{userId}")]
        [Authorize(Roles = "GroupAdmin")]
        public async Task<IActionResult> RemoveGroupMember(int groupId, int userId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to remove member {UserId} from group {GroupId} without being a group admin",
                        adminName, currentUserId, userId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                if (userId == currentUserId)
                {
                    _logger.LogWarning("Admin {AdminName} (ID: {AdminId}) attempted to remove himself from group {GroupId}",
                        adminName, currentUserId, groupId);
                    return BadRequest(new { success = false, message = "Group admins cannot remove themselves from the group" });
                }

                (bool success, string message) = GroupMember.RemoveGroupMember(groupId, userId);

                if (success)
                {
                    var dbServices = new DBservices();
                    var groupName = dbServices.GetGroupName(groupId);

                    // Send notification to the removed member
                    await NotificationHelper.SendUserNotificationAsync(
                        _pushNotificationService,
                        userId,
                        "Removed from Group",
                        $"You have been removed from the group '{groupName}'.",
                        "removed_from_group",
                        new Dictionary<string, object>
                        {
                            { "groupId", groupId },
                            { "groupName", groupName }
                        }
                    );

                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) removed member {UserId} from group {GroupId}",
                        adminName, currentUserId, userId, groupId);
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) failed to remove member {UserId} from group {GroupId}: {Message}",
                        adminName, currentUserId, userId, groupId, message);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing member {UserId} from group {GroupId}", userId, groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{groupId}/leave")]
        [Authorize(Roles = "User")]
        public IActionResult LeaveGroup(int groupId)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                bool success = GroupMember.LeaveGroup(groupId, userId);

                if (success)
                {
                    return Ok(new { success = true, message = "You have successfully left the group" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to leave the group or you are not a member" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "GroupAdmin")]
        [HttpGet("{groupId}/pendingUser/{userId}")]
        public IActionResult GetUserWithPendingRequest(int groupId, int userId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                if (groupId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid group Id or user Id" });
                }

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    _logger.LogWarning("Unauthorized access: Admin {AdminName} (ID: {AdminId}) attempted to view pending request for user {UserId} in group {GroupId} without being a group admin",
                        adminName, currentUserId, userId, groupId);
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                var userDetails = GroupMember.GetUserWithPendingRequest(groupId, userId);

                if (userDetails == null)
                {
                    //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) checked for pending request for user {UserId} in group {GroupId} but none found",
                    //    adminName, currentUserId, userId, groupId);
                    return NotFound(new { success = false, message = "No pending request found for this user in this group" });
                }

                return Ok(new { success = true, data = userDetails });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending request details for user {UserId} in group {GroupId}", userId, groupId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpPost("{groupId}/cancel-request")]
        public IActionResult CancelGroupJoinRequest(int groupId)
        {
            try
            {
                if (groupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid group Id" });
                }

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = GroupMember.CancelGroupJoinRequest(groupId, userId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "Group join request canceled successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}
