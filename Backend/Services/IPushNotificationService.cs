using Backend.Models;

namespace Backend.Services
{
    public interface IPushNotificationService
    {
        Task<bool> SendNotificationAsync(PushNotificationRequest request);
        Task<bool> SendToUserAsync(int userId, string title, string body, Dictionary<string, object> data = null);
        Task<bool> SendToUsersAsync(List<int> userIds, string title, string body, Dictionary<string, object> data = null);
        Task<bool> RegisterOrUpdateTokenAsync(int userId, RegisterPushTokenRequest request);
        Task<List<int>> GetEventRecipientsAsync(int eventId, string recipientType = "all");
        Task<List<int>> GetGroupRecipientsAsync(int groupId);
        Task<List<NotificationHistoryItem>> GetUserNotificationHistoryAsync(int userId);
        Task<bool> MarkNotificationAsReadAsync(int notificationId, int userId);
        Task<NotificationHistoryResult> GetUserNotificationHistoryPaginatedAsync(int userId, int pageNumber, int pageSize);
        Task<bool> DeleteNotificationAsync(int notificationId, int userId);
    }
}