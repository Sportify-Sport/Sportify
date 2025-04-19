-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Gets Event Players, only who play (PlayWatch =  True), >
-- =============================================
CREATE PROCEDURE SP_GetEventPlayers
    @eventId INT,
    @page INT,
    @pageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @requiresTeams BIT;
    
    -- Check if the event is a non-team event
    SELECT @requiresTeams = RequiresTeams FROM Events WHERE EventId = @eventId;
    
    IF @requiresTeams = 1
    BEGIN
        -- If it's a team event, return empty result
        RETURN;
    END
    
    -- Calculate the offset for pagination
    DECLARE @offset INT = (@page - 1) * @pageSize;
    DECLARE @fetchCount INT = @pageSize + 1; -- Fetch one extra for hasMore check
    
    -- Get participants with PlayWatch = 1 (players, not watchers)
    SELECT 
        u.UserId,
        u.FirstName + ' ' + u.LastName AS FullName,
        u.ProfileImage AS Image,
        CASE WHEN EXISTS (
            SELECT 1 FROM EventAdmins 
            WHERE EventId = @eventId AND CityOrganizerId = u.UserId
        ) THEN 1 ELSE 0 END AS IsAdmin
    FROM 
        EventParticipants ep
        INNER JOIN Users u ON ep.UserId = u.UserId
    WHERE 
        ep.EventId = @eventId
        AND ep.PlayWatch = 1 -- Only get players, not watchers
    ORDER BY 
        u.FirstName, u.LastName
    OFFSET @offset ROWS
    FETCH NEXT @fetchCount ROWS ONLY;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<This procedure is for joining reuqests to participant events (Watch or Play mode), watch mode doesn't require a request>
