using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Backend.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
    public class AdminGroupsController : ControllerBase
    {
        private readonly ILogger<AdminGroupsController> _logger;

        public AdminGroupsController(ILogger<AdminGroupsController> logger)
        {
            _logger = logger;
        }

        [HttpGet("{cityId}")]
        public IActionResult GetGroupsByCity(
    int cityId,
    [FromQuery] string? name = null,
    [FromQuery] string sortBy = "name",
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                if (page < 1 || pageSize < 1 || pageSize > 50)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 50"
                    });
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access groups for city {CityId}",
                        userName, userId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Convert sort option from string to numeric value
                int sortOption = ConvertSortByToNumeric(sortBy);

                // Log the request
                //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested groups for city {CityId} with sort: {SortBy}, search: {SearchName}",
                //    userName, userId, cityId, sortBy, name ?? "none");

                // Get groups with pagination (fetch one extra item to determine if there are more)
                var groups = dbServices.GetGroupsByCityForAdmin(cityId, name, sortOption, page, pageSize);

                // Check if there are more items
                bool hasMore = groups.Count > pageSize;

                // Remove the extra item if there are more
                if (hasMore)
                {
                    groups.RemoveAt(groups.Count - 1);
                }

                return Ok(new
                {
                    groups,
                    hasMore,
                    currentPage = page
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting groups for city {CityId}", cityId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // Helper method to convert string sort options to numeric values
        private int ConvertSortByToNumeric(string sortBy)
        {
            if (string.IsNullOrEmpty(sortBy))
                return 1; // Default to name

            return sortBy.ToLower() switch
            {
                "name" => 1,
                "sport" => 2,
                "foundedat" => 3,
                "members" => 4,
                _ => int.TryParse(sortBy, out int result) ? result : 1
            };
        }


        [HttpGet("{cityId}/group/{groupId}")]
        public IActionResult GetGroupDetails(int cityId, int groupId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access group {GroupId} in city {CityId}",
                        userName, userId, groupId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Log the request
                //_logger.LogInformation("Admin {AdminName} (ID: {AdminId}) requested details for group {GroupId} in city {CityId}",
                //    userName, userId, groupId, cityId);

                // Get group details
                var groupDetails = dbServices.GetGroupDetailsForAdmin(cityId, groupId);

                if (groupDetails == null)
                {
                    return NotFound(new { success = false, message = "Group not found" });
                }

                // Get group admin details separately
                var groupAdmin = dbServices.GetGroupAdmin(groupId);
                if (groupAdmin != null)
                {
                    groupDetails.GroupAdminId = groupAdmin.UserId;
                    groupDetails.GroupAdminName = $"{groupAdmin.FirstName} {groupAdmin.LastName}";
                    groupDetails.GroupAdminImage = groupAdmin.ProfileImage;
                }

                return Ok(groupDetails);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting details for group {GroupId} in city {CityId}", groupId, cityId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("create")]
        public IActionResult CreateGroup([FromBody] CreateGroupDto groupDto)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, groupDto.CityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to create group for city {CityId}",
                        userName, userId, groupDto.CityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Validate inputs
                if (string.IsNullOrWhiteSpace(groupDto.GroupName))
                {
                    return BadRequest(new { success = false, message = "Group name is required" });
                }

                if (groupDto.MaxMemNum <= 0)
                {
                    return BadRequest(new { success = false, message = "Maximum members must be greater than zero" });
                }

                if (groupDto.MinAge <= 0)
                {
                    return BadRequest(new { success = false, message = "Minimum age must be greater than zero" });
                }

                if (!new[] { "Female", "Male", "Mixed" }.Contains(groupDto.Gender))
                {
                    return BadRequest(new { success = false, message = "Gender must be 'Female', 'Male', or 'Mixed'" });
                }

                // Validate SportId exists
                var sports = dbServices.GetAllSports();
                bool sportExists = sports.Any(s => s.SportId == groupDto.SportId);
                if (!sportExists)
                {
                    return BadRequest(new { success = false, message = "Invalid sport ID" });
                }

                // Verify the admin exists
                bool adminExists = dbServices.UserExists(groupDto.AdminId);
                if (!adminExists)
                {
                    return NotFound(new { success = false, message = "Admin user not found" });
                }

                // Check if admin's gender matches group's gender requirements
                string adminGender = dbServices.GetUserGender(groupDto.AdminId);
                if (adminGender == null)
                {
                    return NotFound(new { success = false, message = "Admin user not found" });
                }

                // Validate gender match
                if (groupDto.Gender != "Mixed" &&
                    ((groupDto.Gender == "Male" && adminGender != "M") ||
                     (groupDto.Gender == "Female" && adminGender != "F")))
                {
                    return BadRequest(new { success = false, message = "Admin's gender does not match group requirements" });
                }

                // Create the group
                var groupInfo = new GroupInfo
                {
                    GroupName = groupDto.GroupName,
                    Description = groupDto.Description ?? "",
                    SportId = groupDto.SportId,
                    GroupImage = "default_group.png",
                    CityId = groupDto.CityId,
                    MaxMemNum = groupDto.MaxMemNum,
                    TotalMembers = 1, // Admin will be first member
                    MinAge = groupDto.MinAge,
                    Gender = groupDto.Gender
                };

                // Create group and assign admin
                int groupId = dbServices.CreateGroup(groupInfo, groupDto.AdminId);

                if (groupId <= 0)
                {
                    return StatusCode(500, new { success = false, message = "Failed to create group" });
                }

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) created group {GroupName} (ID: {GroupId}) for city {CityId} with {NewAdmin} as group admin",
                    userName, userId, groupDto.GroupName, groupId, groupDto.CityId, groupDto.AdminId);

                return Ok(new
                {
                    success = true,
                    groupId = groupId,
                    message = "Group created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{cityId}/change-admin/{groupId}")]
        public IActionResult ChangeGroupAdmin(
            int cityId,
            int groupId,
            [FromBody] ChangeGroupAdminDto changeAdminDto)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int currentUserId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(currentUserId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to change admin for group {GroupId} in city {CityId}",
                        userName, currentUserId, groupId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Verify the group exists and belongs to the city
                var groupDetails = dbServices.GetGroupDetailsForAdmin(cityId, groupId);
                if (groupDetails == null)
                {
                    return NotFound(new { success = false, message = "Group not found" });
                }

                // Get current admin
                var currentAdmin = dbServices.GetGroupAdmin(groupId);
                if (currentAdmin == null)
                {
                    return NotFound(new { success = false, message = "Current group admin not found" });
                }

                // Check if new admin is the same as current admin
                if (currentAdmin.UserId == changeAdminDto.UserId)
                {
                    return BadRequest(new { success = false, message = "New admin is the same as current admin" });
                }

                // Verify the new admin exists
                var newAdminExists = dbServices.UserExists(changeAdminDto.UserId);
                if (!newAdminExists)
                {
                    return NotFound(new { success = false, message = "New admin user not found" });
                }

                // Check if the new admin's gender matches the group's gender
                var newAdminGender = dbServices.GetUserGender(changeAdminDto.UserId);
                if (groupDetails.Gender != "Mixed" &&
                    ((groupDetails.Gender == "Male" && newAdminGender != "M") ||
                     (groupDetails.Gender == "Female" && newAdminGender != "F")))
                {
                    return BadRequest(new { success = false, message = "New admin's gender does not match group requirements" });
                }

                // Change the admin
                bool success = dbServices.ChangeGroupAdmin(groupId, changeAdminDto.UserId, currentAdmin.UserId, cityId);

                if (!success)
                {
                    return StatusCode(500, new { success = false, message = "Failed to change group admin" });
                }

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) changed admin for group {GroupId} from user {OldAdminId} to user {NewAdminId} in city {CityId}",
                    userName, currentUserId, groupId, currentAdmin.UserId, changeAdminDto.UserId, cityId);

                return Ok(new
                {
                    success = true,
                    message = "Group admin changed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing group admin for group {GroupId}", groupId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{cityId}/group/{groupId}")]
        public IActionResult DeleteGroup(int cityId, int groupId)
        {
            try
            {
                // Get user ID from claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Verify admin has access to this city
                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);

                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to delete group {GroupId} in city {CityId}",
                        userName, userId, groupId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city" });
                }

                // Verify the group exists and belongs to the city
                var groupDetails = dbServices.GetGroupDetailsForAdmin(cityId, groupId);
                if (groupDetails == null)
                {
                    return NotFound(new { success = false, message = "Group not found" });
                }

                // Delete the group
                bool success = dbServices.DeleteGroup(groupId);

                if (!success)
                {
                    return StatusCode(500, new { success = false, message = "Failed to delete group" });
                }

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) deleted group {GroupId} in city {CityId}",
                    userName, userId, groupId, cityId);

                return Ok(new { success = true, message = "Group deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting group {GroupId}", groupId);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
