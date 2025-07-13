using Backend.BL;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Reflection;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
    public class AdminEventsController : ControllerBase
    {
        private readonly ILogger<AdminEventsController> _logger;
        private readonly IPushNotificationService _pushNotificationService;

        public AdminEventsController(ILogger<AdminEventsController> logger, IPushNotificationService pushNotificationService)
        {
            _logger = logger;
            _pushNotificationService = pushNotificationService;
        }

        [HttpGet("{cityId}")]
        public IActionResult GetEventsByCity(
            int cityId,
            [FromQuery] string? name = null,
            [FromQuery] string sortBy = "name",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access events for city {CityId}",
                        userName, userId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Convert sort option from string to numeric value
                int sortOption = ConvertSortByToNumeric(sortBy);

                // Log the request
                //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested events for city {CityId} with sort: {SortBy}, search: {SearchName}",
                //    userName, userId, cityId, sortBy, name ?? "none");

                // Get events with pagination (fetch one extra item to determine if there are more)
                var events = dbServices.GetEventsByCityForAdmin(cityId, name, sortOption, page, pageSize);

                // Check if there are more items
                bool hasMore = events.Count > pageSize;

                // Remove the extra item if there are more
                if (hasMore)
                {
                    events.RemoveAt(events.Count - 1);
                }

                return Ok(new
                {
                    events,
                    hasMore,
                    currentPage = page
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting events for city {CityId}", cityId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{cityId}/event/{eventId}")]
        public IActionResult GetEventDetails(int cityId, int eventId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access event {EventId} details in city {CityId}",
                        userName, userId, eventId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Log the request
                //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested details for event {EventId} in city {CityId}",
                //    userName, userId, eventId, cityId);

                // Get event details
                var eventDetails = dbServices.GetEventDetailsForAdmin(cityId, eventId);

                if (eventDetails == null)
                {
                    return NotFound(new { success = false, message = "Event not found" });
                }

                // Get event admin details separately
                var eventAdmin = dbServices.GetEventAdmin(eventId);
                if (eventAdmin != null)
                {
                    eventDetails.EventAdminId = eventAdmin.UserId;
                    eventDetails.EventAdminName = $"{eventAdmin.FirstName} {eventAdmin.LastName}";
                    eventDetails.EventAdminImage = eventAdmin.ProfileImage;
                }

                return Ok(eventDetails);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting details for event {EventId} in city {CityId}", eventId, cityId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Helper method to convert string sort options to numeric values
        private int ConvertSortByToNumeric(string sortBy)
        {
            if (string.IsNullOrEmpty(sortBy))
                return 1; // Default to name

            return sortBy.ToLower() switch
            {
                "name" => 1,
                "sport" => 2,
                "requiresteamstrue" => 3,
                "requiresteamsfalse" => 4,
                _ => int.TryParse(sortBy, out int result) ? result : 1
            };
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateEvent([FromBody] CreateEventDto eventDto)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, eventDto.CityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to create event for city {CityId}",
                        userName, userId, eventDto.CityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Validate inputs
                if (string.IsNullOrWhiteSpace(eventDto.EventName))
                {
                    return BadRequest(new { success = false, message = "Event name is required" });
                }

                if (string.IsNullOrWhiteSpace(eventDto.LocationName))
                {
                    return BadRequest(new { success = false, message = "Location name is required" });
                }

                if (eventDto.StartDatetime >= eventDto.EndDatetime)
                {
                    return BadRequest(new { success = false, message = "End date must be after start date" });
                }

                // Validate dates are in the future
                if (eventDto.StartDatetime < DateTime.Now)
                {
                    return BadRequest(new { success = false, message = "Event start date must be in the future" });
                }

                // Validate MaxTeams/MaxParticipants based on RequiresTeams
                if (eventDto.RequiresTeams)
                {
                    if (!eventDto.MaxTeams.HasValue || eventDto.MaxTeams.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "MaxTeams is required for team events and must be greater than zero" });
                    }
                }
                else
                {
                    if (!eventDto.MaxParticipants.HasValue || eventDto.MaxParticipants.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "MaxParticipants is required for individual events and must be greater than zero" });
                    }
                }

                // Validate MinAge
                if (eventDto.MinAge <= 0)
                {
                    return BadRequest(new { success = false, message = "Minimum age must be greater than zero" });
                }

                if (!new[] { "Female", "Male", "Mixed" }.Contains(eventDto.Gender))
                {
                    return BadRequest(new { success = false, message = "Gender must be 'Female', 'Male', or 'Mixed'" });
                }

                // Validate SportId exists
                var sports = dbServices.GetAllSports();
                bool sportExists = sports.Any(s => s.SportId == eventDto.SportId);
                if (!sportExists)
                {
                    return BadRequest(new { success = false, message = "Invalid sport ID" });
                }

                // Verify the admin exists
                bool adminExists = dbServices.UserExists(eventDto.AdminId);
                if (!adminExists)
                {
                    return NotFound(new { success = false, message = "Admin user not found" });
                }

                // Create the event info object
                var eventInfo = new Backend.Models.EventInfo
                {
                    EventName = eventDto.EventName,
                    RequiresTeams = eventDto.RequiresTeams,
                    Description = eventDto.Description ?? "",
                    StartDatetime = eventDto.StartDatetime,
                    EndDatetime = eventDto.EndDatetime,
                    CityId = eventDto.CityId,
                    LocationName = eventDto.LocationName,
                    SportId = eventDto.SportId,
                    IsPublic = eventDto.IsPublic,
                    MinAge = eventDto.MinAge,
                    Gender = eventDto.Gender,
                    MaxTeams = eventDto.RequiresTeams ? eventDto.MaxTeams : null,
                    MaxParticipants = !eventDto.RequiresTeams ? eventDto.MaxParticipants : null,
                    ProfileImage = "default_event.png"
                };

                // Create event and assign admin
                int eventId = dbServices.CreateEvent(eventInfo, eventDto.AdminId);

                if (eventId <= 0)
                {
                    return StatusCode(500, new { success = false, message = "Failed to create event" });
                }

                // Notify the new event admin
                await NotificationHelper.SendUserNotificationAsync(
                    _pushNotificationService,
                    eventDto.AdminId,
                    "You're an Event Admin! 🏆",
                    $"You are now the admin of '{eventDto.EventName}' event.",
                    "event_admin_assigned",
                    new Dictionary<string, object>
                    {
                        { "eventId", eventId }
                    }
                );

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) created event {EventName} (ID: {EventId}) for city {CityId} with {NewAdmin} as event admin",
                    userName, userId, eventDto.EventName, eventId, eventDto.CityId, eventDto.AdminId);

                return Ok(new
                {
                    success = true,
                    eventId = eventId,
                    message = "Event created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating event");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{cityId}/change-admin/{eventId}")]
        public async Task<IActionResult> ChangeEventAdmin(int cityId, int eventId, [FromBody] ChangeEventAdminDto changeAdminDto)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int currentUserId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(currentUserId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to change admin for event {EventId} in city {CityId}",
                        userName, currentUserId, eventId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Verify the event exists and belongs to the city
                var eventDetails = dbServices.GetEventDetailsForAdmin(cityId, eventId);
                if (eventDetails == null)
                {
                    return NotFound(new { success = false, message = "Event not found" });
                }

                // Get current admin
                var currentAdmin = dbServices.GetEventAdmin(eventId);
                if (currentAdmin == null)
                {
                    return NotFound(new { success = false, message = "Current event admin not found" });
                }

                // Check if new admin is the same as current admin
                if (currentAdmin.UserId == changeAdminDto.UserId)
                {
                    return BadRequest(new { success = false, message = "New admin is the same as current admin" });
                }

                // Verify the new admin exists
                var newAdminExists = dbServices.UserExists(changeAdminDto.UserId);
                if (!newAdminExists)
                {
                    return NotFound(new { success = false, message = "New admin user not found" });
                }

                // Change the admin
                bool success = dbServices.ChangeEventAdmin(eventId, changeAdminDto.UserId, currentAdmin.UserId);

                if (!success)
                {
                    return StatusCode(500, new { success = false, message = "Failed to change event admin" });
                }

                var eventName = dbServices.GetEventName(eventId);

                // Notify the old admin
                await NotificationHelper.SendUserNotificationAsync(
                    _pushNotificationService,
                    currentAdmin.UserId,
                    "Admin Role Transferred",
                    $"You are no longer the admin of the event '{eventName}'. Admin role has been transferred.",
                    "event_admin_removed",
                    new Dictionary<string, object>
                    {
                        { "eventId", eventId },
                        { "eventName", eventName }
                    }
                );

                // Notify the new admin
                await NotificationHelper.SendUserNotificationAsync(
                    _pushNotificationService,
                    changeAdminDto.UserId,
                    "You're the New Event Admin! 🏆",
                    $"You have been assigned as the new admin of the event '{eventName}'.",
                    "event_admin_assigned",
                    new Dictionary<string, object>
                    {
                        { "eventId", eventId },
                        { "eventName", eventName }
                    }
                );

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) changed admin for event {EventId} from user {OldAdminId} to user {NewAdminId} in city {CityId}",
                    userName, currentUserId, eventId, currentAdmin.UserId, changeAdminDto.UserId, cityId);

                return Ok(new
                {
                    success = true,
                    message = "Event admin changed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing event admin for event {EventId}", eventId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{cityId}/event/{eventId}")]
        public async Task<IActionResult> DeleteEvent(int cityId, int eventId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to delete event {EventId} in city {CityId}",
                        userName, userId, eventId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Verify the event exists and belongs to the city
                var eventDetails = dbServices.GetEventDetailsForAdmin(cityId, eventId);
                if (eventDetails == null)
                {
                    return NotFound(new { success = false, message = "Event not found" });
                }

                var eventName = dbServices.GetEventName(eventId);
                var currentAdmin = dbServices.GetEventAdmin(eventId);

                var eventRecipients = await _pushNotificationService.GetEventRecipientsAsync(eventId, "all");

                // Delete the event
                bool success = dbServices.DeleteEvent(eventId);

                if (!success)
                {
                    return StatusCode(500, new { success = false, message = "Failed to delete event" });
                }

                // Notify all event participants (includes groups and individual participants)
                if (eventRecipients.Any())
                {
                    await _pushNotificationService.SendNotificationAsync(new PushNotificationRequest
                    {
                        Title = "Event Cancelled ❌",
                        Body = $"The event '{eventName}' has been cancelled.",
                        UserIds = eventRecipients,
                        NotificationType = "event_deleted",
                        Data = new Dictionary<string, object>
                        {
                            { "type", "event_deleted" },
                            { "eventId", eventId },
                            { "eventName", eventName }
                        }
                    });
                }

                await NotificationHelper.SendUserNotificationAsync(
                    _pushNotificationService,
                    currentAdmin.UserId,
                    "Event Deleted",
                    $"The event '{eventName}' you were administering has been deleted.",
                    "event_deleted",
                    new Dictionary<string, object>
                    {
                        { "eventId", eventId },
                        { "eventName", eventName }
                    }
                );

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) deleted event {EventId} in city {CityId}",
                    userName, userId, eventId, cityId);

                return Ok(new { success = true, message = "Event deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting event {EventId}", eventId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

    }
}