-- =============================================
CREATE PROCEDURE SP_ProcessEventJoinRequestParticipants
    @eventId INT,
    @userId INT,
    @playWatch BIT  -- 1 for 'Play', 0 for 'Watch'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @result NVARCHAR(50) = 'Success';
    DECLARE @isPublic BIT;
    DECLARE @requiresTeams BIT;
    DECLARE @oneDayAgo DATE = DATEADD(DAY, -1, CAST(GETDATE() AS DATE));
    DECLARE @startDatetime DATETIME;
    DECLARE @endDatetime DATETIME;
    DECLARE @currentDateTime DATETIME = GETDATE();
    DECLARE @minAge INT;
    DECLARE @eventGender NVARCHAR(6);
    DECLARE @maxParticipants INT;
    DECLARE @currentParticipants INT;
    DECLARE @userBirthDate DATE;
    DECLARE @userGender NVARCHAR(1);
    DECLARE @userAge INT;

    -- Check if event exists and get event properties
    SELECT 
        @isPublic = IsPublic, 
        @requiresTeams = RequiresTeams,
        @startDatetime = StartDatetime,
        @endDatetime = EndDatetime,
        @minAge = MinAge,
        @eventGender = Gender,
        @maxParticipants = MaxParticipants,
        @currentParticipants = ParticipantsNum
    FROM [Events]
    WHERE EventId = @eventId;
    
	-- Check if event was found
	IF @isPublic IS NULL OR @requiresTeams IS NULL
	BEGIN
		SET @result = 'EventNotFound';
		GOTO ReturnResult;
	END

	-- Check if user is an admin
    IF EXISTS (SELECT 1 FROM EventAdmins WHERE EventId = @eventId AND CityOrganizerId = @userId)
    BEGIN
        SET @result= 'Admins of this event cannot join';
        GOTO ReturnResult;
    END

    -- Check if event requires teams
    IF @requiresTeams = 1
    BEGIN
        SET @result = 'EventRequiresTeams';
        GOTO ReturnResult;
    END
    
    -- Check if event is public
    IF @isPublic = 0
    BEGIN
        SET @result = 'PrivateEvent';
        GOTO ReturnResult;
    END
    
    -- Check if user is already a participant (Play or Watch)
    IF EXISTS (
        SELECT 1 
        FROM EventParticipants 
        WHERE EventId = @eventId AND UserId = @userId
    )
    BEGIN
        SET @result = 'AlreadyParticipating';
        GOTO ReturnResult;
    END
    
	-- Check if user has a pending play request
	IF EXISTS (
		SELECT 1 
		FROM EventJoinRequests 
		WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
        )
        BEGIN
            SET @result = 'PendingRequestExists';
            GOTO ReturnResult;
        END

    -- WATCH request processing (PlayWatch = 0)
    IF @playWatch = 0
    BEGIN
		 -- Check if event has already ended for spectators
        IF @currentDateTime > @endDatetime
        BEGIN
            SET @result = 'EventAlreadyEnded';
            GOTO ReturnResult;
        END

        -- Add user as watcher immediately
        INSERT INTO EventParticipants (UserId, EventId, PlayWatch)
        VALUES (@userId, @eventId, 0);
        
        SET @result = 'Success';
        GOTO ReturnResult;
    END
    
    -- PLAY request processing (PlayWatch = 1)
    ELSE
    BEGIN
		-- Check if event has already started or ended for players
        IF @currentDateTime > @startDatetime
        BEGIN
            SET @result = 'EventAlreadyStarted';
            GOTO ReturnResult;
        END
        
        -- Get user details for age and gender checks
        SELECT 
            @userBirthDate = BirthDate,
            @userGender = Gender
        FROM Users
        WHERE UserId = @userId;
        
        -- Calculate user age
        SET @userAge = DATEDIFF(YEAR, @userBirthDate, @currentDateTime) - 
            CASE 
                WHEN DATEADD(YEAR, DATEDIFF(YEAR, @userBirthDate, @currentDateTime), @userBirthDate) > @currentDateTime 
                THEN 1 
                ELSE 0 
            END;
            
        -- Check age requirement
        IF @userAge < @minAge
        BEGIN
            SET @result = 'AgeTooLow';
            GOTO ReturnResult;
        END
        
        -- Check gender requirement
        IF (@eventGender = 'Male' AND @userGender <> 'M') OR 
           (@eventGender = 'Female' AND @userGender <> 'F')
           -- No check for Mixed, as it allows all genders
        BEGIN
            SET @result = 'GenderMismatch';
            GOTO ReturnResult;
        END
        
        -- Check if event is full
        IF @maxParticipants IS NOT NULL AND @currentParticipants >= @maxParticipants
        BEGIN
            SET @result = 'EventFull';
            GOTO ReturnResult;
        END

        -- Check for recent rejection/removal/left (only for play requests)
        IF EXISTS (
            SELECT 1 
            FROM EventJoinRequests 
            WHERE EventId = @eventId AND RequesterUserId = @userId 
              AND RequestStatus IN ('Rejected', 'Removed', 'Left')
              AND (RejectionOrRemovalDate IS NOT NULL AND RejectionOrRemovalDate > @oneDayAgo)
        )
        BEGIN
            SET @result = 'CooldownActive';
            GOTO ReturnResult;
        END
        
        -- Process the play request
        DECLARE @existingRequestId INT = NULL;
        
		SELECT TOP 1 @existingRequestId = RequestId 
		FROM EventJoinRequests
		WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus IN ('Canceled', 'Rejected', 'Removed', 'Left');
        
        -- Update existing request or create new one
        IF @existingRequestId IS NOT NULL
        BEGIN
            UPDATE EventJoinRequests
            SET RequestStatus = 'Pending',
                RequestedDate = CAST(GETDATE() AS DATE),
				RejectionOrRemovalDate = NULL
            WHERE RequestId = @existingRequestId;
        END
        ELSE
        BEGIN
            INSERT INTO EventJoinRequests (EventId, RequesterUserId, RequestStatus)
            VALUES (@eventId, @userId, 'Pending');
        END
        
        SET @result = 'Success';
    END
    
ReturnResult:
    SELECT @result AS Result;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/4/2025>
