using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "SuperAdmin")]
    public class CityOrganizersController : ControllerBase
    {
        private readonly CityService _cityService;

        public CityOrganizersController(CityService cityService)
        {
            _cityService = cityService;
        }        

        // Add city organizer
        [HttpPost("add")]
        public async Task<IActionResult> AddCityOrganizer([FromBody] CityOrganizerDto dto)
        {
            try
            {
                // Validate input
                if (dto.UserId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                if (dto.CityId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid city ID" });
                }

                // Validate city exists
                bool cityValid = await _cityService.IsCityValidAsync(dto.CityId);
                if (!cityValid)
                {
                    return BadRequest(new { success = false, message = "Invalid city ID" });
                }

                // Get current user ID
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                DBservices dbServices = new DBservices();
                var result = dbServices.AddCityOrganizer(dto.UserId, dto.CityId);

                if (result.Success)
                {
                    var cityName = await _cityService.GetCityHebrewNameAsync(dto.CityId);

                    return Ok(new { success = true, message = result.Message });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while adding city organizer" });
            }
        }

        // Remove city organizer
        [HttpDelete("remove")]
        public async Task<IActionResult> RemoveCityOrganizer([FromBody] CityOrganizerDto dto)
        {
            try
            {
                // Validate input
                if (dto.UserId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                if (dto.CityId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid city ID" });
                }

                DBservices dbServices = new DBservices();
                var result = dbServices.RemoveCityOrganizer(dto.UserId, dto.CityId);

                if (result.Success)
                {
                    return Ok(new { success = true, message = result.Message });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while removing city organizer" });
            }
        }

        // Get city organizers with optional filters and pagination
        [HttpGet]
        public async Task<IActionResult> GetCityOrganizers(
            [FromQuery] string? query = null,
            [FromQuery] int? cityId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                // Validate pagination parameters
                if (pageNumber < 1)
                {
                    return BadRequest(new { success = false, message = "Page number must be greater than 0" });
                }

                if (pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(new { success = false, message = "Page size must be between 1 and 100" });
                }

                // Validate city if provided
                if (cityId.HasValue)
                {
                    if (cityId.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Invalid city ID" });
                    }

                    bool cityValid = await _cityService.IsCityValidAsync(cityId.Value);
                    if (!cityValid)
                    {
                        return BadRequest(new { success = false, message = "City ID does not exist" });
                    }
                }

                // Sanitize query input
                if (!string.IsNullOrWhiteSpace(query))
                {
                    query = query.Trim();

                    // Prevent SQL injection by limiting characters and length
                    if (query.Length > 100)
                    {
                        return BadRequest(new { success = false, message = "Query is too long" });
                    }
                }

                DBservices dbServices = new DBservices();
                var result = dbServices.SearchCityOrganizers(query, cityId, pageNumber, pageSize);

                // Get city information for each unique city
                var uniqueCityIds = result.Organizers
                    .Select(o => o.CityId)
                    .Distinct()
                    .ToList();

                var cityInfoDict = new Dictionary<int, object>();
                foreach (var id in uniqueCityIds)
                {
                    var cityInfo = await _cityService.GetCityAsync(id);
                    if (cityInfo != null)
                    {
                        cityInfoDict[id] = new
                        {
                            cityId = id,
                            hebrewName = cityInfo.HebrewName,
                            englishName = cityInfo.EnglishName
                        };
                    }
                }

                // Map organizers with city information
                var organizersWithCities = result.Organizers.Select(o => new
                {
                    userId = o.UserId,
                    firstName = o.FirstName,
                    lastName = o.LastName,
                    email = o.Email,
                    profileImage = o.ProfileImage,
                    isSuperAdmin = o.IsSuperAdmin,
                    city = cityInfoDict.ContainsKey(o.CityId) ? cityInfoDict[o.CityId] : null
                }).ToList();

                return Ok(new
                {
                    success = true,
                    organizers = organizersWithCities,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalCount = result.TotalCount,
                        totalPages = (int)Math.Ceiling(result.TotalCount / (double)pageSize),
                        hasMore = result.HasMore
                    },
                    filters = new
                    {
                        query = query,
                        cityId = cityId
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while searching city organizers" });
            }
        }
    }
}
