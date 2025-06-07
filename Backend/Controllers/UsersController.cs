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
        public IActionResult UpdateUserDetails([FromBody] UserUpdateModel model)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
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

        //[HttpPut("profile/image")]
        //[Authorize(Roles = "User")]
        //public async Task<IActionResult> UpdateProfileImage(IFormFile profileImage)
        //{
        //    try
        //    {
        //        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

        //        if (profileImage == null || profileImage.Length == 0)
        //        {
        //            return BadRequest(new { success = false, message = "No image file provided" });
        //        }

        //        // Process the image
        //        string imageFileName = await ProcessProfileImage(userId, profileImage);

        //        // Update the profile image in the database
        //        bool success = BL.User.UpdateProfileImage(userId, imageFileName);

        //        if (success)
        //        {
        //            return Ok(new { success = true, message = "Profile image updated successfully" });
        //        }
        //        else
        //        {
        //            return NotFound(new { success = false, message = $"User with ID {userId} not found" });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"An error occurred while updating profile image: {ex.Message}");
        //    }
        //}

        //// Helper method to process profile image
        //private async Task<string> ProcessProfileImage(int userId, IFormFile image)
        //{
        //    // Ensure profile images directory exists
        //    string profileImagesPath = Path.Combine(Directory.GetCurrentDirectory(), "uploadedImages");
        //    if (!Directory.Exists(profileImagesPath))
        //    {
        //        Directory.CreateDirectory(profileImagesPath);
        //    }

        //    if (image.Length > 5242880) // 5MB
        //    {
        //        throw new Exception("File size exceeds the limit (5MB)");
        //    }

        //    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        //    var permittedMimeTypes = new[] { "image/jpeg", "image/png", "image/webp" };

        //    var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
        //    var mimeType = image.ContentType;

        //    if (string.IsNullOrEmpty(extension) ||
        //        !allowedExtensions.Contains(extension) ||
        //        !permittedMimeTypes.Contains(mimeType))
        //    {
        //        throw new Exception("Invalid file type. Only .jpg, .jpeg, .png and .webp files are allowed");
        //    }

        //    // Get current profile image to handle deletion
        //    string currentImagePath = BL.User.GetCurrentProfileImage(userId);

        //    // Generate unique filename
        //    string fileName = $"user_{userId}_{DateTime.Now.Ticks}{extension}";
        //    string filePath = Path.Combine(profileImagesPath, fileName);

        //    // Delete old image if it exists and is not the default
        //    if (!string.IsNullOrEmpty(currentImagePath) && !currentImagePath.Contains("default_profile.png"))
        //    {
        //        string oldFileName = Path.GetFileName(currentImagePath.Replace("/Images/", ""));
        //        string oldFilePath = Path.Combine(profileImagesPath, currentImagePath);
        //        if (System.IO.File.Exists(oldFilePath))
        //        {
        //            System.IO.File.Delete(oldFilePath);
        //        }
        //    }

        //    // Save new image
        //    using (var fileStream = new FileStream(filePath, FileMode.Create))
        //    {
        //        await image.CopyToAsync(fileStream);
        //    }

        //    return fileName;
        //}

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