-- Description:	<This procedure is for canceling request participant events (Watch)>
-- =============================================
CREATE PROCEDURE SP_CancelEventJoinRequest
    @eventId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
	DECLARE @startDatetime DATETIME;
	DECLARE @currentDateTime DATETIME = GETDATE();
    
    -- Check if the event exists and requires teams
    SELECT 
		@requiresTeams = RequiresTeams,
		@startDatetime = StartDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This procedure is only for non-team events';
        GOTO ReturnResult;
    END

	-- Check if event has already started
    IF @currentDateTime > @startDatetime
    BEGIN
        SET @errorMessage = 'Cannot cancel request for an event that has already started';
        GOTO ReturnResult;
    END
    
    -- Canceling a pending request
    IF EXISTS (
        SELECT 1 
        FROM EventJoinRequests 
        WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
    )
    BEGIN
        UPDATE EventJoinRequests
        SET RequestStatus = 'Canceled'
        WHERE EventId = @eventId AND RequesterUserId = @userId AND RequestStatus = 'Pending';
        
        SET @success = 1;
    END
    ELSE
    BEGIN
        SET @errorMessage = 'No pending request found to cancel';
    END
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/4/2025>
-- Description:	<This procedure is for Leaving an event (Watch or Play)>
-- =============================================
CREATE PROCEDURE SP_LeaveEvent
    @eventId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isPlayer BIT;
    DECLARE @participantExists BIT = 0;
    DECLARE @startDatetime DATETIME;
    DECLARE @endDatetime DATETIME;
    DECLARE @currentDateTime DATETIME = GETDATE();

    -- Check if the event exists and get properties
    SELECT 
		@requiresTeams = RequiresTeams,
        @startDatetime = StartDatetime,
        @endDatetime = EndDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
    -- Check if user is a participant and if they're a player or spectator
    SELECT @isPlayer = PlayWatch, @participantExists = 1
    FROM EventParticipants
    WHERE EventId = @eventId AND UserId = @userId;
    
    IF @participantExists = 0
    BEGIN
        SET @errorMessage = 'You are not a participant in this event';
        GOTO ReturnResult;
    END
    
	-- Check timing constraints based on participant type
    IF @isPlayer = 1 -- Player
    BEGIN
        -- Check if event has started or ended
        IF @currentDateTime > @startDatetime
        BEGIN
            SET @errorMessage = 'Players cannot leave an event that has already started';
            GOTO ReturnResult;
        END
    END
    ELSE -- Spectator
    BEGIN
        -- Check if event has ended
        IF @currentDateTime > @endDatetime
        BEGIN
            SET @errorMessage = 'Spectators cannot leave an event that has already ended';
            GOTO ReturnResult;
        END
    END

    BEGIN TRANSACTION;
    
    -- Common action: Remove from EventParticipants
    DELETE FROM EventParticipants
    WHERE EventId = @eventId AND UserId = @userId;
    
    -- If user is a player, update their status in EventJoinRequests
    IF @isPlayer = 1
    BEGIN
		-- Update Events table to decrement participant count
		UPDATE [Events]
		SET ParticipantsNum = ParticipantsNum - 1
		WHERE EventId = @eventId;

        DECLARE @requestExists INT = 0;
        
        -- Check if the request exists
        SELECT @requestExists = COUNT(*)
        FROM EventJoinRequests
        WHERE EventId = @eventId AND RequesterUserId = @userId;
        
        IF @requestExists > 0
        BEGIN
            -- Update existing request
            UPDATE EventJoinRequests
            SET RequestStatus = 'Left',
                RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
            WHERE EventId = @eventId AND RequesterUserId = @userId;
        END
        ELSE
        BEGIN
            -- This is an edge case where the player somehow doesn't have a request record
            -- Insert a new 'Left' record
            INSERT INTO EventJoinRequests (EventId, RequesterUserId, RequestStatus, RequestedDate, RejectionOrRemovalDate)
            VALUES (@eventId, @userId, 'Left', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE));
        END
    END
    
    SET @success = 1;
    
    COMMIT TRANSACTION;
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/4/2025>
-- Description:	<This procedure is for removing a player from an event>
-- =============================================
CREATE PROCEDURE SP_AdminRemoveEventPlayer
    @eventId INT,
    @playerUserId INT,
    @adminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isPlayer BIT = 0;
    DECLARE @isAdmin BIT = 0;
	DECLARE @startDatetime DATETIME;
    DECLARE @currentDateTime DATETIME = GETDATE();
    
    -- Check if the event exists and get properties
    SELECT 
		@requiresTeams = RequiresTeams,
        @startDatetime = StartDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
	-- Check if the event has already started or ended
    IF @currentDateTime > @startDatetime
    BEGIN
        SET @errorMessage = 'Cannot remove player from an event that has already started or ended';
        GOTO ReturnResult;
    END

    -- Check if the user making the request is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if target user is a participant and a player (PlayWatch = True)
    SELECT @isPlayer = PlayWatch
    FROM EventParticipants
    WHERE EventId = @eventId AND UserId = @playerUserId;
    
    IF @isPlayer IS NULL
    BEGIN
        SET @errorMessage = 'The specified user is not a participant in this event';
        GOTO ReturnResult;
    END
    
    IF @isPlayer = 0
    BEGIN
        SET @errorMessage = 'This API can only remove players, not spectators';
        GOTO ReturnResult;
    END
    
    BEGIN TRANSACTION;
    
    -- Remove from EventParticipants
    DELETE FROM EventParticipants
    WHERE EventId = @eventId AND UserId = @playerUserId;
    
    -- Update Events table to decrement participant count
    UPDATE [Events]
    SET ParticipantsNum = ParticipantsNum - 1
    WHERE EventId = @eventId;
    
    -- Update status in EventJoinRequests
    DECLARE @requestExists INT = 0;
    
    SELECT @requestExists = COUNT(*)
    FROM EventJoinRequests
    WHERE EventId = @eventId AND RequesterUserId = @playerUserId;
    
    IF @requestExists > 0
    BEGIN
        -- Update existing request
        UPDATE EventJoinRequests
        SET RequestStatus = 'Removed',
            RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
        WHERE EventId = @eventId AND RequesterUserId = @playerUserId;
    END
    ELSE
    BEGIN
        -- Handle edge case where request record doesn't exist
        INSERT INTO EventJoinRequests (EventId, RequesterUserId, RequestStatus, RequestedDate, RejectionOrRemovalDate)
        VALUES (@eventId, @playerUserId, 'Removed', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE));
    END
    
    SET @success = 1;
    
    COMMIT TRANSACTION;
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <15/4/2025>
-- Description:	<This procedure is for approving or rejecting a player request in an event>
-- =============================================
CREATE PROCEDURE SP_AdminProcessJoinRequest
    @eventId INT,
    @requestUserId INT,
    @adminUserId INT,
    @approve BIT -- 1 for approve, 0 for reject
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @maxParticipants INT;
    DECLARE @currentParticipants INT;
    DECLARE @minAge INT;
    DECLARE @eventGender NVARCHAR(6);
    DECLARE @userBirthDate DATE;
    DECLARE @userGender NVARCHAR(1);
    DECLARE @userAge INT;
    DECLARE @requestStatus NVARCHAR(20) = NULL;
	DECLARE @startDatetime DATETIME;
	DECLARE @currentDateTime DATETIME = GETDATE();
    
    -- Check if the event exists and get properties
    SELECT 
        @requiresTeams = RequiresTeams,
        @maxParticipants = MaxParticipants,
        @currentParticipants = ParticipantsNum,
        @minAge = MinAge,
        @eventGender = Gender,
		@startDatetime = StartDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
    -- Check if the user making the request is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if request exists and is in 'Pending' status
    SELECT @requestStatus = RequestStatus
    FROM EventJoinRequests
    WHERE EventId = @eventId AND RequesterUserId = @requestUserId;
    
    IF @requestStatus IS NULL
    BEGIN
        SET @errorMessage = 'No join request found for this user';
        GOTO ReturnResult;
    END
    
    IF @requestStatus <> 'Pending'
    BEGIN
        SET @errorMessage = 'This request is not in a pending state';
        GOTO ReturnResult;
    END
    
	IF @currentDateTime > @startDatetime
	BEGIN
		SET @errorMessage = 'Cannot approve requests for events that have already started';
		GOTO ReturnResult;
	END

    -- If approving, do additional checks
    IF @approve = 1
    BEGIN
        -- Check if event is already full
        IF @maxParticipants IS NOT NULL AND @currentParticipants >= @maxParticipants
        BEGIN
            SET @errorMessage = 'Event is already full';
            GOTO ReturnResult;
        END
        
        -- Get user details
        SELECT 
            @userBirthDate = BirthDate,
            @userGender = Gender
        FROM Users
        WHERE UserId = @requestUserId;
        
        -- Calculate user age
        SET @userAge = DATEDIFF(YEAR, @userBirthDate, GETDATE()) - 
            CASE 
                WHEN DATEADD(YEAR, DATEDIFF(YEAR, @userBirthDate, GETDATE()), @userBirthDate) > GETDATE() 
                THEN 1 
                ELSE 0 
            END;
            
        -- Check age requirement
        IF @userAge < @minAge
        BEGIN
            SET @errorMessage = 'User does not meet the minimum age requirement';
            GOTO ReturnResult;
        END
        
        -- Check gender requirement
        IF (@eventGender = 'Male' AND @userGender <> 'M') OR 
           (@eventGender = 'Female' AND @userGender <> 'F')
        BEGIN
            SET @errorMessage = 'User gender does not match event requirements';
            GOTO ReturnResult;
        END
    END
    
    BEGIN TRANSACTION;
    
    -- Process the request based on approval decision
    IF @approve = 1
    BEGIN
        -- Approve the request
        -- 1. Update request status
        UPDATE EventJoinRequests
        SET RequestStatus = 'Approved'
        WHERE EventId = @eventId AND RequesterUserId = @requestUserId;
        
        -- 2. Add user as a participant
        INSERT INTO EventParticipants (UserId, EventId, PlayWatch)
        VALUES (@requestUserId, @eventId, 1); -- PlayWatch = 1 for player
        
        -- 3. Update participant count
        UPDATE [Events]
        SET ParticipantsNum = ParticipantsNum + 1
        WHERE EventId = @eventId;
    END
    ELSE
    BEGIN
        -- Reject the request
        UPDATE EventJoinRequests
        SET 
            RequestStatus = 'Rejected',
            RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
        WHERE EventId = @eventId AND RequesterUserId = @requestUserId;
    END
    
    SET @success = 1;
    
    COMMIT TRANSACTION;
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <15/4/2025>
-- Description:	<This procedure is for getting pending requests for a participants event>
-- =============================================
CREATE PROCEDURE SP_GetEventPendingJoinRequestsPaginated
    @eventId INT,
    @adminUserId INT,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    -- Check if the event exists and get properties
    SELECT @requiresTeams = RequiresTeams
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
    -- Check if the user making the request is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    SET @success = 1;
    
