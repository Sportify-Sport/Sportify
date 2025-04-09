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
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
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

        [HttpGet("{groupId}/join-requests/pending")]
        [Authorize(Roles = "GroupAdmin")]
        public IActionResult GetPendingJoinRequests(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
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
        public IActionResult ApproveJoinRequest(int groupId, int requestId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                (bool success, string message) = GroupMember.ApproveJoinRequest(requestId, groupId);

                if (success)
                {
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPost("{groupId}/join-requests/{requestId}/reject")]
        [Authorize(Roles = "GroupAdmin")]
        public IActionResult RejectJoinRequest(int groupId, int requestId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                bool rejected = GroupMember.RejectJoinRequest(requestId, groupId);

                if (rejected)
                {
                    return Ok(new { success = true, message = "Join request rejected successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to reject the request or request doesn't exist" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }


        [HttpDelete("{groupId}/members/{userId}")]
        [Authorize(Roles = "GroupAdmin")]
        public IActionResult RemoveGroupMember(int groupId, int userId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                if (userId == currentUserId)
                {
                    return BadRequest(new { success = false, message = "Group admins cannot remove themselves from the group" });
                }

                (bool success, string message) = GroupMember.RemoveGroupMember(groupId, userId);

                if (success)
                {
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
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

        [Authorize]
        [HttpGet("{groupId}/pendingUser/{userId}")]
        public IActionResult GetUserWithPendingRequest(int groupId, int userId)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (!GroupMember.IsUserGroupAdmin(groupId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this group or group doesn't exist" });
                }

                var userDetails = GroupMember.GetUserWithPendingRequest(groupId, userId);

                if (userDetails == null)
                {
                    return NotFound(new { success = false, message = "No pending request found for this user in this group" });
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
