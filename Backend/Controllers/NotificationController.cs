using Backend.BL;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly IPushNotificationService _pushNotificationService;

        public NotificationController(IPushNotificationService pushNotificationService)
        {
            _pushNotificationService = pushNotificationService;
        }

        [Authorize(Roles = "User")]
        [HttpPost("register-token")]
        public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(request.PushToken))
                {
                    return BadRequest(new { success = false, message = "Push token is required" });
                }

                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return BadRequest(new { success = false, message = "Device ID is required" });
                }

                if (string.IsNullOrWhiteSpace(request.Platform) ||
                    (request.Platform != "ios" && request.Platform != "android"))
                {
                    return BadRequest(new { success = false, message = "Valid platform is required (ios/android)" });
                }

                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Invalid token" });
                }

                int userId = int.Parse(userIdClaim.Value);

                var success = await _pushNotificationService.RegisterOrUpdateTokenAsync(userId, request);

                if (success)
                {
                    return Ok(new { success = true, message = "Push token registered successfully" });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Failed to register push token" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "EventAdmin, GroupAdmin")]
        [HttpPost("send-admin-notification")]
        public async Task<IActionResult> SendAdminNotification([FromBody] AdminNotificationRequest request)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { success = false, message = "Message is required" });
                }

                if (request.Message.Length > 1000)
                {
                    return BadRequest(new { success = false, message = "Message cannot exceed 1000 characters" });
                }

                if (request.EventId != null && request.EventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                if (request.GroupId != null && request.GroupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid group ID" });
                }


                if (request.EventId == null && request.GroupId == null)
                {
                    return BadRequest(new { success = false, message = "Either EventId or GroupId is required" });
                }

                if (request.EventId != null && request.GroupId != null)
                {
                    return BadRequest(new { success = false, message = "Cannot specify both EventId and GroupId" });
                }

                if (!string.IsNullOrEmpty(request.Recipients))
                {
                    var validRecipients = new[] { "all", "players", "groups" };
                    if (!validRecipients.Contains(request.Recipients.ToLower()))
                    {
                        return BadRequest(new { success = false, message = "Recipients must be 'all', 'players', or 'groups'" });
                    }
                }

                // Get current user ID
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int currentUserId = int.Parse(userIdClaim.Value);

                // Get entity names
                var dbServices = new DBservices();
                string entityName = "";
                string notificationTitle = "";

                // Check admin permissions and get entity name
                if (request.EventId.HasValue)
                {
                    bool isEventAdmin = Event.IsUserEventAdmin(request.EventId.Value, currentUserId);
                    if (!isEventAdmin)
                    {
                        return StatusCode(403, new { success = false, message = "You are not authorized to send notifications for this event" });
                    }

                    entityName = dbServices.GetEventName(request.EventId.Value);
                    notificationTitle = $"Event Announcement: {entityName}";
                }

                if (request.GroupId.HasValue)
                {
                    bool isGroupAdmin = GroupMember.IsUserGroupAdmin(request.GroupId.Value, currentUserId);
                    if (!isGroupAdmin)
                    {
                        return StatusCode(403, new { success = false, message = "You are not authorized to send notifications for this group" });
                    }

                    entityName = dbServices.GetGroupName(request.GroupId.Value);
                    notificationTitle = $"Group Announcement: {entityName}";
                }

                // Get recipients
                List<int> recipients = new List<int>();

                if (request.EventId.HasValue)
                {
                    recipients = await _pushNotificationService.GetEventRecipientsAsync(
                        request.EventId.Value,
                        request.Recipients ?? "all"
                    );
                }
                else if (request.GroupId.HasValue)
                {
                    recipients = await _pushNotificationService.GetGroupRecipientsAsync(request.GroupId.Value);
                }

                if (!recipients.Any())
                {
                    return Ok(new { success = true, message = "No recipients found", sentCount = 0 });
                }

                // Send notification
                var notificationRequest = new PushNotificationRequest
                {
                    Title = notificationTitle,
                    Body = request.Message,
                    UserIds = recipients,
                    EventId = request.EventId,
                    GroupId = request.GroupId,
                    NotificationType = "admin_message",
                    Data = new Dictionary<string, object>
                    {
                        { "type", "admin_message" },
                        { "senderId", currentUserId }
                    }
                };

                // Add entity-specific data
                if (request.EventId.HasValue)
                {
                    notificationRequest.Data["eventId"] = request.EventId.Value;
                    notificationRequest.Data["eventName"] = entityName;
                }
                else if (request.GroupId.HasValue)
                {
                    notificationRequest.Data["groupId"] = request.GroupId.Value;
                    notificationRequest.Data["groupName"] = entityName;
                }

                var success = await _pushNotificationService.SendNotificationAsync(notificationRequest);

                return Ok(new
                {
                    success = success,
                    message = success ? "Notification sent successfully" : "Failed to send notification",
                    sentCount = success ? recipients.Count : 0
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpGet("history")]
        public async Task<IActionResult> GetNotificationHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Validate pagination parameters
                if (pageNumber < 1)
                {
                    return BadRequest(new { success = false, message = "Page number must be greater than 0" });
                }

                if (pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(new { success = false, message = "Page size must be between 1 and 100" });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);

                var result = await _pushNotificationService.GetUserNotificationHistoryPaginatedAsync(
                    userId, pageNumber, pageSize);

                return Ok(new
                {
                    success = true,
                    notifications = result.Notifications,
                    unreadCount = result.UnreadCount,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalCount = result.TotalCount,
                        totalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize),
                        hasMore = result.HasMore
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }


        [Authorize(Roles = "User")]
        [HttpPost("mark-read/{notificationId}")]
        public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);

                var success = await _pushNotificationService.MarkNotificationAsReadAsync(notificationId, userId);

                return Ok(new { success });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpDelete("{notificationId}")]
        public async Task<IActionResult> DeleteNotification(int notificationId)
        {
            try
            {
                // Validate input
                if (notificationId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid notification ID" });
                }

                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);

                var success = await _pushNotificationService.DeleteNotificationAsync(notificationId, userId);

                if (success)
                {
                    return Ok(new { success = true, message = "Notification deleted successfully" });
                }
                else
                {
                    return NotFound(new { success = false, message = "Notification not found or you don't have permission to delete it" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpPost("update-push-token")]
        public async Task<IActionResult> UpdatePushToken([FromBody] RegisterPushTokenRequest request)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(request.PushToken))
                {
                    return BadRequest(new { success = false, message = "Push token is required" });
                }

                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return BadRequest(new { success = false, message = "Device ID is required" });
                }

                if (string.IsNullOrWhiteSpace(request.Platform) ||
                    (request.Platform != "ios" && request.Platform != "android"))
                {
                    return BadRequest(new { success = false, message = "Valid platform is required (ios/android)" });
                }

                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { success = false, message = "Invalid token" });
                }

                int userId = int.Parse(userIdClaim.Value);

                // Check if token actually changed
                var dbServices = new DBservices();
                var currentToken = dbServices.GetUserPushToken(userId, request.DeviceId);

                if (currentToken != null && currentToken.Token == request.PushToken)
                {
                    // Token hasn't changed, just update timestamp
                    dbServices.UpdatePushTokenTimestamp(request.PushToken);
                    return Ok(new { success = true, message = "Push token is already up to date" });
                }

                // Token changed or new, register/update it
                var success = await _pushNotificationService.RegisterOrUpdateTokenAsync(userId, request);

                if (success)
                {
                    return Ok(new { success = true, message = "Push token updated successfully" });
                }
                else
                {
                    return StatusCode(500, new { success = false, message = "Failed to update push token" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred" });
            }
        }

    }
}