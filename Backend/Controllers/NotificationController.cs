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

        [Authorize(Roles = "User")]
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

                if (request.EventId == null && request.GroupId == null)
                {
                    return BadRequest(new { success = false, message = "Either EventId or GroupId is required" });
                }

                if (request.EventId != null && request.GroupId != null)
                {
                    return BadRequest(new { success = false, message = "Cannot specify both EventId and GroupId" });
                }

                // Get current user ID
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int currentUserId = int.Parse(userIdClaim.Value);

                // Check admin permissions
                if (request.EventId.HasValue)
                {
                    bool isEventAdmin = Event.IsUserEventAdmin(request.EventId.Value, currentUserId);
                    if (!isEventAdmin)
                    {
                        return Forbid("You are not authorized to send notifications for this event");
                    }
                }

                if (request.GroupId.HasValue)
                {
                    bool isGroupAdmin = GroupMember.IsUserGroupAdmin(request.GroupId.Value, currentUserId);
                    if (!isGroupAdmin)
                    {
                        return Forbid("You are not authorized to send notifications for this group");
                    }
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
                    Title = request.EventId.HasValue ? "Event Announcement" : "Group Announcement",
                    Body = request.Message,
                    UserIds = recipients,
                    EventId = request.EventId,
                    GroupId = request.GroupId,
                    NotificationType = "admin_message",
                    Data = new Dictionary<string, object>
                    {
                        { "type", "admin_message" },
                        { "eventId", request.EventId },
                        { "groupId", request.GroupId },
                        { "senderId", currentUserId }
                    }
                };

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
        public async Task<IActionResult> GetNotificationHistory()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);

                var notifications = await _pushNotificationService.GetUserNotificationHistoryAsync(userId);

                return Ok(new { success = true, notifications });
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
    }
}