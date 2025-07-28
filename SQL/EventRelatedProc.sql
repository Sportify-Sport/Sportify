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
        e.EventId, e.EventName, e.RequiresTeams, e.StartDatetime, e.EndDatetime, e.CityId, e.LocationId, e.SportId,
		e.MaxTeams, e.CreatedAt, e.IsPublic, e.MaxParticipants, e.MinAge, e.Gender, e.ParticipantsNum, e.TeamsNum, e.ProfileImage, el.LocationName
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
    
    DECLARE @Events TABLE (
        EventId INT,
        EventName NVARCHAR(100),
        ProfileImage NVARCHAR(255)
    );
    
    -- First, get public events that haven't started yet
    INSERT INTO @Events
    SELECT TOP (@count) EventId, EventName, ProfileImage
    FROM [Events]
    WHERE IsPublic = 1 AND StartDatetime > GETDATE()
    ORDER BY NEWID();
    
    -- Check how many we got
    DECLARE @currentCount INT = (SELECT COUNT(*) FROM @Events);
    
    -- If we need more events, get any random events
    IF @currentCount < @count
    BEGIN
        INSERT INTO @Events
        SELECT TOP (@count - @currentCount) EventId, EventName, ProfileImage
        FROM [Events]
        WHERE EventId NOT IN (SELECT EventId FROM @Events)
        ORDER BY NEWID();
    END
    
    -- Return the results
    SELECT EventId, EventName, ProfileImage FROM @Events;
END
GO


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
    DECLARE @playWatch BIT = NULL;
    DECLARE @isAdmin BIT = 0;
    DECLARE @hasAccess BIT = 1;
    DECLARE @hasPendingRequest BIT = 0;
    DECLARE @viewerCount INT = 0;
    DECLARE @isGroupMember BIT = 0;

    -- First get the event details including RequiresTeams and IsPublic flags
    SELECT 
        @requiresTeams = RequiresTeams,
        @isPublic = IsPublic
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Calculate viewer count
    -- If event is public, count actual viewers; if private, set to 0
    IF @isPublic = 1
    BEGIN
        SELECT @viewerCount = COUNT(*)
        FROM EventParticipants
        WHERE EventId = @eventId AND PlayWatch = 0;  -- 0 means viewer
    END
    ELSE
    BEGIN
        SET @viewerCount = 0;  -- Private events show 0 viewers
    END

    -- If user is authenticated, check status
    IF @userId IS NOT NULL
    BEGIN
        -- Check if user is event admin
        IF EXISTS (SELECT 1 FROM EventAdmins WHERE EventId = @eventId AND CityOrganizerId = @userId)
        BEGIN
            SET @isAdmin = 1;
        END
        
        -- Check if user is member of a group participating in the event
        IF EXISTS (
            SELECT 1 FROM EventTeams et
            INNER JOIN GroupMembers gm ON et.GroupId = gm.GroupId
            WHERE et.EventId = @eventId AND gm.UserId = @userId
        )
        BEGIN
            SET @isGroupMember = 1;
        END
        
        -- Only check participation if not admin
        IF @isAdmin = 0
        BEGIN
            -- For team events (including all private events), check group membership
            IF @requiresTeams = 1
            BEGIN
                IF @isGroupMember = 1
                BEGIN
                    SET @isParticipant = 1;
                    SET @playWatch = 1; -- Group participants are always players
                END

				-- Also check direct participation
				IF EXISTS (SELECT 1 FROM EventParticipants WHERE EventId = @eventId AND UserId = @userId)
				BEGIN
					SET @isParticipant = 1;
        
					-- Get PlayWatch value for direct participation
					SELECT @playWatch = PlayWatch
					FROM EventParticipants
					WHERE EventId = @eventId AND UserId = @userId;
				END
            END
            -- For non-team events, check direct participation
            ELSE
            BEGIN
                IF EXISTS (SELECT 1 FROM EventParticipants WHERE EventId = @eventId AND UserId = @userId)
                BEGIN
                    SET @isParticipant = 1;
                    
                    -- Get PlayWatch value for direct participation
                    SELECT @playWatch = PlayWatch
                    FROM EventParticipants
                    WHERE EventId = @eventId AND UserId = @userId;
                END
                -- Check for pending request (only for non-team public events)
                ELSE IF @isPublic = 1
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM EventJoinRequests 
                        WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
                    )
                    BEGIN
                        SET @hasPendingRequest = 1;
                    END
                END
            END
        END
    END
    
    -- Check access restriction for private events
    IF @isPublic = 0  -- Private event
    BEGIN
        -- Only allow access if user is admin or member of a participating group
        IF @userId IS NULL OR (@isAdmin = 0 AND @isGroupMember = 0)
        BEGIN
            SET @hasAccess = 0;
        END
    END
    
    -- Return complete event details with participation status if user has access
    IF @hasAccess = 1
    BEGIN
        SELECT 
            e.*,
            el.LocationName,
            @isParticipant AS IsParticipant,
            @playWatch AS PlayWatch,
            @isAdmin AS IsAdmin,
            @hasPendingRequest AS HasPendingRequest,
            @viewerCount AS ViewerCount
        FROM [Events] e
        LEFT JOIN EventLocations el ON e.LocationId = el.LocationId
        WHERE e.EventId = @eventId;
    END
    ELSE
    BEGIN
        -- Return NULL result set to indicate access denied
        SELECT NULL AS EventId WHERE 1 = 0;
    END
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Checks if the user is the admin for the specified event>
-- =============================================
CREATE PROCEDURE SP_IsUserEventAdmin
    @eventId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CASE 
             WHEN EXISTS (
                 SELECT 1 
                 FROM EventAdmins 
                 WHERE EventId = @eventId AND CityOrganizerId = @userId
             ) THEN CAST(1 AS BIT) 
             ELSE CAST(0 AS BIT) 
           END AS isAdmin;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Checks if the event is for teams or participants (Like Marathon)>
