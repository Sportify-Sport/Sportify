using Backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CityTestController : ControllerBase
    {
        private readonly CityHelper _cityHelper;

        public CityTestController(CityHelper cityHelper)
        {
            _cityHelper = cityHelper;
        }

        [HttpGet("validate/{cityId}")]
        public async Task<IActionResult> ValidateCity(int cityId)
        {
            bool isValid = await _cityHelper.IsCityValidAsync(cityId);

            if (isValid)
            {
                var cityInfo = await _cityHelper.GetCityAsync(cityId);
                return Ok(new
                {
                    success = true,
                    valid = true,
                    city = cityInfo
                });
            }

            return Ok(new
            {
                success = true,
                valid = false,
                message = "City not found"
            });
        }

        [HttpGet("info/{cityId}")]
        public async Task<IActionResult> GetCityInfo(int cityId)
        {
            var cityInfo = await _cityHelper.GetCityAsync(cityId);

            if (cityInfo == null)
            {
                return NotFound(new { success = false, message = "City not found" });
            }

            return Ok(new
            {
                success = true,
                city = cityInfo
            });
        }

        [HttpPost("clear-cache/{cityId}")]
        public IActionResult ClearCityCache(int cityId)
        {
            _cityHelper.ClearCityCache(cityId);
            return Ok(new { success = true, message = "Cache cleared" });
        }
    }

}
