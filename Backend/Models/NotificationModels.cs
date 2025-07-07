namespace Backend.Models
{
    public class PushNotificationRequest
    {
        public string Title { get; set; }
        public string Body { get; set; }
        public Dictionary<string, object> Data { get; set; }
        public List<int> UserIds { get; set; }
        public int? EventId { get; set; }
        public int? GroupId { get; set; }
        public string NotificationType { get; set; }
    }

    public class AdminNotificationRequest
    {
        public string Message { get; set; }
        public int? EventId { get; set; }
        public int? GroupId { get; set; }
        public string Recipients { get; set; } // "all", "players", "groups"
    }

    public class RegisterPushTokenRequest
    {
        public string PushToken { get; set; }
        public string DeviceId { get; set; }
        public string Platform { get; set; }
    }

    public class UserPushNotificationToken
    {
        public int TokenId { get; set; }
        public int UserId { get; set; }
        public string PushToken { get; set; }
        public string DeviceId { get; set; }
        public string Platform { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public int FailureCount { get; set; }
    }

    public class ExpoPushMessage
    {
        public string to { get; set; }
        public string title { get; set; }
        public string body { get; set; }
        public Dictionary<string, object> data { get; set; }
        public string sound { get; set; } = "default";
        public int? badge { get; set; }
        public string priority { get; set; } = "high";
    }

    public class ExpoPushTicket
    {
        public string status { get; set; }
        public string id { get; set; }
        public string message { get; set; }
        public object details { get; set; }
    }

    public class NotificationHistoryItem
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public string NotificationData { get; set; }
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public string NotificationType { get; set; }
        public int? RelatedEntityId { get; set; }
        public string RelatedEntityType { get; set; }
    }
}
