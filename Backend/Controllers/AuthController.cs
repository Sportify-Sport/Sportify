using Backend.BL;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.CodeDom.Compiler;
using System.Diagnostics.Contracts;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

                var token = GenerateJwtToken(user);

                var response = new
                {
                    token,
                    //permissions = new
                    //{
                    //    adminForGroups = user.AdminForGroups,
                    //    organizerForCities = user.OrganizerForCities
                    //}
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
                //AdminForGroups = new List<int>(),
                //OrganizerForCities = new List<int>()
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

                string token = GenerateJwtToken(user);

                var response = new
                {
                    token,
                    //permissions = new
                    //{
                    //    adminForGroups = user.AdminForGroups,
                    //    organizerForCities = user.OrganizerForCities
                    //}
                };

                return Ok(response);
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

            var now = DateTime.UtcNow;
            var expires = now.AddDays(1);

            var token = new JwtSecurityToken(_config["Jwt:Issuer"],
              _config["Jwt:Audience"],
              claims,
              expires: expires,
              signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private bool IsEmailRegistered(string email)
        {
            DBservices dBservices = new DBservices();
            return dBservices.IsEmailRegistered(email);
        }

        

    }
}
