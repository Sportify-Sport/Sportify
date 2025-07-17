using Backend.BL;
using Backend.Services;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Principal;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly CityService _cityService;
        private readonly SportService _sportService;

        public UsersController(CityService cityService, SportService sportService)
        {
            _cityService = cityService;
            _sportService = sportService;
        }

        [HttpGet("groups/top4")]
        [Authorize(Roles = "User")]
        public IActionResult GetTop4Groups()
        {
            try
            {                
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                User user = new User { UserId = userId };

                var groups = user.GetTop4Groups();

                return Ok(groups);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving user groups");
            }
        }

        [HttpGet("GetUserProfile")]
        //[Authorize(Roles = "User")]
        [Authorize]
        public IActionResult GetUserProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var userProfile = BL.User.GetUserProfile(userId);

                if (userProfile == null)
                {
                    return NotFound($"User with ID {userId} not found");
                }

                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving user profile: {ex.Message}");
            }
        }


        //[HttpPut("UpdateUserProfile")]
        //[Authorize(Roles = "User")]
        //public async Task<IActionResult> UpdateUserProfile([FromForm] UserUpdateModel model)
        //{
        //    try
        //    {
        //        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

        //        // Handle profile image if provided
        //        string imageFileName = null;
        //        if (model.ProfileImage != null && model.ProfileImage.Length > 0)
        //        {
        //            imageFileName = await ProcessProfileImage(userId, model.ProfileImage);
        //        }

        //        bool success = BL.User.UpdateUserProfile(userId, model, imageFileName);

        //        if (success)
        //        {
        //            return Ok(new { success = true, message = "Profile updated successfully" });
        //        }
        //        else
        //        {
        //            return NotFound(new { success = false, message = $"User with ID {userId} not found" });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"An error occurred while updating user profile: {ex.Message}");
        //    }
        //}

        [HttpPut("profile/details")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdateUserDetails([FromBody] UserUpdateModel model)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                if (model.FirstName != null)
                {
                    if (string.IsNullOrWhiteSpace(model.FirstName))
                    {
                        return BadRequest(new { success = false, message = "First name cannot be empty" });
                    }
                    if (model.FirstName.Length > 50)
                    {
                        return BadRequest(new { success = false, message = "First name cannot exceed 50 characters" });
                    }
                }

                if (model.LastName != null)
                {
                    if (string.IsNullOrWhiteSpace(model.LastName))
                    {
                        return BadRequest(new { success = false, message = "Last name cannot be empty" });
                    }
                    if (model.LastName.Length > 50)
                    {
                        return BadRequest(new { success = false, message = "Last name cannot exceed 50 characters" });
                    }
                }

                if (model.Bio != null && model.Bio.Length > 500)
                {
                    return BadRequest(new { success = false, message = "Bio cannot exceed 500 characters" });
                }

                // Since FavSportId and CityId are not nullable, check if they're not default(0)
                if (model.FavSportId != 0)
                {
                    bool isValidSport = await _sportService.ValidateSportIdAsync(model.FavSportId);
                    if (!isValidSport)
                    {
                        return BadRequest(new { success = false, message = "Invalid sport selected" });
                    }
                }

                if (model.CityId != 0)
                {
                    bool isValidCity = await _cityService.IsCityValidAsync(model.CityId);
                    if (!isValidCity)
                    {
                        return BadRequest(new { success = false, message = "Invalid city selected" });
                    }
                }


                bool success = BL.User.UpdateUserDetails(userId, model);

                if (success)
                {
                    return Ok(new { success = true, message = "Profile details updated successfully" });
                }
                else
                {
                    return NotFound(new { success = false, message = $"User with ID {userId} not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while updating user details: {ex.Message}");
            }
        }

        [HttpPut("profile/image")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> UpdateProfileImage(IFormFile? profileImage)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                if (profileImage == null || profileImage.Length == 0)
                {
                    return BadRequest(new { success = false, message = "No image file provided" });
                }

                // Get current profile image
                string currentImage = BL.User.GetCurrentProfileImage(userId);

                // Process the image using ImageHelper
                string imageFileName = await ImageService.ProcessImage(profileImage, "user", userId, currentImage);

                // Update the profile image in the database
                bool success = BL.User.UpdateProfileImage(userId, imageFileName);

                if (success)
                {
                    return Ok(new { success = true, message = "Profile image updated successfully" });
                }
                else
                {
                    // Delete the newly uploaded image if database update failed
                    ImageService.DeleteImage(imageFileName);
                    return NotFound(new { success = false, message = $"User with ID {userId} not found" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }


        [HttpGet("groups/all")]
        [Authorize(Roles = "User")]
        public IActionResult GetAllUserGroups()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                User user = new User { UserId = userId };

                var groups = user.GetAllGroups();

                return Ok(groups);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while retrieving all user groups");
            }
        }


        [HttpGet("events/top")]
        [Authorize(Roles = "User")]
        public IActionResult GetUserEvents([FromQuery] int limit = 4)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                var userEvents = BL.User.GetUserEvents(userId, limit);

                return Ok(new { success = true, data = userEvents });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}" });
            }
        }

        [HttpGet("events/paginated")]
        [Authorize(Roles = "User")]
        public IActionResult GetUserEventsPaginated(
            [FromQuery] DateTime? lastEventDate = null, 
            [FromQuery] int? lastEventId = null,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (pageSize < 1 || pageSize > 50) pageSize = 10;

                if (lastEventId.HasValue && lastEventId.Value <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid last event ID" });
                }

                if (lastEventDate.HasValue)
                {
                    if (lastEventDate.Value.Year < 2000 || lastEventDate.Value > DateTime.Now.AddYears(5))
                    {
                        return BadRequest(new { success = false, message = "Invalid event date" });
                    }
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                var result = BL.User.GetUserEventsPaginated(userId, lastEventDate, lastEventId, pageSize);

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
    }
}
