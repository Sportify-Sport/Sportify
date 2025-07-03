using Backend.Models;

namespace Backend.Services
{
    public interface IRecommendationService
    {
        Task<RecommendationResult> GetRecommendedEventsAsync(int userId, int count = 5);
    }
}