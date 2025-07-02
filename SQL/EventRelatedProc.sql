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
    
    -- First get the event details including RequiresTeams and IsPublic flags
    SELECT 
        @requiresTeams = RequiresTeams,
        @isPublic = IsPublic
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- If user is authenticated, check participation status
    IF @userId IS NOT NULL
    BEGIN
        -- First check admin status - if admin, we don't need to check other participation
        IF EXISTS (SELECT 1 FROM EventAdmins WHERE EventId = @eventId AND CityOrganizerId = @userId)
        BEGIN
            SET @isAdmin = 1;
        END
        -- Only check participation if not admin
        ELSE
        BEGIN
            -- Check direct participation
            IF EXISTS (SELECT 1 FROM EventParticipants WHERE EventId = @eventId AND UserId = @userId)
            BEGIN
                SET @isParticipant = 1;
                
                -- Get PlayWatch value for direct participation
                SELECT @playWatch = PlayWatch
                FROM EventParticipants
                WHERE EventId = @eventId AND UserId = @userId;
            END
            -- Check group participation if event requires teams
            ELSE IF @requiresTeams = 1 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM EventTeams et
                    JOIN GroupMembers gm ON et.GroupId = gm.GroupId
                    WHERE et.EventId = @eventId AND gm.UserId = @userId
                )
                BEGIN
                    SET @isParticipant = 1;
                    SET @playWatch = 1; -- Group participants are always players
                END
            END
            -- If not admin, not participant, AND not a team event, check for pending request
			ELSE IF @requiresTeams = 0  -- Only check pending requests for non-team events
			BEGIN
				-- Check if user has a pending join request
				IF EXISTS (
					SELECT 1 
					FROM EventJoinRequests 
					WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
				)
				BEGIN
					SET @hasPendingRequest = 1;
				END
			END;
        END;
    END;
    
    -- Check access restriction for private team events
    IF @requiresTeams = 1 AND @isPublic = 0
    BEGIN
        -- Only allow access if user is admin or participant
        IF @userId IS NULL OR (@isAdmin = 0 AND @isParticipant = 0)
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
            @playWatch AS PlayWatch,
            @isAdmin AS IsAdmin,
			@hasPendingRequest AS HasPendingRequest
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
                INSERT INTO EventLocations (LocationName, Latitude, Longitude)
                VALUES (@LocationName, NULL, NULL);
                
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