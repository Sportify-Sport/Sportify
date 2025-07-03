using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Models;
using Backend.Services;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        private readonly ILogger<EventsController> _logger;
        private readonly IRecommendationService _recommendationService;

        public EventsController(ILogger<EventsController> logger, IRecommendationService recommendationService)
        {
            _logger = logger;
            _recommendationService = recommendationService;
        }

        [AllowAnonymous]
        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int count = 5)
        {
            try
            {
                // Validate count
                if (count <= 0 || count > 20)
                {
                    return BadRequest(new { success = false, message = "Count must be between 1 and 20" });
                }

                // Check if user is authenticated
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (userIdClaim == null)
                {
                    // User not authenticated - return random events
                    var randomEvents = Event.GetRandomEvents(count);
                    return Ok(new
                    {
                        success = true,
                        data = randomEvents,
                        message = "Please log in for personalized recommendations",
                        isRecommended = false
                    });
                }

                // Get user ID
                int userId = int.Parse(userIdClaim.Value);

                // Get recommendations
                var result = await _recommendationService.GetRecommendedEventsAsync(userId, count);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommendations");

                // Fallback to random events
                var randomEvents = Event.GetRandomEvents(count);
                return Ok(new
                {
                    success = true,
                    data = randomEvents,
                    message = "An error occurred. Showing random events.",
                    isRecommended = false
                });
            }
        }

        [AllowAnonymous]
        [HttpGet("events/random")]
        public IActionResult GetRandomEvents([FromQuery] int count = 5)
        {
            try
            {
                if (count <= 0 || count > 20)
                {
                    return BadRequest(new { success = false, message = "Count must be between 1 and 20" });
                }

                var randomEvents = Event.GetRandomEvents(count);

                return Ok(new { success = true, data = randomEvents });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [AllowAnonymous]
        [HttpGet("eventDetialsWithoutStatus/{eventId}")]
        public IActionResult GetEventDetailsWithoutStatus(int eventId)
        {
            try
            {
                var eventDetails = Event.GetEventDetailsWithoutStatus(eventId);

                if (eventDetails == null)
                {
                    return NotFound(new { success = false, message = $"Event with ID {eventId} not found" });
                }

                return Ok(new { success = true, data = eventDetails });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred while retrieving event details: {ex.Message}" });
            }
        }

        [AllowAnonymous]
        [HttpGet("GetEvents")]
        public IActionResult GetEvents([FromQuery] DateTime? lastEventDate = null, [FromQuery] int? lastEventId = null, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (pageSize < 1 || pageSize > 50) pageSize = 10;

                var result = BL.Event.GetEventsPaginated(lastEventDate, lastEventId, pageSize);

                return Ok(new
                {
                    success = true,
                    data = result.Events,
                    hasMore = result.HasMore
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [AllowAnonymous]
        [HttpGet("{eventId}")]
        public IActionResult GetEventDetails(int eventId)
        {
            try
            {
                int? userId = null;
                if (User.Identity.IsAuthenticated)
                {
                    userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                }

                var eventDetails = Event.GetEventDetailsWithParticipationStatus(eventId, userId);

                if (eventDetails == null)
                {
                    if (User.Identity.IsAuthenticated)
                    {
                        return StatusCode(403, new { success = false, message = "You don't have access to this private event" });

                    }
                    else
                    {
                        return Unauthorized(new { success = false, message = "This is a private event. Please log in to access it." });
                    }
                }

                return Ok(new { success = true, data = eventDetails });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpPut("{eventId}")]
        [Authorize(AuthenticationSchemes = "Bearer,AdminScheme", Roles = "EventAdmin,CityOrganizer")]
        public IActionResult UpdateEvent(int eventId, [FromBody] UpdateEventDto updateDto)
        {
            try
            {
                // Get user ID from claims
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Input validation
                if (string.IsNullOrWhiteSpace(updateDto.EventName))
                {
                    return BadRequest(new { success = false, message = "Event name is required" });
                }

                if (updateDto.EventName.Length > 100)
                {
                    return BadRequest(new { success = false, message = "Event name cannot exceed 100 characters" });
                }

                if (updateDto.Description?.Length > 500)
                {
                    return BadRequest(new { success = false, message = "Description cannot exceed 500 characters" });
                }

                if (string.IsNullOrWhiteSpace(updateDto.LocationName))
                {
                    return BadRequest(new { success = false, message = "Location name is required" });
                }

                if (updateDto.LocationName.Length > 100)
                {
                    return BadRequest(new { success = false, message = "Location name cannot exceed 100 characters" });
                }

                // Check authorization - first get the event's city id
                DBservices dbServices = new DBservices();
                var eventCityId = dbServices.GetEventCityId(eventId);
                if (!eventCityId.HasValue)
                {
                    return NotFound(new { success = false, message = "Event not found" });
                }

                // Check if user is event admin or city organizer
                bool isEventAdmin = Event.IsUserEventAdmin(eventId, currentUserId);
                bool isCityOrganizer = dbServices.IsUserCityOrganizer(currentUserId, eventCityId.Value);

                if (!isEventAdmin && !isCityOrganizer)
                {
                    _logger.LogWarning("Unauthorized event update attempt: User {UserName} (ID: {UserId}) tried to update event {EventId}",
                        userName, currentUserId, eventId);
                    return StatusCode(403, new { success = false, message = "You do not have permission to edit this event" });
                }

                // Update event
                string editorRole = isEventAdmin ? "EventAdmin" : "CityOrganizer";
                var (success, message) = Event.UpdateEvent(eventId, updateDto.EventName.Trim(),
                    updateDto.Description?.Trim(), updateDto.LocationName.Trim());

                if (success)
                {
                    _logger.LogInformation("{EditorRole} {UserName} (ID: {UserId}) updated event {EventId}",
                        editorRole, userName, currentUserId, eventId);
                    return Ok(new { success = true, message = message });
                }
                else
                {
                    _logger.LogWarning("{EditorRole} {UserName} (ID: {UserId}) failed to update event {EventId}: {Message}",
                        editorRole, userName, currentUserId, eventId, message);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating event {EventId}", eventId);
                return StatusCode(500, new { success = false, message = "An error occurred while updating the event" });
            }
        }

        [HttpPut("{eventId}/image")]
        [Authorize(AuthenticationSchemes = "Bearer,AdminScheme", Roles = "EventAdmin,CityOrganizer")]
        public async Task<IActionResult> UpdateEventImage(int eventId, IFormFile? eventImage)
        {
            try
            {
                // Get user ID from claims
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                if (eventImage == null || eventImage.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No image file provided" });
                }

                // Check authorization
                DBservices dbServices = new DBservices();
                var eventCityId = dbServices.GetEventCityId(eventId);
                if (!eventCityId.HasValue)
                {
                    _logger.LogWarning("Event image update failed: User {UserName} (ID: {UserId}) - Event {EventId} not found",
                        userName, currentUserId, eventId);
                    return NotFound(new { success = false, message = "Event not found" });
                }

                // Check if user is event admin or city organizer
                bool isEventAdmin = Event.IsUserEventAdmin(eventId, currentUserId);
                bool isCityOrganizer = dbServices.IsUserCityOrganizer(currentUserId, eventCityId.Value);

                if (!isEventAdmin && !isCityOrganizer)
                {
                    _logger.LogWarning("Unauthorized event image update: User {UserName} (ID: {UserId}) tried to update event {EventId}",
                        userName, currentUserId, eventId);
                    return StatusCode(403, new { success = false, message = "You do not have permission to edit this event" });
                }

                // Get current event image
                string currentImage = Event.GetCurrentEventImage(eventId);

                // Process the image
                string imageFileName = await ImageService.ProcessImage(eventImage, "event", eventId, currentImage);

                // Update the event image in the database
                var (success, message) = Event.UpdateEventImage(eventId, imageFileName);

                if (success)
                {
                    string editorRole = isEventAdmin ? "EventAdmin" : "CityOrganizer";
                    _logger.LogInformation("{EditorRole} {UserName} (ID: {UserId}) updated image for event {EventId}",
                        editorRole, userName, currentUserId, eventId);

                    return Ok(new { success = true, message = message });
                }
                else
                {
                    // Delete the newly uploaded image if database update failed
                    ImageService.DeleteImage(imageFileName);
                    return BadRequest(new { success = false, message = message });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating image for event {EventId}", eventId);
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}