-- =============================================
CREATE PROCEDURE SP_EventRequiresTeams
    @eventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if event exists and return RequiresTeams value directly
    SELECT RequiresTeams 
    FROM [Events] 
    WHERE EventId = @eventId;
    
    -- If event doesn't exist, no rows will be returned
    -- This will be interpreted as null in C#
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <22/5/2025>
-- Description:	<Get the CityId for a specific event>
-- =============================================
CREATE PROCEDURE SP_GetEventCityId
    @EventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CityId 
    FROM Events 
    WHERE EventId = @EventId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <29/5/2025>
-- Description:	<Is used to update event details>
-- =============================================
CREATE PROCEDURE SP_UpdateEvent
    @EventId INT,
    @EventName NVARCHAR(100),
    @Description NVARCHAR(500),
    @LocationName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        DECLARE @CurrentLocationId INT;
        DECLARE @NewLocationId INT;
        DECLARE @EventStarted BIT = 0;
        DECLARE @CurrentLocationName NVARCHAR(100);
        
        -- Check if event exists and if it has already started
        SELECT 
            @CurrentLocationId = e.LocationId,
            @EventStarted = CASE WHEN e.StartDatetime <= GETDATE() THEN 1 ELSE 0 END,
            @CurrentLocationName = el.LocationName
        FROM Events e
        LEFT JOIN EventLocations el ON e.LocationId = el.LocationId
        WHERE e.EventId = @EventId;
        
        IF @@ROWCOUNT = 0
        BEGIN
            SELECT 0 AS Success, 'Event not found' AS Message;
            RETURN;
        END
        
        -- Check if event has started
        IF @EventStarted = 1
        BEGIN
            SELECT 0 AS Success, 'Cannot edit event that has already started' AS Message;
            RETURN;
        END
        
        -- Check if event name already exists (excluding current event)
        --IF EXISTS (SELECT 1 FROM Events WHERE EventName = @EventName AND EventId != @EventId)
        --BEGIN
            --SELECT 0 AS Success, 'An event with this name already exists' AS Message;
            --RETURN;
        --END
        
        -- Handle location logic
        IF @CurrentLocationName IS NULL OR @CurrentLocationName <> @LocationName
        BEGIN
            -- Check if the location already exists
            SELECT @NewLocationId = LocationId 
            FROM EventLocations 
            WHERE LocationName = @LocationName;
            
            -- If location doesn't exist, create a new one
            IF @NewLocationId IS NULL
            BEGIN
                INSERT INTO EventLocations (LocationName)
                VALUES (@LocationName);
                
                SET @NewLocationId = SCOPE_IDENTITY();
            END
        END
        ELSE
        BEGIN
            -- Same location name, keep current LocationId
            SET @NewLocationId = @CurrentLocationId;
        END
        
        -- Update the event
        UPDATE Events 
        SET 
            EventName = @EventName,
            Description = @Description,
            LocationId = @NewLocationId
        WHERE EventId = @EventId;
        
        -- Check if old location is now unused and delete if so
        IF @CurrentLocationId IS NOT NULL AND @CurrentLocationId <> @NewLocationId
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Events WHERE LocationId = @CurrentLocationId)
            BEGIN
                DELETE FROM EventLocations WHERE LocationId = @CurrentLocationId;
            END
        END
        
        SELECT 1 AS Success, 'Event updated successfully' AS Message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <17/7/2025>
