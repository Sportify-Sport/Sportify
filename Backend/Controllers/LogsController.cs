using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.RegularExpressions;
using Backend.Models;
using Backend.BL;
// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "CityOrganizer")]
    public class LogsController : ControllerBase
    {
        private readonly ILogger<LogsController> _logger;

        public LogsController(ILogger<LogsController> logger)
        {
            _logger = logger;
        }

        [HttpGet("city/{cityId}")]
        public IActionResult GetCityLogs(int cityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (cityId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid city ID" });
                }

                if (page < 1 || pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 100"
                    });
                }

                // Validate city organizer access
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string adminName = User.FindFirst("name")?.Value ?? "Unknown";

                DBservices dbServices = new DBservices();
                bool hasAccess = dbServices.IsUserCityOrganizer(userId, cityId);
                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access logs for city {CityId}",
                        adminName, userId, cityId);
                    return StatusCode(403, new { success = false, message = "You do not have access to this city's logs" });
                }

                // Get logs for the city with pagination
                var (logs, hasMore) = GetFormattedLogs(entityType: "City", entityId: cityId, page, pageSize);

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) downloaded logs for city {CityId}",
                    adminName, userId, cityId);

                return Ok(new
                {
                    success = true,
                    logs = logs,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        hasMore = hasMore
                    },
                    timeframe = new
                    {
                        start = DateTime.Now.AddDays(-7).ToString("yyyy-MM-dd"),
                        end = DateTime.Now.ToString("yyyy-MM-dd")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving logs for city {CityId}", cityId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the logs" });
            }
        }

        [HttpGet("group/{groupId}")]
        public IActionResult GetGroupLogs(int groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (groupId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid group ID" });
                }

                if (page < 1 || pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 100"
                    });
                }

                // Get user ID from claims
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Get group city to validate access
                DBservices dbServices = new DBservices();
                var groupCityId = dbServices.GetGroupCityId(groupId);
                if (!groupCityId.HasValue)
                {
                    return NotFound(new { success = false, message = "Group not found" });
                }

                bool hasAccess = dbServices.IsUserCityOrganizer(userId, groupCityId.Value);
                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access logs for group {GroupId} in city {CityId}",
                        userName, userId, groupId, groupCityId.Value);
                    return StatusCode(403, new { success = false, message = "You do not have access to this group's logs" });
                }

                // Get logs for the group with pagination
                var (logs, hasMore) = GetFormattedLogs(entityType: "Group", entityId: groupId, page, pageSize);

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) downloaded logs for group {GroupId}",
                    userName, userId, groupId);

                return Ok(new
                {
                    success = true,
                    logs = logs,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        hasMore = hasMore
                    },
                    timeframe = new
                    {
                        start = DateTime.Now.AddDays(-7).ToString("yyyy-MM-dd"),
                        end = DateTime.Now.ToString("yyyy-MM-dd")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving logs for group {GroupId}", groupId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the logs" });
            }
        }

        [HttpGet("event/{eventId}")]
        public IActionResult GetEventLogs(int eventId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                if (eventId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid event ID" });
                }

                if (page < 1 || pageSize < 1 || pageSize > 100)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Page must be ≥ 1 and pageSize must be between 1 and 100"
                    });
                }

                // Get user ID from claims
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
                string userName = User.FindFirst("name")?.Value ?? "Unknown";

                // Get event city to validate access
                DBservices dbServices = new DBservices();
                var eventCityId = dbServices.GetEventCityId(eventId);
                if (!eventCityId.HasValue)
                {
                    return NotFound(new { success = false, message = "Event not found" });
                }

                bool hasAccess = dbServices.IsUserCityOrganizer(userId, eventCityId.Value);
                if (!hasAccess)
                {
                    _logger.LogWarning("Unauthorized access attempt: Admin {AdminName} (ID: {AdminId}) tried to access logs for event {EventId} in city {CityId}",
                        userName, userId, eventId, eventCityId.Value);
                    return StatusCode(403, new { success = false, message = "You do not have access to this event's logs" });
                }

                // Get logs for the event with pagination
                var (logs, hasMore) = GetFormattedLogs(entityType: "Event", entityId: eventId, page, pageSize);

                _logger.LogInformation("Admin {AdminName} (ID: {AdminId}) downloaded logs for event {EventId}",
                    userName, userId, eventId);

                return Ok(new
                {
                    success = true,
                    logs = logs,
                    pagination = new
                    {
                        currentPage = page,
                        pageSize = pageSize,
                        hasMore = hasMore
                    },
                    timeframe = new
                    {
                        start = DateTime.Now.AddDays(-7).ToString("yyyy-MM-dd"),
                        end = DateTime.Now.ToString("yyyy-MM-dd")
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving logs for event {EventId}", eventId);
                return StatusCode(500, new { success = false, message = "An error occurred while retrieving the logs" });
            }
        }

        private (List<AdminLogEntry>, bool) GetFormattedLogs(string entityType, int entityId, int page, int pageSize)
        {
            var allLogs = new List<AdminLogEntry>();
            string logDirectory = Path.Combine(Directory.GetCurrentDirectory(), "logs");
            var lastWeek = DateTime.Now.AddDays(-7);

            if (!Directory.Exists(logDirectory))
            {
                _logger.LogError("Log directory not found: {LogDirectory}", logDirectory);
                return (new List<AdminLogEntry>(), false);
            }

            var logFiles = Directory.GetFiles(logDirectory, "admin-audit-*.txt");

            string entityIdStr = entityId.ToString();
            string entityTypeStr = entityType.ToLower();

            foreach (var filePath in logFiles)
            {
                try
                {
                    // Use FileShare.ReadWrite to avoid the locking issue
                    using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    using (var streamReader = new StreamReader(fileStream))
                    {
                        string content = "";
                        string line;
                        bool foundRelevantEntry = false;
                        DateTime? entryTimestamp = null;

                        // Read the file line by line
                        while ((line = streamReader.ReadLine()) != null)
                        {
                            // Check if this is the start of a new log entry (timestamp pattern)
                            var timestampMatch = Regex.Match(line, @"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})");
                            if (timestampMatch.Success)
                            {
                                // Process the previous entry if it was relevant
                                if (foundRelevantEntry && !string.IsNullOrEmpty(content) && entryTimestamp.HasValue)
                                {
                                    if (entryTimestamp >= lastWeek)
                                    {
                                        string formattedMessage = FormatLogMessage(content);
                                        // Only add the log if it doesn't look like technical details
                                        if (ShouldIncludeLog(formattedMessage))
                                        {
                                            allLogs.Add(new AdminLogEntry
                                            {
                                                Timestamp = entryTimestamp.Value,
                                                Message = formattedMessage
                                            });
                                        }
                                    }
                                }

                                // Start a new entry
                                content = line;
                                entryTimestamp = DateTime.Parse(timestampMatch.Groups[1].Value);
                                // Check if this new entry is potentially relevant
                                foundRelevantEntry = line.IndexOf(entityTypeStr, StringComparison.OrdinalIgnoreCase) >= 0 &&
                                                    line.Contains(entityIdStr);
                            }
                            else
                            {
                                // Continue the current entry
                                content += Environment.NewLine + line;

                                // If we haven't found relevance yet, check this line
                                if (!foundRelevantEntry)
                                {
                                    foundRelevantEntry = line.IndexOf(entityTypeStr, StringComparison.OrdinalIgnoreCase) >= 0 &&
                                                       line.Contains(entityIdStr);
                                }
                            }
                        }

                        // Don't forget the last entry in the file
                        if (foundRelevantEntry && !string.IsNullOrEmpty(content) && entryTimestamp.HasValue)
                        {
                            if (entryTimestamp >= lastWeek)
                            {
                                string formattedMessage = FormatLogMessage(content);
                                if (ShouldIncludeLog(formattedMessage))
                                {
                                    allLogs.Add(new AdminLogEntry
                                    {
                                        Timestamp = entryTimestamp.Value,
                                        Message = formattedMessage
                                    });
                                }
                            }
                        }
                    }
                }
                catch (IOException ex)
                {
                    // Log the error but continue with other files
                    _logger.LogWarning(ex, "Error reading log file {FilePath}", filePath);
                }
            }

            // Sort logs by timestamp (newest first) and apply pagination
            var orderedLogs = allLogs.OrderByDescending(l => l.Timestamp).ToList();

            // Calculate pagination
            int skip = (page - 1) * pageSize;
            bool hasMore = orderedLogs.Count > skip + pageSize;

            // Get only the logs for the current page
            var pagedLogs = orderedLogs
                .Skip(skip)
                .Take(pageSize)
                .ToList();

            return (pagedLogs, hasMore);
        }

        private bool ShouldIncludeLog(string message)
        {
            // Filter out HTTP request logs that aren't meaningful for organizers
            if (message.Contains("HTTP GET") ||
                message.Contains("HTTP POST") ||
                message.Contains("responded") ||
                message.Contains(" ms"))
            {
                return false;
            }

            // Filter out raw JSON logs
            if (message.StartsWith("{\"") || message.Contains("SourceContext"))
            {
                return false;
            }

            // Filter out error messages
            if (message.Contains("[ERR]") ||
                message.Contains("Exception") ||
                message.Contains("UnhandledException") ||
                message.Contains("DeveloperExceptionPageMiddleware"))
            {
                return false;
            }

            // Filter out the logs about downloading logs (to avoid recursive entries)
            if (message.Contains("downloaded logs"))
            {
                return false;
            }

            return true;
        }

        private string FormatLogMessage(string logContent)
        {
            // Remove log level indicators
            var cleanMessage = logContent
                .Replace("[Information]", "")
                .Replace("[Warning]", "")
                .Replace("[Error]", "");

            // Keep "Admin" instead of changing to "User"

            // Handle JSON structured logs
            if (cleanMessage.Contains("{\""))
            {
                // Try to extract the actual log message that follows JSON
                int messageStart = cleanMessage.LastIndexOf("}");
                if (messageStart >= 0 && messageStart + 1 < cleanMessage.Length)
                {
                    cleanMessage = cleanMessage.Substring(messageStart + 1).Trim();
                }
                else
                {
                    // If we can't extract a readable message, provide a simplified explanation
                    return "System activity logged";
                }
            }

            // Remove timestamp prefix
            cleanMessage = Regex.Replace(cleanMessage, @"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", "").Trim();

            // Format specific admin actions in a readable way
            cleanMessage = FormatAdminAction(cleanMessage);

            return cleanMessage;
        }

        private string FormatAdminAction(string message)
        {
            // Format events related to group creation
            if (message.Contains("created group"))
            {
                var match = Regex.Match(message, @"([\w\s]+) created group ([^(]+)(?: \((?:ID: )?(\d+)\))? (?:for|in) city (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string groupName = match.Groups[2].Value.Trim();
                    string groupId = match.Groups[3].Success ? $" (ID: {match.Groups[3].Value})" : "";
                    string cityId = match.Groups[4].Value;

                    return $"Admin {admin} created group '{groupName}'{groupId} in city {cityId}";
                }
            }

            // Format events related to group deletion
            else if (message.Contains("deleted group"))
            {
                var match = Regex.Match(message, @"([\w\s]+) deleted group (\d+)(?: in city (\d+))?");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string groupId = match.Groups[2].Value;
                    string cityInfo = match.Groups[3].Success ? $" in city {match.Groups[3].Value}" : "";

                    return $"Admin {admin} deleted group {groupId}{cityInfo}";
                }
            }

            // Format events related to changing group admin
            else if (message.Contains("changed admin for group"))
            {
                var match = Regex.Match(message, @"([\w\s]+) changed admin for group (\d+) from user (\d+) to user (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string groupId = match.Groups[2].Value;
                    string oldAdminId = match.Groups[3].Value;
                    string newAdminId = match.Groups[4].Value;

                    return $"Admin {admin} changed admin for group {groupId} from user {oldAdminId} to user {newAdminId}";
                }
            }

            // Format events related to event creation
            else if (message.Contains("created event"))
            {
                var match = Regex.Match(message, @"([\w\s]+) created event ([^(]+)(?: \((?:ID: )?(\d+)\))? (?:for|in) city (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string eventName = match.Groups[2].Value.Trim();
                    string eventId = match.Groups[3].Success ? $" (ID: {match.Groups[3].Value})" : "";
                    string cityId = match.Groups[4].Value;

                    return $"Admin {admin} created event '{eventName}'{eventId} in city {cityId}";
                }
            }

            // Format events related to event deletion
            else if (message.Contains("deleted event"))
            {
                var match = Regex.Match(message, @"([\w\s]+) deleted event (\d+)(?: in city (\d+))?");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string eventId = match.Groups[2].Value;
                    string cityInfo = match.Groups[3].Success ? $" in city {match.Groups[3].Value}" : "";

                    return $"Admin {admin} deleted event {eventId}{cityInfo}";
                }
            }

            // Format events related to changing event admin
            else if (message.Contains("changed admin for event"))
            {
                var match = Regex.Match(message, @"([\w\s]+) changed admin for event (\d+) from user (\d+) to user (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string eventId = match.Groups[2].Value;
                    string oldAdminId = match.Groups[3].Value;
                    string newAdminId = match.Groups[4].Value;

                    return $"Admin {admin} changed admin for event {eventId} from user {oldAdminId} to user {newAdminId}";
                }
            }

            // Format member removal from groups
            else if (message.Contains("removed member"))
            {
                var match = Regex.Match(message, @"([\w\s]+) removed member (\d+) from group (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string userId = match.Groups[2].Value;
                    string groupId = match.Groups[3].Value;

                    return $"Admin {admin} removed member {userId} from group {groupId}";
                }
            }

            // Format player removal from events
            else if (message.Contains("removed player"))
            {
                var match = Regex.Match(message, @"([\w\s]+) removed player (\d+) from event (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string userId = match.Groups[2].Value;
                    string eventId = match.Groups[3].Value;

                    return $"Admin {admin} removed player {userId} from event {eventId}";
                }
            }

            // Format approval/rejection of requests
            else if (message.Contains("approved") || message.Contains("rejected"))
            {
                var match = Regex.Match(message, @"([\w\s]+) (approved|rejected) (?:join )?request (?:from )?(?:user )?(\d+)(?: for)? (group|event) (\d+)");
                if (match.Success)
                {
                    string admin = match.Groups[1].Value.Trim();
                    string action = match.Groups[2].Value;
                    string userId = match.Groups[3].Value;
                    string entityType = match.Groups[4].Value;
                    string entityId = match.Groups[5].Value;

                    return $"Admin {admin} {action} request from user {userId} for {entityType} {entityId}";
                }
            }

            // Clean up any remaining technical parts
            message = message.Replace("User ", "Admin ");
            message = Regex.Replace(message, @"\(ID: \d+\)", "").Trim();

            return message;
        }
    }

}

