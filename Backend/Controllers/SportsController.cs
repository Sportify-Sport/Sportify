using Microsoft.AspNetCore.Mvc;
using Backend.BL;
using Microsoft.AspNetCore.Authorization;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SportsController : ControllerBase
    {
        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetAllSports()
        {
            try
            {
                return Ok(Sport.GetAllSports());
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving sports");
            }
        }
    }
}
