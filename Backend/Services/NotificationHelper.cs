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
            Dictionary<string, object> additionalData = null,
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
                    var dbServices = new DBservices();
                    var eventName = dbServices.GetEventName(eventId);

                    var data = new Dictionary<string, object>
                    {
                        { "type", notificationType },
                        { "eventId", eventId },
                        { "eventName", eventName }
                    };

                    // Merge additional data if provided
                    if (additionalData != null)
                    {
                        foreach (var kvp in additionalData)
                        {
                            data[kvp.Key] = kvp.Value;
                        }
                    }

                    await pushService.SendNotificationAsync(new PushNotificationRequest
                    {
                        Title = title,
                        Body = body,
                        UserIds = recipients,
                        EventId = eventId,
                        NotificationType = notificationType,
                        Data = data
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
            Dictionary<string, object> additionalData = null,
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
                    var dbServices = new DBservices();
                    var groupName = dbServices.GetGroupName(groupId);

                    var data = new Dictionary<string, object>
                    {
                        { "type", notificationType },
                        { "groupId", groupId },
                        { "groupName", groupName }
                    };

                    // Merge additional data if provided
                    if (additionalData != null)
                    {
                        foreach (var kvp in additionalData)
                        {
                            data[kvp.Key] = kvp.Value;
                        }
                    }

                    await pushService.SendNotificationAsync(new PushNotificationRequest
                    {
                        Title = title,
                        Body = body,
                        UserIds = recipients,
                        GroupId = groupId,
                        NotificationType = notificationType,
                        Data = data
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

                // Always ensure type is set
                notificationData["type"] = notificationType;
                notificationData["notificationType"] = notificationType;

                // Extract eventId or groupId for the request
                int? eventId = null;
                int? groupId = null;

                if (notificationData.ContainsKey("eventId") && notificationData["eventId"] != null)
                {
                    eventId = Convert.ToInt32(notificationData["eventId"]);
                }

                if (notificationData.ContainsKey("groupId") && notificationData["groupId"] != null)
                {
                    groupId = Convert.ToInt32(notificationData["groupId"]);
                }

                await pushService.SendNotificationAsync(new PushNotificationRequest
                {
                    Title = title,
                    Body = body,
                    UserIds = new List<int> { userId },
                    EventId = eventId,
                    GroupId = groupId,
                    NotificationType = notificationType,
                    Data = notificationData
                });
            }
            catch (Exception ex)
            {
            }
        }
    }
}