-- Description: Get all events a user is eligible to join
-- =============================================
CREATE PROCEDURE SP_GetEligibleEventsForUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get user details
    DECLARE @UserAge INT, @UserGender NVARCHAR(1);
    
    SELECT 
        @UserAge = DATEDIFF(YEAR, BirthDate, GETDATE()) - 
                   CASE 
                       WHEN DATEADD(YEAR, DATEDIFF(YEAR, BirthDate, GETDATE()), BirthDate) > GETDATE() 
                       THEN 1 
                       ELSE 0 
                   END,
        @UserGender = Gender
    FROM Users
    WHERE UserId = @UserId;
    
    -- Get eligible events
    SELECT DISTINCT
        e.EventId,
        e.EventName,
        e.ProfileImage,
        e.StartDatetime,
        e.EndDatetime,
        e.CityId,
        e.SportId,
        e.MinAge,
        e.Gender,
        e.Description
    FROM [Events] e
    WHERE 
        -- Event hasn't started yet
        e.StartDatetime > GETDATE()
        -- Age requirement
        AND @UserAge >= e.MinAge
        -- Gender requirement (Mixed accepts everyone)
        AND (e.Gender = 'Mixed' OR 
             (e.Gender = 'Male' AND @UserGender = 'M') OR 
             (e.Gender = 'Female' AND @UserGender = 'F'))
        -- User is not already participating
        AND NOT EXISTS (
            SELECT 1 FROM EventParticipants ep 
            WHERE ep.EventId = e.EventId AND ep.UserId = @UserId
        )
        -- For team events, check if user's group is not already participating
        AND NOT EXISTS (
            SELECT 1 FROM EventTeams et
            INNER JOIN GroupMembers gm ON et.GroupId = gm.GroupId
            WHERE et.EventId = e.EventId AND gm.UserId = @UserId
        )
        -- Public events OR private events where user has access
        AND (
            e.IsPublic = 1 
            OR EXISTS (
                -- User is in a group that's part of this private event
                SELECT 1 FROM EventTeams et2
                INNER JOIN GroupMembers gm2 ON et2.GroupId = gm2.GroupId
                WHERE et2.EventId = e.EventId AND gm2.UserId = @UserId
            )
        )
        -- Event hasn't reached max capacity
        AND (
            (e.RequiresTeams = 0 AND (e.MaxParticipants IS NULL OR e.ParticipantsNum < e.MaxParticipants))
            OR 
            (e.RequiresTeams = 1 AND (e.MaxTeams IS NULL OR e.TeamsNum < e.MaxTeams))
        )
    ORDER BY e.StartDatetime;
END
GO