using Backend.Models;
using Newtonsoft.Json;
using System.Text;

namespace Backend.Services
{
    public class PushNotificationService : IPushNotificationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _expoPushUrl = "https://exp.host/--/api/v2/push/send";

        public PushNotificationService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<bool> SendNotificationAsync(PushNotificationRequest request)
        {
            try
            {
                if (request.UserIds == null || !request.UserIds.Any())
                {
                    return false;
                }

                // Get active push tokens for users
                var dbServices = new DBservices();
                var tokens = dbServices.GetActivePushTokensForUsers(request.UserIds);

                if (!tokens.Any())
                {
                    return true; // Not an error, users might not have tokens
                }

                // Group messages in batches (Expo recommends max 100)
                var batches = tokens.Chunk(100);
                var allSuccess = true;

                foreach (var batch in batches)
                {
                    var messages = batch.Select(token => new ExpoPushMessage
                    {
                        to = token.PushToken,
                        title = request.Title,
                        body = request.Body,
                        data = request.Data ?? new Dictionary<string, object>
                        {
                            { "notificationType", request.NotificationType ?? "general" },
                            { "eventId", request.EventId },
                            { "groupId", request.GroupId },
                            { "timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds() }
                        }
                    }).ToList();

                    var batchSuccess = await SendBatchToExpoAsync(messages, batch.ToList());
                    allSuccess = allSuccess && batchSuccess;
                }

                // Save notification history
                foreach (var userId in request.UserIds)
                {
                    dbServices.SaveNotificationHistory(
                        userId,
                        request.Title,
                        request.Body,
                        JsonConvert.SerializeObject(request.Data),
                        request.NotificationType,
                        request.EventId ?? request.GroupId,
                        request.EventId != null ? "Event" : request.GroupId != null ? "Group" : null
                    );
                }

                return allSuccess;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        private async Task<bool> SendBatchToExpoAsync(List<ExpoPushMessage> messages, List<UserPushNotificationToken> tokens)
        {
            try
            {
                using var httpClient = _httpClientFactory.CreateClient();
                httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
                httpClient.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate");

                var json = JsonConvert.SerializeObject(messages);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync(_expoPushUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    var tickets = JsonConvert.DeserializeObject<List<ExpoPushTicket>>(responseContent);
                    await HandlePushTicketsAsync(messages, tickets);
                    return true;
                }
                else
                {
                    return false;
                }
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        private async Task HandlePushTicketsAsync(List<ExpoPushMessage> messages, List<ExpoPushTicket> tickets)
        {
            var dbServices = new DBservices();

            for (int i = 0; i < tickets.Count && i < messages.Count; i++)
            {
                var ticket = tickets[i];
                var message = messages[i];

                if (ticket.status == "error")
                {
                    // Handle different error types
                    if (ticket.details?.ToString()?.Contains("DeviceNotRegistered") == true ||
                        ticket.message?.Contains("InvalidCredentials") == true)
                    {
                        dbServices.MarkPushTokenAsInvalid(message.to);
                    }
                    else
                    {
                        dbServices.IncrementTokenFailureCount(message.to);
                    }
                }
            }
        }

        public async Task<bool> SendToUserAsync(int userId, string title, string body, Dictionary<string, object> data = null)
        {
            return await SendNotificationAsync(new PushNotificationRequest
            {
                Title = title,
                Body = body,
                Data = data,
                UserIds = new List<int> { userId }
            });
        }

        public async Task<bool> SendToUsersAsync(List<int> userIds, string title, string body, Dictionary<string, object> data = null)
        {
            return await SendNotificationAsync(new PushNotificationRequest
            {
                Title = title,
                Body = body,
                Data = data,
                UserIds = userIds
            });
        }

        public async Task<bool> RegisterOrUpdateTokenAsync(int userId, RegisterPushTokenRequest request)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.PushToken))
                {
                    return false;
                }

                if (!request.PushToken.StartsWith("ExponentPushToken[") || !request.PushToken.EndsWith("]"))
                {
                    return false;
                }

                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    return false;
                }

                if (request.Platform != "ios" && request.Platform != "android")
                {
                    return false;
                }

                var dbServices = new DBservices();
                return dbServices.RegisterOrUpdatePushToken(userId, request.PushToken, request.DeviceId, request.Platform);
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<List<int>> GetEventRecipientsAsync(int eventId, string recipientType = "all")
        {
            try
            {
                var dbServices = new DBservices();
                return dbServices.GetEventNotificationRecipients(eventId, recipientType);
            }
            catch (Exception ex)
            {
                return new List<int>();
            }
        }

        public async Task<List<int>> GetGroupRecipientsAsync(int groupId)
        {
            try
            {
                var dbServices = new DBservices();
                return dbServices.GetGroupNotificationRecipients(groupId);
            }
            catch (Exception ex)
            {
                return new List<int>();
            }
        }

        public async Task<List<NotificationHistoryItem>> GetUserNotificationHistoryAsync(int userId)
        {
            try
            {
                var dbServices = new DBservices();
                return dbServices.GetUserNotificationHistory(userId);
            }
            catch (Exception ex)
            {
                return new List<NotificationHistoryItem>();
            }
        }

        public async Task<bool> MarkNotificationAsReadAsync(int notificationId, int userId)
        {
            try
            {
                var dbServices = new DBservices();
                return dbServices.MarkNotificationAsRead(notificationId, userId);
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
}