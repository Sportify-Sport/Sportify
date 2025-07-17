using Backend.BL;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

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
                if (loginDto == null)
                {
                    return BadRequest("Invalid request body");
                }

                if (string.IsNullOrWhiteSpace(loginDto.Email))
                {
                    return BadRequest("Email is required");
                }

                if (string.IsNullOrWhiteSpace(loginDto.Password))
                {
                    return BadRequest("Password is required");
                }

                // Email format validation
                if (!IsValidEmail(loginDto.Email))
                {
                    return BadRequest("Invalid email format");
                }

                // Email length validation
                if (loginDto.Email.Length > 100)
                {
                    return BadRequest("Email cannot exceed 100 characters");
                }

                // Password length validation
                if (loginDto.Password.Length > 100)
                {
                    return BadRequest("Invalid credentials");
                }

                // Validate credentials
                DBservices dbServices = new DBservices();
                User user = dbServices.LoginUser(loginDto.Email.ToLower(), loginDto.Password);

                if (user == null)
                {
                    return Unauthorized("Invalid email or password");
                }

                // Verify user has admin access (CityOrganizer or SuperAdmin)
                if (!user.IsCityOrganizer && !user.IsSuperAdmin)
                {
                    return StatusCode(403, new { success = false, message = "User is not authorized for admin access" });
                }

                // Admin-specific JWT with shorter lifetime (15 minutes)
                string accessToken = GenerateAdminJwtToken(user);
                var refreshToken = GenerateAdminRefreshToken(user.UserId);

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
                if (request == null)
                {
                    return BadRequest("Invalid request body");
                }

                if (string.IsNullOrEmpty(request.RefreshToken))
                {
                    return BadRequest("Refresh token is required");
                }

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

                // Get user information
                var user = dbServices.GetUserById(refreshToken.UserId);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                // Generate new tokens
                var newAccessToken = GenerateAdminJwtToken(user);
                var newRefreshToken = GenerateAdminRefreshToken(user.UserId, refreshToken.ExpiryDate);

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
        [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer, SuperAdmin")]
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

            if (user.IsSuperAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "SuperAdmin"));
                claims.Add(new Claim("isSuperAdmin", "true"));
            } else
            {
                claims.Add(new Claim("isSuperAdmin", "false"));
            }

            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(15);

            var token = new JwtSecurityToken(
                _config["Jwt:AdminIssuer"],
                _config["Jwt:AdminAudience"],
                claims,
                expires: expires,
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private RefreshToken GenerateAdminRefreshToken(int userId, DateTime? inheritExpiryDate = null)
        {
            // Generate random token
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            string token = Convert.ToBase64String(randomBytes);

            // Use inherited expiry date or create a new one
            var expiryDate = inheritExpiryDate ?? DateTime.UtcNow.AddHours(1);
            //var expiryDate = inheritExpiryDate ?? DateTime.UtcNow.AddMinutes(1);

            DBservices dbServices = new DBservices();
            return dbServices.SaveAdminRefreshToken(userId, token, expiryDate);
        }

        // Helper method to validate email format
        private bool IsValidEmail(string email)
        {
            try
            {
                var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
                return emailRegex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }
    }
}
