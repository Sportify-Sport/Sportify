-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to register or update push token>
-- =============================================
CREATE PROCEDURE SP_RegisterOrUpdateUserPushNotificationToken
    @UserId INT,
    @PushToken NVARCHAR(500),
    @DeviceId NVARCHAR(255),
    @Platform NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if token exists for this user/device
    IF EXISTS (SELECT 1 FROM UserPushNotificationTokens WHERE UserId = @UserId AND DeviceId = @DeviceId)
    BEGIN
        -- Update existing token
        UPDATE UserPushNotificationTokens
        SET PushToken = @PushToken,
            Platform = @Platform,
            IsActive = 1,
            UpdatedAt = GETUTCDATE(),
            LastUsedAt = GETUTCDATE(),
            FailureCount = 0
        WHERE UserId = @UserId AND DeviceId = @DeviceId;
    END
    ELSE
    BEGIN
        -- Insert new token
        INSERT INTO UserPushNotificationTokens (UserId, PushToken, DeviceId, Platform)
        VALUES (@UserId, @PushToken, @DeviceId, @Platform);
    END
    
    SELECT 1 AS Success;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to get active tokens for users>
-- =============================================
CREATE PROCEDURE SP_GetActiveUserPushNotificationTokens
    @UserIds NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TokenId, UserId, PushToken, DeviceId, Platform, FailureCount
    FROM UserPushNotificationTokens
    WHERE IsActive = 1 
        AND FailureCount < 5  -- Don't use tokens that failed too many times
        AND UserId IN (SELECT value FROM STRING_SPLIT(@UserIds, ','));
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to get event notification recipients>
-- =============================================
CREATE PROCEDURE SP_GetEventNotificationRecipients
    @EventId INT,
    @RecipientType NVARCHAR(50) = 'all'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RequiresTeams BIT, @IsPublic BIT;
    
    SELECT @RequiresTeams = RequiresTeams, @IsPublic = IsPublic
    FROM [Events]
    WHERE EventId = @EventId;
    
    -- Case 1: Private event (RequiresTeams = 0, IsPublic = 0)
    IF @RequiresTeams = 0 AND @IsPublic = 0
    BEGIN
        SELECT DISTINCT gm.UserId
        FROM GroupMembers gm
        INNER JOIN EventTeams et ON gm.GroupId = et.GroupId
        WHERE et.EventId = @EventId;
    END
    -- Case 2: Public event without teams (RequiresTeams = 0, IsPublic = 1)
    ELSE IF @RequiresTeams = 0 AND @IsPublic = 1
    BEGIN
        IF @RecipientType = 'groups'
        BEGIN
            SELECT DISTINCT gm.UserId
            FROM GroupMembers gm
            INNER JOIN EventTeams et ON gm.GroupId = et.GroupId
            WHERE et.EventId = @EventId;
        END
        ELSE -- 'all'
        BEGIN
            SELECT DISTINCT UserId FROM (
                SELECT gm.UserId
                FROM GroupMembers gm
                INNER JOIN EventTeams et ON gm.GroupId = et.GroupId
                WHERE et.EventId = @EventId
                
                UNION
                
                SELECT ep.UserId
                FROM EventParticipants ep
                WHERE ep.EventId = @EventId
            ) AS AllUsers;
        END
    END
    -- Case 3: Event with teams (RequiresTeams = 1)
    ELSE IF @RequiresTeams = 1
    BEGIN
        IF @RecipientType = 'players'
        BEGIN
            SELECT UserId
            FROM EventParticipants
            WHERE EventId = @EventId AND PlayWatch = 1;
        END
        ELSE -- 'all'
        BEGIN
            SELECT UserId
            FROM EventParticipants
            WHERE EventId = @EventId;
        END
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to get group notification recipients>
-- =============================================
CREATE PROCEDURE SP_GetGroupNotificationRecipients
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserId
    FROM GroupMembers
    WHERE GroupId = @GroupId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to save notification history>
-- =============================================
CREATE PROCEDURE SP_SaveNotificationHistory
    @UserId INT,
    @Title NVARCHAR(255),
    @Body NVARCHAR(1000),
    @NotificationData NVARCHAR(MAX),
    @NotificationType NVARCHAR(100),
    @RelatedEntityId INT,
    @RelatedEntityType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO NotificationHistory 
        (UserId, Title, Body, NotificationData, NotificationType, RelatedEntityId, RelatedEntityType)
    VALUES 
        (@UserId, @Title, @Body, @NotificationData, @NotificationType, @RelatedEntityId, @RelatedEntityType);
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to mark push token as invalid>
-- =============================================
CREATE PROCEDURE SP_MarkPushTokenAsInvalid
    @PushToken NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE UserPushNotificationTokens
    SET IsActive = 0, UpdatedAt = GETUTCDATE()
    WHERE PushToken = @PushToken;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to increment token failure count>
-- =============================================
CREATE PROCEDURE SP_IncrementTokenFailureCount
    @PushToken NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE UserPushNotificationTokens
    SET FailureCount = FailureCount + 1,
        UpdatedAt = GETUTCDATE(),
        IsActive = CASE WHEN FailureCount >= 4 THEN 0 ELSE IsActive END
    WHERE PushToken = @PushToken;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to get user ID from group join request>
-- =============================================
CREATE PROCEDURE SP_GetUserIdFromGroupJoinRequest
    @RequestId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT RequesterUserId
    FROM GroupJoinRequests
    WHERE RequestId = @RequestId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to mark notification as read>
-- =============================================
CREATE PROCEDURE SP_MarkNotificationAsRead
    @NotificationId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NotificationHistory
    SET IsRead = 1,
        ReadAt = GETUTCDATE()
    WHERE NotificationId = @NotificationId 
        AND UserId = @UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/7/2025>
-- Description:	<SP to get user notification history>
-- =============================================
CREATE PROCEDURE SP_GetUserNotificationHistory
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 100
        NotificationId,
        Title,
        Body,
        NotificationData,
        SentAt,
        IsRead,
        ReadAt,
        NotificationType,
        RelatedEntityId,
        RelatedEntityType
    FROM NotificationHistory
    WHERE UserId = @UserId
    ORDER BY SentAt DESC;
END
GO
