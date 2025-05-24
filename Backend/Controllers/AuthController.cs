using Backend.BL;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.CodeDom.Compiler;
using System.Diagnostics.Contracts;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860
// This page handles JWT, Login, Register, Hashing Password
namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AuthController(IConfiguration config)
        {
            _config = config;
        }
       
        [AllowAnonymous]
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if (IsEmailRegistered(registerDto.Email.ToLower()))
                {
                    return BadRequest("Email already registered");
                }

                var user = RegisterUser(registerDto);

                if (user == null)
                {
                    return BadRequest("Registration failed");
                }

                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

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


        private User RegisterUser(RegisterDto registerDto)
        {
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            DBservices dBservices = new DBservices();

            int userId = dBservices.InsertUser(registerDto, hashedPassword);

            if (userId <= 0)
            {
                return null;
            }

            return new User
            {
                UserId = userId,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                BirthDate = registerDto.BirthDate,
                Email = registerDto.Email,
                Gender = registerDto.Gender,
                FavSportId = registerDto.FavSportId,
                CityId = registerDto.CityId,
                IsGroupAdmin = false,
                IsCityOrganizer = false,
                IsEventAdmin = false,
            };
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginDto)
        {
            try
            {
                if (string.IsNullOrEmpty(loginDto.Email) || string.IsNullOrEmpty(loginDto.Password))
                {
                    return BadRequest("Email and password are required");
                }

                DBservices dbServices = new DBservices();
                User user = dbServices.LoginUser(loginDto.Email.ToLower(), loginDto.Password);

                if (user == null)
                {
                    return Unauthorized("Invalid email or password");
                }

                string accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

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
        [HttpPost("refresh-token")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.RefreshToken))
                {
                    return BadRequest("Refresh token is required");
                }

                var dbServices = new DBservices();
                var refreshToken = dbServices.GetRefreshToken(request.RefreshToken);

                if (refreshToken == null)
                {
                    return Unauthorized("Invalid refresh token");
                }

                if (!refreshToken.IsActive)
                {
                    return Unauthorized("Refresh token has been revoked or expired");
                }

                // Get user information
                var user = GetUserById(refreshToken.UserId);
                if (user == null)
                {
                    return Unauthorized("User not found");
                }

                // Generate new tokens
                var newAccessToken = GenerateJwtToken(user);
                var newRefreshToken = GenerateRefreshToken(user.UserId, refreshToken.ExpiryDate);

                // Revoke old refresh token
                dbServices.RevokeRefreshToken(refreshToken.Token, "Replaced by new token", newRefreshToken.Token);

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

        [Authorize(Roles = "User")]
        [HttpPost("revoke-token")]
        public IActionResult RevokeToken([FromHeader(Name = "X-Refresh-Token")] string token)
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

                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Refresh token is required");
                }

                // Keep those if we remove it from the parameters passed to the RevokeToken Function
                //var token = Request.Cookies["refreshToken"] ?? Request.Headers["X-Refresh-Token"].FirstOrDefault();
                //var token = Request.Headers["X-Refresh-Token"].FirstOrDefault();


                // To use this we have to add ? after the string word in the parameters passed to the RevokeToken Function ([FromHeader(Name = "X-Refresh-Token")] string? headerToken)
                // Allow header first, then fall back to cookie
                //var token = headerToken ?? Request.Cookies["refreshToken"];
                //if (string.IsNullOrEmpty(token))
                //    return BadRequest("Token is required");
                //if (string.IsNullOrEmpty(token))
                //{
                //    return BadRequest("Token is required");
                //}

                var dbServices = new DBservices();
                var refreshToken = dbServices.GetRefreshToken(token);

                if (refreshToken == null)
                {
                    return NotFound("Token not found");
                }

                if (refreshToken.UserId != userId)
                {
                    return StatusCode(403, new { success = false, message = "You are not authorized to revoke this token" });
                }

                var success = dbServices.RevokeRefreshToken(token, "Revoked by user");

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


        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim("email", user.Email),
                new Claim("name", $"{user.FirstName} {user.LastName}"),
                new Claim(ClaimTypes.Role, "User")
            };

            if (user.IsGroupAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "GroupAdmin"));
            }

            if (user.IsCityOrganizer)
            {
                claims.Add(new Claim(ClaimTypes.Role, "CityOrganizer"));
            }

            if (user.IsEventAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "EventAdmin"));
            }

            var now = DateTime.UtcNow;
            //var expires = now.AddDays(1);
            //var expires = now.AddMinutes(30);
            var expires = now.AddHours(1);

            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
              _config["Jwt:Audience"],
              claims,
              expires: expires,
              signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private RefreshToken GenerateRefreshToken(int userId, DateTime? inheritExpiryDate = null)
        {
            // Generate a random token
            var randomBytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            string token = Convert.ToBase64String(randomBytes);

            //var expiryDate = DateTime.UtcNow.AddDays(7);
            //var expiryDate = DateTime.UtcNow.AddMonths(1);

            // Use inherited expiry date or create a new one
            var expiryDate = inheritExpiryDate ?? DateTime.UtcNow.AddMonths(1);
            DBservices dbServices = new DBservices();
            return dbServices.SaveRefreshToken(userId, token, expiryDate);
        }

        private bool IsEmailRegistered(string email)
        {
            DBservices dBservices = new DBservices();
            return dBservices.IsEmailRegistered(email);
        }

        private User GetUserById(int userId)
        {
            DBservices dbServices = new DBservices();
            return dbServices.GetUserById(userId);
        }

    }
}