ReturnResult:
    -- First result set - status
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
    
    -- Second result set - data (only if successful)
    IF @success = 1
    BEGIN
        SELECT 
            u.UserId,
            u.FirstName + ' ' + u.LastName AS FullName,
            u.ProfileImage AS UserPicture,
            ejr.RequestedDate
        FROM EventJoinRequests ejr
        INNER JOIN Users u ON ejr.RequesterUserId = u.UserId
        WHERE ejr.EventId = @eventId AND ejr.RequestStatus = 'Pending'
        ORDER BY ejr.RequestedDate ASC
        OFFSET @skip ROWS
        FETCH NEXT @pageSize + 1 ROWS ONLY;
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <15/4/2025>
-- Description:	<This procedure is for getting user details that got a pending request in a participants event>
-- =============================================
CREATE PROCEDURE SP_GetEventPendingRequestUserDetails
    @eventId INT,
    @userId INT,
    @adminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @requestExists BIT = 0;
    
    -- Check if event exists and get properties
    SELECT @requiresTeams = RequiresTeams
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
    -- Check if user making the request is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if specified user has a pending request for this event
    SELECT @requestExists = COUNT(*)
    FROM EventJoinRequests
    WHERE EventId = @eventId 
      AND RequesterUserId = @userId 
      AND RequestStatus = 'Pending';
    
    IF @requestExists = 0
    BEGIN
        SET @errorMessage = 'User does not have a pending request for this event';
        GOTO ReturnResult;
    END
    
    SET @success = 1;
    
