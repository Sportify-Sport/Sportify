using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventParticipantsController : ControllerBase
    {
        [Authorize(Roles = "EventAdmin")]
        [HttpGet("{eventId}/players")]
        public IActionResult GetEventPlayers(int eventId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                if (!Event.IsUserEventAdmin(eventId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are not an admin of this event" });
                }

                // Get event players (participants with PlayWatch=True) with pagination
                var (players, hasMore) = EventParticipant.GetEventPlayers(eventId, page, pageSize);

                return Ok(new
                {
                    success = true,
                    data = players,
                    pagination = new
                    {
                        currentPage = page,
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
        [HttpPost("{eventId}/join/{playWatch}")]
        public IActionResult JoinEvent(int eventId, bool playWatch)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (Event.IsUserEventAdmin(eventId, currentUserId))
                {
                    return StatusCode(403, new { success = false, message = "You are the admin of the group" });
                }

                string result = EventParticipant.ProcessJoinRequest(eventId, currentUserId, playWatch);

                switch (result)
                {
                    case "Success":
                        if (playWatch)
                        {
                            return Ok(new { success = true, message = "Join request submitted successfully. Awaiting approval." });
                        }
                        else
                        {
                            return Ok(new { success = true, message = "You are now watching this event" });
                        }

                    case "EventNotFound":
                        return NotFound(new { success = false, message = "Event not found" });

                    case "AlreadyParticipating":
                        return BadRequest(new { success = false, message = "You are already participating in this event" });

                    case "PendingRequestExists":
                        return BadRequest(new { success = false, message = "You already have a pending request for this event, remove the current request to change the join status (Play/spectator)" });

                    case "PrivateEvent":
                        return BadRequest(new { success = false, message = "This event is private and cannot be joined" });

                    case "CooldownActive":
                        return BadRequest(new { success = false, message = "You must wait 1 day after being removed or leaving before requesting to join again" });

                    case "EventRequiresTeams":
                        return BadRequest(new { success = false, message = "This API is only for non-team events" });

                    default:
                        return BadRequest(new { success = false, message = "Failed to process join request: " + result });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "User")]
        [HttpPost("{eventId}/cancel-join-request")]
        public IActionResult CancelEventJoinRequest(int eventId)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.CancelEventJoinRequest(eventId, userId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "Event join request canceled successfully" });
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

        [Authorize(Roles = "User")]
        [HttpPost("{eventId}/leave")]
        public IActionResult LeaveEvent(int eventId)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.LeaveEvent(eventId, userId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "You have left the event successfully" });
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

        [Authorize(Roles = "EventAdmin")]
        [HttpPost("{eventId}/remove-player/{playerUserId}")]
        public IActionResult RemovePlayerFromEvent(int eventId, int playerUserId)
        {
            try
            {
                if (eventId <= 0 || playerUserId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or player ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.RemovePlayerFromEvent(eventId, playerUserId, adminUserId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "Player has been removed from the event" });
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

        [Authorize(Roles = "EventAdmin")]
        [HttpPost("events/{eventId}/process-request/{requestUserId}/{approve}")]
        public IActionResult AdminProcessJoinRequest(int eventId, int requestUserId, bool approve)
        {
            try
            {
                if (eventId <= 0 || requestUserId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or user ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.AdminProcessJoinRequest(eventId, requestUserId, adminUserId, approve);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = approve ?
                            "Request approved. User has been added to the event." :
                            "Request has been rejected."
                    });
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

        [Authorize(Roles = "EventAdmin")]
        [HttpGet("events/{eventId}/pending-requests")]
        public IActionResult GetEventPendingJoinRequests(int eventId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.GetPendingJoinRequests(eventId, adminUserId, page, pageSize);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new
                {
                    success = true,
                    requests = result.Requests,
                    hasMore = result.HasMore,
                    page = page
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "EventAdmin")]
        [HttpGet("events/{eventId}/pending-request-user/{userId}")]
        public IActionResult GetEventPendingRequestUserDetails(int eventId, int userId)
        {
            try
            {
                if (eventId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or user ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.GetPendingRequestUserDetails(eventId, userId, adminUserId);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                if (result.UserDetails == null)
                {
                    return NotFound(new { success = false, message = "User details not found" });
                }

                return Ok(new
                {
                    success = true,
                    user = result.UserDetails
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "EventAdmin")]
        [HttpGet("events/{eventId}/player/{userId}")]
        public IActionResult GetEventPlayerDetails(int eventId, int userId)
        {
            try
            {
                if (eventId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or user ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventParticipant.GetPlayerDetails(eventId, userId, adminUserId);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                if (result.UserDetails == null)
                {
                    return NotFound(new { success = false, message = "User details not found" });
                }

                return Ok(new
                {
                    success = true,
                    user = result.UserDetails
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}
