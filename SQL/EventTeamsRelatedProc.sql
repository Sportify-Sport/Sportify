-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <16/4/2025>
-- Description:	<Register to public event as spectator - Team Events>
-- =============================================
CREATE PROCEDURE SP_JoinTeamEventAsSpectator
    @eventId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isPublic BIT;
    DECLARE @endDateTime DATETIME;
    
    -- Check if the event exists and get properties
    SELECT 
        @requiresTeams = RequiresTeams,
        @isPublic = IsPublic,
        @endDateTime = EndDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Check if event exists
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Check if it's a team event
    IF @requiresTeams = 0
    BEGIN
        SET @errorMessage = 'This API is only for team events';
        GOTO ReturnResult;
    END
    
    -- Check if event is public
    IF @isPublic = 0
    BEGIN
        SET @errorMessage = 'Cannot join private events as spectator';
        GOTO ReturnResult;
    END
    
    -- Check if event has ended
    IF @endDateTime < GETDATE()
    BEGIN
        SET @errorMessage = 'Cannot join an event that has already ended';
        GOTO ReturnResult;
    END
    
    -- Check if user is an admin
    IF EXISTS (SELECT 1 FROM EventAdmins WHERE EventId = @eventId AND CityOrganizerId = @userId)
    BEGIN
        SET @errorMessage = 'Event admins cannot join as spectators';
        GOTO ReturnResult;
    END
    
    -- Check if user is already a participant
    IF EXISTS (SELECT 1 FROM EventParticipants WHERE EventId = @eventId AND UserId = @userId)
    BEGIN
        SET @errorMessage = 'You are already registered for this event';
        GOTO ReturnResult;
    END
    
    -- Check if user is a member of a participating group
    IF EXISTS (
        SELECT 1 
        FROM EventTeams et
        JOIN GroupMembers gm ON et.GroupId = gm.GroupId
        WHERE et.EventId = @eventId AND gm.UserId = @userId
    )
    BEGIN
        SET @errorMessage = 'Members of participating teams cannot join as spectators';
        GOTO ReturnResult;
    END
    
    -- Add user as spectator
    BEGIN TRY
        INSERT INTO EventParticipants (UserId, EventId, PlayWatch)
        VALUES (@userId, @eventId, 0); -- 0 for Watch (spectator)
        
        SET @success = 1;
    END TRY
    BEGIN CATCH
        SET @errorMessage = 'Error registering as spectator: ' + ERROR_MESSAGE();
    END CATCH
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO
-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <16/4/2025>
-- Description:	<Remove registeration from public event (spectator) - Team Events>
-- =============================================
CREATE PROCEDURE SP_CancelTeamEventSpectating
    @eventId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isSpectator BIT = 0;
    DECLARE @endDateTime DATETIME;
    
    -- Check if the event exists and get properties
    SELECT 
        @requiresTeams = RequiresTeams,
        @endDateTime = EndDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Check if event exists
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Check if it's a team event
    IF @requiresTeams = 0
    BEGIN
        SET @errorMessage = 'This API is only for team events';
        GOTO ReturnResult;
    END
    
    -- Check if event has ended
    IF @endDateTime < GETDATE()
    BEGIN
        SET @errorMessage = 'Cannot cancel spectating for an event that has already ended';
        GOTO ReturnResult;
    END
    
    -- Check if user is a spectator
    SELECT @isSpectator = COUNT(*)
    FROM EventParticipants
    WHERE EventId = @eventId AND UserId = @userId AND PlayWatch = 0;
    
    IF @isSpectator = 0
    BEGIN
        SET @errorMessage = 'You are not registered as a spectator for this event';
        GOTO ReturnResult;
    END
    
    -- Remove user as spectator
    BEGIN TRY
        DELETE FROM EventParticipants
        WHERE EventId = @eventId AND UserId = @userId AND PlayWatch = 0;
        
        SET @success = 1;
    END TRY
    BEGIN CATCH
        SET @errorMessage = 'Error canceling spectator registration: ' + ERROR_MESSAGE();
    END CATCH
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <16/4/2025>
-- Description:	<This procedure gets groups that are participating in a team event>
-- =============================================
CREATE PROCEDURE SP_GetTeamEventGroupsPaginated
    @eventId INT,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    -- Check if the event exists and get properties
    SELECT @requiresTeams = RequiresTeams
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Check if event exists
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Check if it's a team event
    IF @requiresTeams = 0
    BEGIN
        SET @errorMessage = 'This API is only for team events';
        GOTO ReturnResult;
    END
    
    SET @success = 1;
    
ReturnResult:
    -- First result set - status
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
    
    -- Second result set - group data (only if successful)
    IF @success = 1
    BEGIN
        SELECT 
            g.GroupId,
            g.GroupName,
            g.GroupImage
        FROM EventTeams et
        INNER JOIN Groups g ON et.GroupId = g.GroupId
        WHERE et.EventId = @eventId
        ORDER BY g.GroupName
        OFFSET @skip ROWS
        FETCH NEXT @pageSize + 1 ROWS ONLY;
    END
END

GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <16/4/2025>
-- Description:	<This procedure is for removing a group from a team event>
-- =============================================
CREATE PROCEDURE SP_RemoveGroupFromEvent
    @eventId INT,
    @groupId INT,
    @adminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @startDateTime DATETIME;
    
    -- Check if the event exists and get properties
    SELECT 
        @requiresTeams = RequiresTeams,
        @startDateTime = StartDatetime
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Check if event exists
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Check if it's a team event
    IF @requiresTeams = 0
    BEGIN
        SET @errorMessage = 'This API is only for team events';
        GOTO ReturnResult;
    END
    
    -- Check if user is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if event has already started
    IF @startDateTime <= GETDATE()
    BEGIN
        SET @errorMessage = 'Cannot remove groups from events that have already started';
        GOTO ReturnResult;
    END
    
    -- Check if group exists in the event
    IF NOT EXISTS (SELECT 1 FROM EventTeams WHERE EventId = @eventId AND GroupId = @groupId)
    BEGIN
        SET @errorMessage = 'Group is not registered for this event';
        GOTO ReturnResult;
    END
    
    -- Remove the group from the event
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Remove from EventTeams
        DELETE FROM EventTeams
        WHERE EventId = @eventId AND GroupId = @groupId;
        
        -- Update team count in Events table
        UPDATE [Events]
        SET TeamsNum = TeamsNum - 1
        WHERE EventId = @eventId;
        
        SET @success = 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @errorMessage = 'Error removing group: ' + ERROR_MESSAGE();
    END CATCH
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <16/4/2025>
-- Description:	<This procedure is for adding a group for a team event>
-- =============================================
CREATE PROCEDURE SP_AddGroupToEvent
    @eventId INT,
    @groupId INT,
    @adminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    DECLARE @requiresTeams BIT;
    DECLARE @isAdmin BIT = 0;
    DECLARE @startDateTime DATETIME;
    DECLARE @maxTeams INT;
    DECLARE @currentTeams INT;
    DECLARE @eventMinAge INT;
    DECLARE @groupMinAge INT;
    DECLARE @eventGender NVARCHAR(6);
    DECLARE @groupGender NVARCHAR(6);
	DECLARE @eventSportId INT;
    DECLARE @groupSportId INT;
    
    -- Check if the event exists and get properties
    SELECT 
        @requiresTeams = RequiresTeams,
        @startDateTime = StartDatetime,
        @maxTeams = MaxTeams,
        @currentTeams = TeamsNum,
        @eventMinAge = MinAge,
        @eventGender = Gender,
		@eventSportId = SportId
    FROM [Events]
    WHERE EventId = @eventId;
    
    -- Check if event exists
    IF @requiresTeams IS NULL
    BEGIN
        SET @errorMessage = 'Event not found';
        GOTO ReturnResult;
    END
    
    -- Check if it's a team event
    IF @requiresTeams = 0
    BEGIN
        SET @errorMessage = 'This API is only for team events';
        GOTO ReturnResult;
    END
    
    -- Check if group exists and get properties
    SELECT
        @groupMinAge = MinAge,
        @groupGender = Gender,
		@groupSportId = SportId
    FROM Groups
    WHERE GroupId = @groupId;
    
    IF @groupMinAge IS NULL
    BEGIN
        SET @errorMessage = 'Group not found';
        GOTO ReturnResult;
    END
    
    -- Check if user is an admin for this event
    SELECT @isAdmin = COUNT(*)
    FROM EventAdmins
    WHERE EventId = @eventId AND CityOrganizerId = @adminUserId;
    
    IF @isAdmin = 0
    BEGIN
        SET @errorMessage = 'You are not an admin for this event';
        GOTO ReturnResult;
    END
    
    -- Check if event has already started
    IF @startDateTime <= GETDATE()
    BEGIN
        SET @errorMessage = 'Cannot add groups to events that have already started';
        GOTO ReturnResult;
    END
    
    -- Check if group is already in the event
    IF EXISTS (SELECT 1 FROM EventTeams WHERE EventId = @eventId AND GroupId = @groupId)
    BEGIN
        SET @errorMessage = 'Group is already registered for this event';
        GOTO ReturnResult;
    END
    
    -- Check if event is full
    IF @maxTeams IS NOT NULL AND @currentTeams >= @maxTeams
    BEGIN
        SET @errorMessage = 'Event has reached maximum team capacity';
        GOTO ReturnResult;
    END
    
    -- Check minimum age requirement
    IF @groupMinAge < @eventMinAge
    BEGIN
        SET @errorMessage = 'Group minimum age does not meet event requirements';
        GOTO ReturnResult;
    END
    
    -- Check gender requirements
    IF (@eventGender = 'Male' AND @groupGender != 'Male') OR
       (@eventGender = 'Female' AND @groupGender != 'Female')
    BEGIN
        SET @errorMessage = 'Group gender does not match event gender requirements';
        GOTO ReturnResult;
    END
    
	 -- Check sport match (Add this block)
    IF @groupSportId != @eventSportId
    BEGIN
        SET @errorMessage = 'Group sport does not match event sport';
        GOTO ReturnResult;
    END

    -- Add the group to the event
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Add to EventTeams
        INSERT INTO EventTeams (EventId, GroupId)
        VALUES (@eventId, @groupId);
        
        -- Update team count in Events table
        UPDATE [Events]
        SET TeamsNum = TeamsNum + 1
        WHERE EventId = @eventId;
        
        SET @success = 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @errorMessage = 'Error adding group: ' + ERROR_MESSAGE();
    END CATCH
    
ReturnResult:
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
GO