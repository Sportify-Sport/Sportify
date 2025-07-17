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
using System.Text.RegularExpressions;

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
        private readonly CityService _cityService;
        private readonly SportService _sportService;
        private const int REFRESH_TOKEN_REUSE_LIMIT = 24;

        public AuthController(IConfiguration config, IEmailService emailService, CityService cityService, SportService sportService)
        {
            _config = config;
            _emailService = emailService;
            _cityService = cityService;
            _sportService = sportService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                // Validate FirstName
                if (string.IsNullOrWhiteSpace(registerDto.FirstName))
                {
                    return BadRequest("First name is required");
                }
                if (registerDto.FirstName.Length > 50)
                {
                    return BadRequest("First name cannot exceed 50 characters");
                }
                if (!Regex.IsMatch(registerDto.FirstName, @"^[a-zA-Z\s\-']+$"))
                {
                    return BadRequest("First name contains invalid characters");
                }

                // Validate LastName
                if (string.IsNullOrWhiteSpace(registerDto.LastName))
                {
                    return BadRequest("Last name is required");
                }
                if (registerDto.LastName.Length > 50)
                {
                    return BadRequest("Last name cannot exceed 50 characters");
                }
                if (!Regex.IsMatch(registerDto.LastName, @"^[a-zA-Z\s\-']+$"))
                {
                    return BadRequest("Last name contains invalid characters");
                }

                // Validate BirthDate
                var minBirthDate = DateTime.Now.AddYears(-120);
                var maxBirthDate = DateTime.Now.AddYears(-13); // Minimum age 13
                if (registerDto.BirthDate < minBirthDate || registerDto.BirthDate > maxBirthDate)
                {
                    return BadRequest("Birth date must be between 13 and 120 years ago");
                }

                // Validate Email
                if (string.IsNullOrWhiteSpace(registerDto.Email))
                {
                    return BadRequest("Email is required");
                }
                if (registerDto.Email.Length > 100)
                {
                    return BadRequest("Email cannot exceed 100 characters");
                }
                if (!IsValidEmail(registerDto.Email))
                {
                    return BadRequest("Invalid email format");
                }

                // Validate Password
                if (string.IsNullOrWhiteSpace(registerDto.Password))
                {
                    return BadRequest("Password is required");
                }
                if (registerDto.Password.Length < 8)
                {
                    return BadRequest("Password must be at least 8 characters long");
                }
                if (registerDto.Password.Length > 100)
                {
                    return BadRequest("Password cannot exceed 100 characters");
                }

                // password complexity requirements
                if (!Regex.IsMatch(registerDto.Password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
                {
                    return BadRequest("Password must contain at least one uppercase letter, one lowercase letter, and one number");
                }

                // Validate Gender
                if (string.IsNullOrWhiteSpace(registerDto.Gender))
                {
                    return BadRequest("Gender is required");
                }
                if (registerDto.Gender != "M" && registerDto.Gender != "F")
                {
                    return BadRequest("Gender must be 'M' or 'F'");
                }

                // Validate FavSportId using SportService
                if (registerDto.FavSportId <= 0)
                {
                    return BadRequest("Invalid sport ID");
                }
                bool isValidSport = await _sportService.ValidateSportIdAsync(registerDto.FavSportId);
                if (!isValidSport)
                {
                    return BadRequest("Selected sport does not exist");
                }

                // Validate CityId using CityService
                if (registerDto.CityId <= 0)
                {
                    return BadRequest("Invalid city ID");
                }

                bool isValidCity = await _cityService.IsCityValidAsync(registerDto.CityId);
                if (!isValidCity)
                {
                    return BadRequest("Selected city does not exist");
                }

                DBservices dbServices = new DBservices();

                // First, check if there's an old unverified account
                var (success, message) = dbServices.HandleUnverifiedAccountReregistration(registerDto.Email.ToLower());
                if (success)
                {
                }

                // Check if email is registered
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
                
                dbServices.SaveEmailVerificationCode(user.UserId, verificationCode, expiresAt);

                // Send welcome email with verification code
                await _emailService.SendWelcomeEmailWithVerificationAsync(user.Email, user.FirstName, verificationCode);

                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    // IsEmailVerified = false
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

                if (!IsValidEmail(loginDto.Email))
                {
                    return BadRequest("Invalid email format");
                }

                // email length validation
                if (loginDto.Email.Length > 100)
                {
                    return BadRequest("Email cannot exceed 100 characters");
                }

                // password length validation
                if (loginDto.Password.Length > 100)
                {
                    return BadRequest("Invalid credentials");
                }

                DBservices dbServices = new DBservices();
                User user = dbServices.LoginUser(loginDto.Email.ToLower(), loginDto.Password);

                if (user == null)
                {
                    return Unauthorized("Invalid email or password");
                }

                if (!dbServices.IsUserEligibleForAuth(user.UserId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

                string accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    // IsEmailVerified = user.IsEmailVerified
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
                // Get user ID from token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized();
                }

                int userId = int.Parse(userIdClaim.Value);
                DBservices dbServices = new DBservices();

                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(userId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

                if (string.IsNullOrWhiteSpace(verifyDto.Code))
                {
                    return BadRequest("Verification code is required");
                }

                if (verifyDto.Code.Length != 6 || !verifyDto.Code.All(char.IsDigit))
                {
                    return BadRequest("Invalid verification code format");
                }

                var result = dbServices.VerifyEmailWithCode(verifyDto.Code);

                if (!result.IsValid)
                {
                    return BadRequest("Invalid or expired verification code");
                }

                // Get updated user info and generate new tokens with verified status
                var user = GetUserById(result.UserId);
                string accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken(user.UserId);

                var response = new AuthResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    // IsEmailVerified = user.IsEmailVerified
                };

                return Ok(new
                {
                    success = true,
                    message = "Email verified successfully",
                    tokens = response
                    //accessToken = accessToken,
                    //refreshToken = refreshToken.Token
                });
            }
            catch (Exception ex)
            {
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
                DBservices dbServices = new DBservices();

                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(userId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

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

                dbServices.SaveEmailVerificationCode(userId, verificationCode, expiresAt);

                // Send verification email
                await _emailService.SendEmailVerificationAsync(user.Email, user.FirstName, verificationCode);

                return Ok(new { success = true, message = "Verification email sent successfully" });
            }
            catch (Exception ex)
            {
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

                // email format validation
                if (!IsValidEmail(forgotDto.Email))
                {
                    return BadRequest("Invalid email format");
                }

                // email length validation
                if (forgotDto.Email.Length > 100)
                {
                    return BadRequest("Email cannot exceed 100 characters");
                }
                DBservices dbServices = new DBservices();
                var user = dbServices.GetUserByEmail(forgotDto.Email.ToLower());

                // Always return success to prevent email enumeration
                if (user == null)
                {
                    return Ok(new { success = true, message = "If the email exists, a reset code has been sent" });
                }

                if (!dbServices.IsUserEligibleForAuth(user.UserId))
                {
                    // Still return success to prevent enumeration
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

                if (resetDto.NewPassword.Length > 100)
                {
                    return BadRequest("Password cannot exceed 100 characters");
                }

                // password complexity validation
                if (!Regex.IsMatch(resetDto.NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
                {
                    return BadRequest("Password must contain at least one uppercase letter, one lowercase letter, and one number");
                }

                DBservices dbServices = new DBservices();

                // Validate reset code
                var user = dbServices.ValidatePasswordResetCode(resetDto.Code);
                if (user == null)
                {
                    return BadRequest("Invalid or expired reset code");
                }

                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(user.UserId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
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

                var response = new AuthResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken.Token,
                    // IsEmailVerified = user.IsEmailVerified
                };

                return Ok(new
                {
                    success = true,
                    message = "Password reset successfully",
                    tokens = response
                    //accessToken = newAccessToken,
                    //refreshToken = newRefreshToken.Token
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while resetting password");
            }
        }

        [Authorize] // User must be logged in, but doesn't need email verification
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                // Get user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized("Invalid token");
                }

                int userId = int.Parse(userIdClaim.Value);
                DBservices dbServices = new DBservices();

                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(userId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

                // Input validation
                if (string.IsNullOrWhiteSpace(changePasswordDto.CurrentPassword))
                {
                    return BadRequest("Current password is required");
                }

                if (string.IsNullOrWhiteSpace(changePasswordDto.NewPassword))
                {
                    return BadRequest("New password is required");
                }

                if (changePasswordDto.NewPassword.Length < 8)
                {
                    return BadRequest("New password must be at least 8 characters long");
                }

                if (changePasswordDto.CurrentPassword == changePasswordDto.NewPassword)
                {
                    return BadRequest("New password must be different from current password");
                }

                // password complexity validation
                if (!Regex.IsMatch(changePasswordDto.NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"))
                {
                    return BadRequest("Password must contain at least one uppercase letter, one lowercase letter, and one number");
                }

                if (changePasswordDto.CurrentPassword == changePasswordDto.NewPassword)
                {
                    return BadRequest("New password must be different from current password");
                }

                // Get user from database to verify current password
                var user = dbServices.GetUserById(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest("Current password is incorrect");
                }

                // Hash the new password
                string newHashedPassword = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);

                // Update password in database
                bool passwordUpdated = dbServices.UpdateUserPassword(userId, newHashedPassword);
                if (!passwordUpdated)
                {
                    return StatusCode(500, "Failed to update password");
                }

                // Revoke all existing refresh tokens for this user
                int revokedCount = dbServices.RevokeAllUserRefreshTokens(userId, "Password changed by user");

                // Generate new tokens for current session
                string newAccessToken = GenerateJwtToken(user);
                var newRefreshToken = GenerateRefreshToken(user.UserId);

                // Send password changed notification email
                await _emailService.SendPasswordChangedNotificationAsync(user.Email, user.FirstName);

                var response = new AuthResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken.Token,
                    // IsEmailVerified = user.IsEmailVerified
                };

                return Ok(new
                {
                    success = true,
                    message = "Password changed successfully. All other sessions have been logged out.",
                    tokens = response
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while changing password");
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

                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(user.UserId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

                // Generate new access token
                var newAccessToken = GenerateJwtToken(user);
                string returnedRefreshToken;

                // Check if we need to generate a new refresh token
                if (refreshToken.UseCount >= REFRESH_TOKEN_REUSE_LIMIT - 1)
                {
                    // Generate new refresh token after 10 uses
                    var newRefreshToken = GenerateRefreshToken(user.UserId, refreshToken.ExpiryDate);

                    // Revoke old refresh token
                    dbServices.RevokeRefreshToken(refreshToken.Token, "Replaced after use limit", newRefreshToken.Token);

                    returnedRefreshToken = newRefreshToken.Token;
                }
                else
                {
                    // Increment use count and return the same refresh token
                    dbServices.IncrementRefreshTokenUseCount(refreshToken.Token);
                    returnedRefreshToken = refreshToken.Token;
                }

                var response = new AuthResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = returnedRefreshToken,
                    // IsEmailVerified = user.IsEmailVerified
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

                DBservices dbServices = new DBservices();
                // Check if user is eligible
                if (!dbServices.IsUserEligibleForAuth(userId))
                {
                    return Unauthorized("Your account verification has expired. Please register again.");
                }

                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Refresh token is required");
                }

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
