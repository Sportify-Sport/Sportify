using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.BL;
// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public IActionResult Search(
            [FromQuery] string type,
            [FromQuery] string name = null,
            [FromQuery] int? sportId = null,
            [FromQuery] int? cityId = null,
            [FromQuery] string? age = null,
            [FromQuery] string? gender = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate the parameters

                if (string.IsNullOrEmpty(type) || (type.ToLower() != "group" && type.ToLower() != "event"))
                {
                    return BadRequest(new { success = false, message = "Type parameter must be either 'group' or 'event'" });
                }

                if (!string.IsNullOrEmpty(age) && age != "13-18" && age != "18-30" && age != "30+")
                {
                    return BadRequest(new { success = false, message = "Age parameter must be '13-18', '18-30', or '30+'" });
                }

                if (!string.IsNullOrEmpty(gender))
                {
                    gender = gender.ToLower();
                    if (gender != "male" && gender != "female" && gender != "mixed")
                    {
                        return BadRequest(new
                        {
                            success = false,
                            message = "Gender parameter must be 'Male', 'Female', or 'Mixed'"
                        });
                    }

                    gender = char.ToUpper(gender[0]) + gender.Substring(1);
                }

                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                List<object> results;
                bool hasMore;

                // Execute search based on type
                if (type.ToLower() == "group")
                {
                    (results, hasMore) = BL.Search.SearchGroups(
                        name, sportId, cityId, age, gender, page, pageSize);
                }
                else if(type.ToLower() == "event")
                {
                    (results, hasMore) = BL.Search.SearchEvents(
                        name, sportId, cityId, age, gender, startDate, page, pageSize);
                } 
                else
                {
                    return StatusCode(403, new { success = false, message = "You can't search for something that doesn't exist" });
                }

                return Ok(new
                {
                    success = true,
                    data = results,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        hasMore = hasMore
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }
    }
}
