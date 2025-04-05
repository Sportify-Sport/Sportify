using Backend.BL;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : ControllerBase
    {
        [HttpGet("event/{eventId}")]
        public IActionResult GetEventDetails(int eventId)
        {
            try
            {
                var eventDetails = Event.GetEventDetails(eventId);

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

    }
}
