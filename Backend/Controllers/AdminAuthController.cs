using Backend.BL;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminAuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AdminAuthController(IConfiguration config)
        {
            _config = config;
        }

        // To use both tokens validation in JWT:
        // [Authorize(AuthenticationSchemes = "Bearer,AdminScheme", Roles = "EventAdmin, CityOrganizer")]

        [AllowAnonymous]
        [HttpPost("admin/login")]
        public IActionResult AdminLogin([FromBody] LoginDto loginDto)
        {
            try
            {
                // Validate credentials
                DBservices dbServices = new DBservices();
                User user = dbServices.LoginUser(loginDto.Email.ToLower(), loginDto.Password);

                if (user == null)
                {
                    return Unauthorized("Invalid email or password");
                }

                // Verify user is a city organizer
                if (!user.IsCityOrganizer)
                {
                    //return Forbid("User is not authorized for admin access");
                    return StatusCode(403, new { success = false, message = "User is not authorized for admin access" });

                }

                // Get client IP address
                string ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                // Admin-specific JWT with shorter lifetime (15 minutes)
                string accessToken = GenerateAdminJwtToken(user);
                var refreshToken = GenerateAdminRefreshToken(user.UserId, ipAddress);

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [AllowAnonymous]
        [HttpPost("admin/refresh-token")]
        public IActionResult AdminRefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.RefreshToken))
                {
                    return BadRequest("Refresh token is required");
                }

                // Get client IP
                string ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                var dbServices = new DBservices();
                var refreshToken = dbServices.GetAdminRefreshToken(request.RefreshToken);

                if (refreshToken == null)
                {
                    return Unauthorized("Invalid refresh token");
                }

                if (!refreshToken.IsActive)
                {
                    return Unauthorized("Refresh token has been revoked or expired");
                }

                // Check for usage limit (4 uses)
                if (refreshToken.HasReachedUseLimit)
                {
                    dbServices.RevokeAdminRefreshToken(refreshToken.Token, "Usage limit exceeded");
                    return Unauthorized("Maximum refresh limit reached. Please login again.");
                }

                // Verify IP address for security
                if (refreshToken.IpAddress != ipAddress)
                {
                    // Security breach detected - revoke all tokens for this user
                    dbServices.RevokeAllUserAdminRefreshTokens(refreshToken.UserId, "IP address mismatch");
                    return Unauthorized("Security validation failed");
                }

                // Get user information
                var user = dbServices.GetUserById(refreshToken.UserId);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                // Increment usage counter
                dbServices.IncrementRefreshTokenUseCount(refreshToken.Id);

                // Generate new tokens
                var newAccessToken = GenerateAdminJwtToken(user);
                var newRefreshToken = GenerateAdminRefreshToken(user.UserId, ipAddress, refreshToken.ExpiryDate, refreshToken.UseCount + 1);

                // Revoke old refresh token
                dbServices.RevokeAdminRefreshToken(refreshToken.Token, "Replaced by new token", newRefreshToken.Token);

                var response = new AuthResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken.Token
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        //[Authorize(Roles = "CityOrganizer")]
        [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
        [HttpPost("admin/revoke-token")]
        public IActionResult RevokeAdminToken([FromHeader(Name = "X-Refresh-Token")] string token)
        {
            try
            {
                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);

                //var token = Request.Headers["X-Refresh-Token"].FirstOrDefault();

                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Token is required");
                }

                var dbServices = new DBservices();
                var refreshToken = dbServices.GetAdminRefreshToken(token);

                if (refreshToken == null)
                {
                    return NotFound("Token not found");
                }

                if (refreshToken.UserId != userId)
                {
                    return StatusCode(403, new { success = false, message = "You are not authorized to revoke this token" });
                }

                var success = dbServices.RevokeAdminRefreshToken(token, "Revoked by user");

                if (!success)
                {
                    return NotFound("Token already revoked");
                }

                return Ok(new { message = "Token revoked" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private string GenerateAdminJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:AdminKey"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim("email", user.Email),
            new Claim("name", $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, "CityOrganizer"),
            new Claim("isAdmin", "true")
        };

            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(15); // Strict 15-minute limit

            var token = new JwtSecurityToken(
                _config["Jwt:AdminIssuer"],
                _config["Jwt:AdminAudience"],
                claims,
                expires: expires,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private RefreshToken GenerateAdminRefreshToken(int userId, string ipAddress, DateTime? inheritExpiryDate = null, int useCount = 0)
        {
            // Generate random token
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            string token = Convert.ToBase64String(randomBytes);

            // Use inherited expiry date or create a new one
            var expiryDate = inheritExpiryDate ?? DateTime.UtcNow.AddHours(1);

            DBservices dbServices = new DBservices();
            return dbServices.SaveAdminRefreshToken(userId, token, expiryDate, ipAddress, useCount);
        }
    }
}
