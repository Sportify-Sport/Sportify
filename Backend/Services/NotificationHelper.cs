using Backend.Models;

namespace Backend.Services
{
    public static class NotificationHelper
    {
        public static async Task SendEventNotificationAsync(
            IPushNotificationService pushService,
            int eventId,
            string title,
            string body,
            string notificationType,
            int? excludeUserId = null,
            string recipientType = "all")
        {
            try
            {
                var recipients = await pushService.GetEventRecipientsAsync(eventId, recipientType);

                if (excludeUserId.HasValue)
                {
                    recipients = recipients.Where(id => id != excludeUserId.Value).ToList();
                }

                if (recipients.Any())
                {
                    await pushService.SendNotificationAsync(new PushNotificationRequest
                    {
                        Title = title,
                        Body = body,
                        UserIds = recipients,
                        EventId = eventId,
                        NotificationType = notificationType,
                        Data = new Dictionary<string, object>
                        {
                            { "type", notificationType },
                            { "eventId", eventId }
                        }
                    });
                }
            }
            catch (Exception ex)
            {
            }
        }

        public static async Task SendGroupNotificationAsync(
            IPushNotificationService pushService,
            int groupId,
            string title,
            string body,
            string notificationType,
            int? excludeUserId = null)
        {
            try
            {
                var recipients = await pushService.GetGroupRecipientsAsync(groupId);

                if (excludeUserId.HasValue)
                {
                    recipients = recipients.Where(id => id != excludeUserId.Value).ToList();
                }

                if (recipients.Any())
                {
                    await pushService.SendNotificationAsync(new PushNotificationRequest
                    {
                        Title = title,
                        Body = body,
                        UserIds = recipients,
                        GroupId = groupId,
                        NotificationType = notificationType,
                        Data = new Dictionary<string, object>
                        {
                            { "type", notificationType },
                            { "groupId", groupId }
                        }
                    });
                }
            }
            catch (Exception ex)
            {
            }
        }

        public static async Task SendUserNotificationAsync(
            IPushNotificationService pushService,
            int userId,
            string title,
            string body,
            string notificationType,
            Dictionary<string, object> data = null)
        {
            try
            {
                var notificationData = data ?? new Dictionary<string, object>();
                notificationData["type"] = notificationType;

                await pushService.SendToUserAsync(userId, title, body, notificationData);
            }
            catch (Exception ex)
            {
            }
        }
    }
}
