using Backend.BL;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SportsController : ControllerBase
    {
        private readonly SportService _sportsService;

        public SportsController(SportService sportsService)
        {
            _sportsService = sportsService;
        }

        [AllowAnonymous]
        [HttpGet]
        public IActionResult GetAllSports()
        {
            try
            {
                var sports = _sportsService.GetAllSports();
                return Ok(sports);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving sports");
            }
        }

        [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "SuperAdmin")]
        [HttpPost("add")]
        public async Task<IActionResult> AddSport(string sportName, IFormFile sportImage)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(sportName))
                {
                    return BadRequest(new { success = false, message = "Sport name is required" });
                }

                if (sportName.Length > 50)
                {
                    return BadRequest(new { success = false, message = "Sport name must not exceed 50 characters" });
                }

                // Validate sport name doesn't contain special characters
                if (!System.Text.RegularExpressions.Regex.IsMatch(sportName, @"^[a-zA-Z\s]+$"))
                {
                    return BadRequest(new { success = false, message = "Sport name can only contain letters and spaces" });
                }

                if (sportImage == null || sportImage.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Sport image is required" });
                }

                sportName = FormatSportName(sportName.Trim());

                try
                {
                    // Add sport to database
                    var result = Sport.AddSport(sportName, "");

                    if (result.Success)
                    {
                        // Update the image filename with the new sport ID
                        string imageFileName = await ImageService.ProcessImage(sportImage, "sport", result.SportId, null);

                        // Update sport with the image filename
                        var updateResult = Sport.UpdateSportImage(result.SportId, imageFileName);

                        if (updateResult.Success)
                        {
                            _sportsService.ClearCache();

                            return Ok(new
                            {
                                success = true,
                                message = result.Message,
                                sportId = result.SportId,
                                sportName = sportName,
                                sportImage = imageFileName
                            });
                        }
                        else
                        {
                            // If update failed, delete the sport and image
                            Sport.DeleteSport(result.SportId);
                            ImageService.DeleteImage(imageFileName);
                            return BadRequest(new { success = false, message = "Failed to update sport with image" });
                        }
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = result.Message});
                    }
                }
                catch (Exception ex)
                {
                    throw;
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while adding the sport" });
            }
        }

        [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "SuperAdmin")]
        [HttpPut("{sportId}/image")]
        public async Task<IActionResult> UpdateSportImage(int sportId, IFormFile sportImage)
        {
            try
            {
                if (sportImage == null || sportImage.Length == 0)
                {
                    return BadRequest(new { success = false, message = "Sport image is required" });
                }

                // Check if sport exists
                var sport = _sportsService.GetSportById(sportId);
                if (sport == null)
                {
                    return NotFound(new { success = false, message = "Sport not found" });
                }

                // Process the image
                string imageFileName = await ImageService.ProcessImage(sportImage, "sport", sportId, sport.SportImage);

                // Update sport image in database
                var result = Sport.UpdateSportImage(sportId, imageFileName);

                if (result.Success)
                {
                    // Clear cache
                    _sportsService.ClearCache();


                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        sportImage = imageFileName
                    });
                }
                else
                {
                    // Delete the newly uploaded image if database update failed
                    ImageService.DeleteImage(imageFileName);
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while updating the sport image" });
            }
        }

        [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "SuperAdmin")]
        [HttpDelete("{sportId}")]
        public IActionResult DeleteSport(int sportId)
        {
            try
            {
                // Delete sport
                var result = Sport.DeleteSport(sportId);

                if (result.Success)
                {
                    // Delete the sport image if exists
                    if (!string.IsNullOrEmpty(result.SportImage))
                    {
                        ImageService.DeleteImage(result.SportImage);
                    }

                    // Clear cache
                    _sportsService.ClearCache();

                    return Ok(new { success = true, message = result.Message });
                }
                else
                {
                    return BadRequest(new { success = false, message = result.Message });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while deleting the sport" });
            }
        }

        private string FormatSportName(string sportName)
        {
            if (string.IsNullOrEmpty(sportName))
                return sportName;

            // Handle multi-word sports (e.g., "table tennis" -> "Table Tennis")
            var words = sportName.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var formattedWords = words.Select(word =>
                char.ToUpper(word[0]) + (word.Length > 1 ? word.Substring(1) : "")
            );

            return string.Join(" ", formattedWords);
        }
    }
}
