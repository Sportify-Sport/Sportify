using Backend.Models;
using Newtonsoft.Json;
using System.Text;

namespace Backend.Services
{
    public class PushNotificationService : IPushNotificationService
    {
        private readonly ILogger<PushNotificationService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _expoPushUrl = "https://exp.host/--/api/v2/push/send";

        public PushNotificationService(ILogger<PushNotificationService> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<bool> SendNotificationAsync(PushNotificationRequest request)
        {
            try
            {
                if (request.UserIds == null || !request.UserIds.Any())
                {
                    _logger.LogWarning("No user IDs provided for notification");
                    return false;
                }

                // Get active push tokens for users
                var dbServices = new DBservices();
                var tokens = dbServices.GetActivePushTokensForUsers(request.UserIds);

                if (!tokens.Any())
                {
                    _logger.LogInformation("No active push tokens found for users");
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
                _logger.LogError(ex, "Error sending notification");
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
                    _logger.LogError($"Expo push service error: {response.StatusCode} - {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending batch to Expo");
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
                    _logger.LogWarning($"Push notification failed for token {message.to}: {ticket.message}");

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
                    _logger.LogWarning("Empty push token provided");
                    return false;
                }

                if (!request.PushToken.StartsWith("ExponentPushToken[") || !request.PushToken.EndsWith("]"))
                {
                    _logger.LogWarning("Invalid Expo push token format");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(request.DeviceId))
                {
                    _logger.LogWarning("Empty device ID provided");
                    return false;
                }

                if (request.Platform != "ios" && request.Platform != "android")
                {
                    _logger.LogWarning("Invalid platform provided");
                    return false;
                }

                var dbServices = new DBservices();
                return dbServices.RegisterOrUpdatePushToken(userId, request.PushToken, request.DeviceId, request.Platform);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering push token");
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
                _logger.LogError(ex, "Error getting event recipients");
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
                _logger.LogError(ex, "Error getting group recipients");
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
                _logger.LogError(ex, "Error getting notification history");
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
                _logger.LogError(ex, "Error marking notification as read");
                return false;
            }
        }
    }
}