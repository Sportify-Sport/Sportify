using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventTeamsController : ControllerBase
    {
        [Authorize(Roles = "User")]
        [HttpPost("team-events/{eventId}/join-as-spectator")]
        public IActionResult JoinTeamEventAsSpectator(int eventId)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }


                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventTeam.JoinTeamEventAsSpectator(eventId, userId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "Successfully registered as spectator for this event" });
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
        [HttpPost("team-events/{eventId}/cancel-spectating")]
        public IActionResult CancelTeamEventSpectating(int eventId)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventTeam.CancelTeamEventSpectating(eventId, userId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = "Successfully canceled spectator registration" });
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

        [AllowAnonymous]
        [HttpGet("team-events/{eventId}/groups")]
        public IActionResult GetTeamEventGroups(int eventId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
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

                var result = EventTeam.GetTeamEventGroups(eventId, page, pageSize);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new
                {
                    success = true,
                    groups = result.Groups,
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
        [HttpDelete("team-events/{eventId}/groups/{groupId}")]
        public IActionResult RemoveGroupFromEvent(int eventId, int groupId)
        {
            try
            {
                if (eventId <= 0 || groupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or group ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventTeam.RemoveGroupFromEvent(eventId, groupId, adminUserId);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new { success = true, message = "Group successfully removed from event" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [Authorize(Roles = "EventAdmin")]
        [HttpPost("team-events/{eventId}/groups/{groupId}")]
        public IActionResult AddGroupToEvent(int eventId, int groupId)
        {
            try
            {
                if (eventId <= 0 || groupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID or group ID" });
                }

                int adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                var result = EventTeam.AddGroupToEvent(eventId, groupId, adminUserId);

                if (!result.Success)
                {
                    return BadRequest(new { success = false, message = result.ErrorMessage });
                }

                return Ok(new { success = true, message = "Group successfully added to event" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

    }
}
