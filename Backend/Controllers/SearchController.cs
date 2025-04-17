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
            [FromQuery] string? name = null,
            [FromQuery] int? sportId = null,
            [FromQuery] int? cityId = null,
            [FromQuery] int? minAge = null,
            [FromQuery] int? maxAge = null,
            [FromQuery] string? gender = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
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

                // Name length validation
                if (!string.IsNullOrEmpty(name) && name.Length > 100)
                {
                    return BadRequest(new { success = false, message = "Search name cannot exceed 100 characters" });
                }

                // Validate IDs are positive
                if (sportId.HasValue && sportId.Value <= 0)
                {
                    return BadRequest(new { success = false, message = "sportId must be a positive number" });
                }

                if (cityId.HasValue && cityId.Value <= 0)
                {
                    return BadRequest(new { success = false, message = "cityId must be a positive number" });
                }

                // Age validation
                if (minAge.HasValue)
                {
                    if (minAge.Value < 0)
                    {
                        return BadRequest(new { success = false, message = "minAge must be a non-negative value" });
                    }

                    if (minAge.Value > 120)
                    {
                        return BadRequest(new { success = false, message = "minAge must be less than or equal to 120" });
                    }
                }

                if (maxAge.HasValue)
                {
                    if (maxAge.Value < 0)
                    {
                        return BadRequest(new { success = false, message = "maxAge must be a non-negative value" });
                    }

                    if (maxAge.Value > 120)
                    {
                        return BadRequest(new { success = false, message = "maxAge must be less than or equal to 120" });
                    }
                }

                if (minAge.HasValue && maxAge.HasValue && minAge.Value > maxAge.Value)
                {
                    return BadRequest(new { success = false, message = "minAge cannot be greater than maxAge" });
                }

                // Check if date parameters are used with groups (not allowed)
                if (type.ToLower() == "group" && (startDate.HasValue || endDate.HasValue))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "startDate and endDate parameters are only applicable for event searches"
                    });
                }

                // Date validation
                if (startDate.HasValue && endDate.HasValue && startDate > endDate)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "startDate cannot be later than endDate"
                    });
                }

                // Date validation
                if (startDate.HasValue && endDate.HasValue && startDate > endDate)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "startDate cannot be later than endDate"
                    });
                }

                // Validate date ranges aren't too extreme
                DateTime minAllowedDate = new DateTime(2000, 1, 1);
                DateTime maxAllowedDate = DateTime.Now.AddYears(5);

                if ((startDate.HasValue && (startDate < minAllowedDate || startDate > maxAllowedDate)) ||
                    (endDate.HasValue && (endDate < minAllowedDate || endDate > maxAllowedDate)))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Date values must be between 2000-01-01 and 5 years from today"
                    });
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
                        name, sportId, cityId, minAge, maxAge, gender, page, pageSize);
                }
                else if(type.ToLower() == "event")
                {
                    (results, hasMore) = BL.Search.SearchEvents(
                        name, sportId, cityId, minAge, maxAge, gender, startDate, endDate, page, pageSize);
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