ReturnResult:
    -- First result set - status
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
    
    -- Second result set - user details (only if successful)
    IF @success = 1
    BEGIN
        SELECT 
            u.FirstName + ' ' + u.LastName AS FullName,
            DATEDIFF(YEAR, u.BirthDate, GETDATE()) - 
                CASE 
                    WHEN DATEADD(YEAR, DATEDIFF(YEAR, u.BirthDate, GETDATE()), u.BirthDate) > GETDATE() 
                    THEN 1 
                    ELSE 0 
                END AS Age,
            u.ProfileImage,
            u.Email,
            u.CityId,
            u.Bio,
            u.Gender
        FROM Users u
        WHERE u.UserId = @userId;
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <15/4/2025>
-- Description:	<This procedure is for getting user details that got a is a participant in a participants event>
-- =============================================
CREATE PROCEDURE SP_GetEventPlayerDetails
    @eventId INT,
    @userId INT,
    @adminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @isPlayer BIT = 0;
    
    -- Check if event exists and get properties
    SELECT @requiresTeams = RequiresTeams
    FROM [Events]
    WHERE EventId = @eventId;
    
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Verify this is a non-team event
    IF @requiresTeams = 1
    BEGIN
        SET @errorMessage = 'This API is only for non-team events';
        GOTO ReturnResult;
    END
    
    -- Check if user making the request is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if specified user is a player in this event
    SELECT @isPlayer = COUNT(*)
    FROM EventParticipants
    WHERE EventId = @eventId 
      AND UserId = @userId 
      AND PlayWatch = 1;
    
    IF @isPlayer = 0
    BEGIN
        SET @errorMessage = 'User is not a player in this event';
        GOTO ReturnResult;
    END
    
    SET @success = 1;
    
ReturnResult:
    -- First result set - status
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
    
    -- Second result set - user details (only if successful)
    IF @success = 1
    BEGIN
        SELECT 
            u.FirstName + ' ' + u.LastName AS FullName,
            DATEDIFF(YEAR, u.BirthDate, GETDATE()) - 
                CASE 
                    WHEN DATEADD(YEAR, DATEDIFF(YEAR, u.BirthDate, GETDATE()), u.BirthDate) > GETDATE() 
                    THEN 1 
                    ELSE 0 
                END AS Age,
            u.ProfileImage,
            u.Email,
            u.CityId,
            u.Bio,
            u.Gender
        FROM Users u
        WHERE u.UserId = @userId;
    END
END
GO