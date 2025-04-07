-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets event details>
-- =============================================
CREATE PROCEDURE SP_GetEventDetails
    @eventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.*,
        el.LocationName,
        el.Latitude,
        el.Longitude
    FROM 
        Events e
    LEFT JOIN 
        EventLocations el ON e.LocationId = el.LocationId
    WHERE 
        e.EventId = @eventId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets 5 random events from the events table>
-- =============================================
CREATE PROCEDURE SP_GetRandomEvents
    @count INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@count) EventId, EventName, ProfileImage
    FROM [Events]
    WHERE IsPublic = 1
      AND StartDatetime >= GETDATE()
    ORDER BY NEWID();
END


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets public events from the events table (Pagination)>
-- =============================================
CREATE PROCEDURE SP_GetEventsPaginated
    @lastEventDate DATETIME = NULL,
    @lastEventId INT = NULL,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EventId, 
        EventName, 
        StartDatetime, 
        EndDatetime, 
        SportId, 
        ProfileImage,
        CityId
    FROM [Events]
    WHERE 
        IsPublic = 1
        AND (
            -- First page or continuation condition
            @lastEventDate IS NULL
            OR StartDatetime > @lastEventDate
            OR (StartDatetime = @lastEventDate AND EventId > @lastEventId)
        )
    ORDER BY StartDatetime ASC, EventId ASC
    OFFSET 0 ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/4/2025>
-- Description:	Retrieves event details along with user's participation status (direct or group), 
--              play/watch status, and admin status (if the user is authenticated).
-- =============================================
CREATE PROCEDURE SP_GetEventDetailsWithParticipationStatus
    @eventId INT,
    @userId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @requiresTeams BIT;
    DECLARE @isPublic BIT;
    DECLARE @isParticipant BIT = 0;
    DECLARE @isGroupParticipant BIT = 0;
    DECLARE @playWatch BIT = NULL;
    DECLARE @isAdmin BIT = 0;
    DECLARE @hasAccess BIT = 1;
    
    -- First get the event details including RequiresTeams and IsPublic flags
    SELECT 
        @requiresTeams = RequiresTeams,
        @isPublic = IsPublic
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- If user is authenticated, check participation status
    IF @userId IS NOT NULL
    BEGIN
        -- Always check admin status regardless of participation
        IF EXISTS (SELECT 1 FROM EventAdmins WHERE EventId = @eventId AND CityOrganizerId = @userId)
        BEGIN
            SET @isAdmin = 1;
        END;
        
        -- Check direct participation
        IF EXISTS (SELECT 1 FROM EventParticipants WHERE EventId = @eventId AND UserId = @userId)
        BEGIN
            SET @isParticipant = 1;
            
            -- Get PlayWatch value for direct participation
            SELECT @playWatch = PlayWatch
            FROM EventParticipants
            WHERE EventId = @eventId AND UserId = @userId;
        END;
        
        -- Check group participation if event requires teams
        IF @requiresTeams = 1 
        BEGIN
            IF EXISTS (
                SELECT 1 FROM EventTeams et
                JOIN GroupMembers gm ON et.GroupId = gm.GroupId
                WHERE et.EventId = @eventId AND gm.UserId = @userId
            )
            BEGIN
                SET @isGroupParticipant = 1;
                SET @playWatch = 1; -- Group participants are always players
            END;
        END;
    END;
    
    -- Check access restriction for private team events
    IF @requiresTeams = 1 AND @isPublic = 0
    BEGIN
        -- Only allow access if user is admin or participant
        IF @userId IS NULL OR (@isAdmin = 0 AND @isParticipant = 0 AND @isGroupParticipant = 0)
        BEGIN
            SET @hasAccess = 0;
        END;
    END;
    
    -- Return complete event details with participation status if user has access
    IF @hasAccess = 1
    BEGIN
        SELECT 
            e.*,
            el.LocationName,
            el.Latitude,
            el.Longitude,
            @isParticipant AS IsParticipant,
            @isGroupParticipant AS IsGroupParticipant,
            @playWatch AS PlayWatch,
            @isAdmin AS IsAdmin
        FROM [Events] e
        LEFT JOIN EventLocations el ON e.LocationId = el.LocationId
        WHERE e.EventId = @eventId;
    END
    ELSE
    BEGIN
        -- Return NULL result set to indicate access denied
        SELECT NULL AS EventId WHERE 1 = 0;
    END;
END