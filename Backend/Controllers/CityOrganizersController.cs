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

        // Get all city organizers for a specific city
        [HttpGet("city/{cityId}")]
        public async Task<IActionResult> GetCityOrganizers(int cityId)
        {
            try
            {
                // Validate city exists
                bool cityValid = await _cityService.IsCityValidAsync(cityId);
                if (!cityValid)
                {
                    return BadRequest(new { success = false, message = "Invalid city ID" });
                }

                DBservices dbServices = new DBservices();
                var organizers = dbServices.GetCityOrganizers(cityId);

                // Get city name
                string cityName = await _cityService.GetCityHebrewNameAsync(cityId);

                return Ok(new
                {
                    success = true,
                    cityId = cityId,
                    cityName = cityName,
                    organizers = organizers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving city organizers" });
            }
        }

        // Get all cities for a specific organizer
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetOrganizerCities(int userId)
        {
            try
            {
                DBservices dbServices = new DBservices();

                // Check if user exists
                var user = dbServices.GetUserById(userId);
                if (user == null)
                {
                    return NotFound(new { success = false, message = "User not found" });
                }

                var cityIds = dbServices.GetOrganizerCities(userId);
                var cities = new List<object>();

                foreach (var cityId in cityIds)
                {
                    var cityInfo = await _cityService.GetCityAsync(cityId);
                    if (cityInfo != null)
                    {
                        cities.Add(new
                        {
                            cityId = cityInfo.Id,
                            hebrewName = cityInfo.HebrewName,
                            englishName = cityInfo.EnglishName
                        });
                    }
                }

                return Ok(new
                {
                    success = true,
                    userId = userId,
                    userName = $"{user.FirstName} {user.LastName}",
                    cities = cities
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving organizer cities" });
            }
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

                // Get current user ID
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Prevent self-removal if SuperAdmin
                if (currentUserId == dto.UserId)
                {
                    return BadRequest(new { success = false, message = "You cannot remove yourself as city organizer" });
                }

                DBservices dbServices = new DBservices();
                var result = dbServices.RemoveCityOrganizer(dto.UserId, dto.CityId);

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
                return StatusCode(500, new { success = false, message = "An error occurred while removing city organizer" });
            }
        }

        // Check if user is city organizer for specific city
        [HttpGet("check/{userId}/{cityId}")]
        public async Task<IActionResult> CheckCityOrganizer(int userId, int cityId)
        {
            try
            {
                DBservices dbServices = new DBservices();
                bool isOrganizer = dbServices.IsUserCityOrganizer(userId, cityId);

                return Ok(new
                {
                    success = true,
                    userId = userId,
                    cityId = cityId,
                    isOrganizer = isOrganizer
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while checking city organizer status" });
            }
        }
    }
}
