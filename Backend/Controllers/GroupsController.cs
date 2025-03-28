using Microsoft.AspNetCore.Mvc;
using Backend.BL;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupsController : ControllerBase
    {
        [HttpGet("group/{groupId}")]
        public IActionResult GetGroupDetails(int groupId)
        {
            try
            {
                var groupDetails = Group.GetGroupDetails(groupId);

                if (groupDetails == null)
                {
                    return NotFound($"Group with ID {groupId} not found");
                }

                return Ok(groupDetails);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving group details: {ex.Message}");
            }
        }
    }
}
