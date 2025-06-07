using Backend.BL;
using Backend.Models;
using Backend.Services;
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
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IConfiguration config, IEmailService emailService, ILogger<AuthController> logger)
        {
            _config = config;
            _emailService = emailService;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
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

                // Generate verification code
                string verificationCode = GenerateVerificationCode();
                DateTime expiresAt = DateTime.UtcNow.AddMinutes(15);
                
                DBservices dbServices = new DBservices();
                dbServices.SaveEmailVerificationCode(user.UserId, verificationCode, expiresAt);

                // Send welcome email with verification code
                await _emailService.SendWelcomeEmailWithVerificationAsync(user.Email, user.FirstName, verificationCode);

                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    IsEmailVerified = false
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
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
                IsEmailVerified = false
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
                    RefreshToken = refreshToken.Token,
                    IsEmailVerified = user.IsEmailVerified
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [Authorize] // Allow both verified and unverified users
        [HttpPost("verify-email")]
        public IActionResult VerifyEmail([FromBody] VerifyEmailDto verifyDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(verifyDto.Code))
                {
                    return BadRequest("Verification code is required");
                }

                if (verifyDto.Code.Length != 6 || !verifyDto.Code.All(char.IsDigit))
                {
                    return BadRequest("Invalid verification code format");
                }

                DBservices dbServices = new DBservices();
                var result = dbServices.VerifyEmailWithCode(verifyDto.Code);

                if (!result.IsValid)
                {
                    return BadRequest("Invalid or expired verification code");
                }

                // Get updated user info and generate new tokens with verified status
                var user = GetUserById(result.UserId);
                string accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

                return Ok(new
                {
                    success = true,
                    message = "Email verified successfully",
                    accessToken = accessToken,
                    refreshToken = refreshToken.Token
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying email");
                return StatusCode(500, "An error occurred while verifying email");
            }
        }

        [Authorize] // Allow unverified users to resend
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);
                var user = GetUserById(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                if (user.IsEmailVerified)
                {
                    return BadRequest("Email is already verified");
                }

                // Generate new verification code
                string verificationCode = GenerateVerificationCode();
                DateTime expiresAt = DateTime.UtcNow.AddMinutes(15);

                DBservices dbServices = new DBservices();
                dbServices.SaveEmailVerificationCode(userId, verificationCode, expiresAt);

                // Send verification email
                await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationCode);

                return Ok(new { success = true, message = "Verification email sent successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending verification email");
                return StatusCode(500, "An error occurred while resending verification");
            }
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(forgotDto.Email))
                {
                    return BadRequest("Email is required");
                }

                DBservices dbServices = new DBservices();
                var user = dbServices.GetUserByEmail(forgotDto.Email.ToLower());

                // Always return success to prevent email enumeration
                if (user == null)
                {
                    return Ok(new { success = true, message = "If the email exists, a reset code has been sent" });
                }

                // Generate 6-digit code
                string resetCode = GenerateVerificationCode();
                DateTime expiresAt = DateTime.UtcNow.AddMinutes(10);

                // Save reset code
                dbServices.SavePasswordResetCode(user.UserId, resetCode, expiresAt);

                // Send email
                await _emailService.SendPasswordResetCodeAsync(user.Email, user.FirstName, resetCode);

                return Ok(new { success = true, message = "If the email exists, a reset code has been sent" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing forgot password request");
                return StatusCode(500, "An error occurred");
            }
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetDto)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(resetDto.Code) ||
                    string.IsNullOrWhiteSpace(resetDto.NewPassword))
                {
                    return BadRequest("Reset code and new password are required");
                }

                if (resetDto.Code.Length != 6 || !resetDto.Code.All(char.IsDigit))
                {
                    return BadRequest("Invalid reset code format");
                }

                if (resetDto.NewPassword.Length < 8)
                {
                    return BadRequest("Password must be at least 8 characters long");
                }

                DBservices dbServices = new DBservices();

                // Validate reset code
                var user = dbServices.ValidatePasswordResetCode(resetDto.Code);
                if (user == null)
                {
                    return BadRequest("Invalid or expired reset code");
                }

                // Hash new password
                string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(resetDto.NewPassword);

                // Update password
                dbServices.UpdateUserPassword(user.UserId, newHashedPassword);

                // Mark code as used
                dbServices.MarkPasswordResetCodeAsUsed(resetDto.Code);

                // Revoke all existing refresh tokens
                dbServices.RevokeAllUserRefreshTokens(user.UserId, "Password reset");

                // Generate new tokens
                string newAccessToken = GenerateJwtToken(user);
                var newRefreshToken = GenerateRefreshToken(user.UserId);

                // Send notification email
                await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.FirstName);

                return Ok(new
                {
                    success = true,
                    message = "Password reset successfully",
                    accessToken = newAccessToken,
                    refreshToken = newRefreshToken.Token
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return StatusCode(500, "An error occurred while resetting password");
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
                    RefreshToken = newRefreshToken.Token,
                    IsEmailVerified = user.IsEmailVerified
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
                new Claim("IsEmailVerified", user.IsEmailVerified.ToString().ToLower())
            };

            if (user.IsEmailVerified)
            {
                claims.Add(new Claim(ClaimTypes.Role, "User"));
            }

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

        private string GenerateVerificationCode()
        {
            Random random = new Random();
            return random.Next(100000, 999999).ToString();
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
