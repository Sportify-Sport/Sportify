﻿using Backend.Models;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Concurrent;
using System.Runtime;
using System.Text.Json;
using System.Web;

namespace Backend.Services
{
    public class CityService
    {
        private readonly IMemoryCache _cache;
        private readonly HttpClient _httpClient;
        private const string CACHE_PREFIX = "CITY_";
        private const string API_URL = "https://data.gov.il/api/3/action/datastore_search";
        private const string RESOURCE_ID = "8f714b6f-c35c-4b40-a0e7-547b675eee0e";

        // Dictionary to manage locks per city ID
        private static readonly ConcurrentDictionary<int, SemaphoreSlim> _semaphores = new();
        public CityService(IMemoryCache cache, IHttpClientFactory httpClientFactory)
        {
            _cache = cache;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<bool> IsCityValidAsync(int cityId)
        {
            if (cityId <= 0)
            {
                return false;
            }

            try
            {
                var city = await GetCityAsync(cityId);
                return city != null;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<string> GetCityHebrewNameAsync(int cityId)
        {
            var city = await GetCityAsync(cityId);
            return city?.HebrewName;
        }

        public async Task<string> GetCityEnglishNameAsync(int cityId)
        {
            var city = await GetCityAsync(cityId);
            return city?.EnglishName;
        }

        public async Task<CityInfo> GetCityAsync(int cityId)
        {
            if (cityId <= 0)
            {
                return null;
            }

            // Check cache first
            string cacheKey = $"{CACHE_PREFIX}{cityId}";
            if (_cache.TryGetValue(cacheKey, out CityInfo cachedCity))
            {
                return cachedCity;
            }

            // Get or create semaphore for this city ID
            var semaphore = _semaphores.GetOrAdd(cityId, _ => new SemaphoreSlim(1, 1));

            try
            {
                // Wait for exclusive access
                await semaphore.WaitAsync();

                // Double-check cache after acquiring lock (someone else might have loaded it)
                if (_cache.TryGetValue(cacheKey, out cachedCity))
                {
                    return cachedCity;
                }

                // Call external API
                var cityFromApi = await FetchCityFromApiAsync(cityId);

                // Cache the result for 30 days
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromDays(30))
                    .SetPriority(CacheItemPriority.Normal);

                _cache.Set(cacheKey, cityFromApi, cacheOptions);

                return cityFromApi;
            }
            catch (Exception ex)
            {
                return null;
            }
            finally
            {
                semaphore.Release();
            }
        }

        public void ClearCityCache(int cityId)
        {
            string cacheKey = $"{CACHE_PREFIX}{cityId}";
            _cache.Remove(cacheKey);
        }

        private async Task<CityInfo> FetchCityFromApiAsync(int cityId)
        {
            // Build the API URL
            string filter = $"{{\"_id\":{cityId}}}";
            string encodedFilter = HttpUtility.UrlEncode(filter);
            string url = $"{API_URL}?resource_id={RESOURCE_ID}&filters={encodedFilter}";

            // Make the API call
            HttpResponseMessage response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            // Parse the response
            string jsonContent = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<CityApiResponse>(jsonContent);

            // Check if city was found
            if (apiResponse?.success != true ||
                apiResponse.result?.records == null ||
                apiResponse.result.records.Count == 0)
            {
                return null;
            }

            // Extract city data
            var record = apiResponse.result.records[0];
            return new CityInfo
            {
                Id = record._id,
                HebrewName = record.city_name_he?.Trim(),
                EnglishName = record.city_name_en?.Trim()
            };
        }

    }
}
