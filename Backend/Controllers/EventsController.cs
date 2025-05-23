﻿using Backend.BL;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
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
    }
}

