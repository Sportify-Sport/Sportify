-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <21/5/2025>
-- Description:	<Get events by city for admin with search, sorting, and pagination>
-- =============================================
CREATE PROCEDURE SP_GetEventsByCityForAdmin
    @CityId INT,
    @Name NVARCHAR(100) = NULL,
    @SortBy INT = 1,  -- 1=EventName, 2=SportId, 3=RequiresTeamsTrue, 4=RequiresTeamsFalse
    @Page INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate offset for pagination
    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    
    -- Select events with filtering, sorting and pagination
    SELECT 
        e.EventId, e.EventName, e.RequiresTeams, e.StartDatetime, e.EndDatetime,
        e.SportId, e.ProfileImage, e.CityId, e.Gender, e.IsPublic,
        el.LocationName
    FROM 
        [Events] e
    LEFT JOIN
        EventLocations el ON e.LocationId = el.LocationId
    WHERE 
        e.CityId = @CityId
        AND (@Name IS NULL OR e.EventName LIKE '%' + @Name + '%')
        AND CASE 
            WHEN @SortBy = 3 THEN e.RequiresTeams -- Filter for RequiresTeams = True
            WHEN @SortBy = 4 THEN 1 - CAST(e.RequiresTeams AS INT) -- Filter for RequiresTeams = False
            ELSE 1 -- No filter
        END = 1
    ORDER BY
        CASE WHEN @SortBy = 1 THEN e.EventName END,
        CASE WHEN @SortBy = 2 THEN e.SportId END,
        CASE WHEN @SortBy = 3 OR @SortBy = 4 THEN e.EventName END
    OFFSET @Offset ROWS
    FETCH NEXT (@PageSize + 1) ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <21/5/2025>
-- Description:	<Get event details for admin>
-- =============================================
CREATE PROCEDURE SP_GetEventDetailsForAdmin
    @CityId INT,
    @EventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.EventId, e.EventName, e.RequiresTeams, e.Description, 
        e.StartDatetime, e.EndDatetime, e.CityId, 
        el.LocationName, e.SportId, e.CreatedAt, e.MinAge, 
        e.Gender, e.ProfileImage, e.MaxTeams, e.TeamsNum,
        e.MaxParticipants, e.ParticipantsNum
    FROM 
        [Events] e
    LEFT JOIN
        EventLocations el ON e.LocationId = el.LocationId
    WHERE 
        e.EventId = @EventId 
        AND e.CityId = @CityId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <21/5/2025>
-- Description:	<Get event admin>
-- =============================================
CREATE PROCEDURE SP_GetEventAdmin
    @EventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 
        u.UserId, u.FirstName, u.LastName, u.ProfileImage
    FROM 
        Users u
    INNER JOIN 
        EventAdmins ea ON u.UserId = ea.CityOrganizerId
    WHERE 
        ea.EventId = @EventId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <22/5/2025>
-- Description:	<Create a new event and assign admin>
-- =============================================
CREATE PROCEDURE SP_CreateEvent
    @EventName NVARCHAR(100),
    @RequiresTeams BIT,
    @Description NVARCHAR(500),
    @StartDatetime DATETIME,
    @EndDatetime DATETIME,
    @CityId INT,
    @LocationName NVARCHAR(100),
    @SportId INT,
    @IsPublic BIT,
    @Gender NVARCHAR(6),
    @MinAge INT,
    @MaxTeams INT = NULL,
    @MaxParticipants INT = NULL,
    @ProfileImage NVARCHAR(255),
    @AdminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Create location if it doesn't exist or get its ID if it does
        DECLARE @LocationId INT = NULL;
        
        IF @LocationName IS NOT NULL AND LEN(@LocationName) > 0
        BEGIN
            -- Check if location exists
            SELECT @LocationId = LocationId 
            FROM EventLocations 
            WHERE LocationName = @LocationName;
            
            -- Create new location if it doesn't exist
            IF @LocationId IS NULL
            BEGIN
                INSERT INTO EventLocations (LocationName)
                VALUES (@LocationName);
                
                SET @LocationId = SCOPE_IDENTITY();
            END
        END
        
		-- Adjust IsPublic based on RequiresTeams (always true for non-team events)
        IF @RequiresTeams = 0
        BEGIN
            SET @IsPublic = 1;
        END

        -- Insert the event
        INSERT INTO [Events] (
            EventName, RequiresTeams, Description, StartDatetime, EndDatetime,
            CityId, LocationId, SportId, MaxTeams, IsPublic, MaxParticipants,
            MinAge, Gender, ProfileImage
        ) VALUES (
            @EventName, @RequiresTeams, @Description, @StartDatetime, @EndDatetime,
            @CityId, @LocationId, @SportId, @MaxTeams, @IsPublic, @MaxParticipants,
            @MinAge, @Gender, @ProfileImage
        );
        
        -- Get the new event ID
        DECLARE @EventId INT = SCOPE_IDENTITY();
        
        -- Add admin to EventAdmins table
        INSERT INTO EventAdmins (EventId, CityOrganizerId)
        VALUES (@EventId, @AdminUserId);
        
        -- Update IsEventAdmin flag if not already set
        UPDATE Users
        SET IsEventAdmin = 1
        WHERE UserId = @AdminUserId AND IsEventAdmin = 0;
        
        COMMIT TRANSACTION;
        
        -- Return the new event ID
        SELECT @EventId AS EventId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <22/5/2025>
-- Description:	<Change event admin>
-- =============================================
CREATE PROCEDURE SP_ChangeEventAdmin
    @EventId INT,
    @NewAdminUserId INT,
    @CurrentAdminId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Remove current admin from EventAdmins
        DELETE FROM EventAdmins 
        WHERE EventId = @EventId AND CityOrganizerId = @CurrentAdminId;
        
        -- Add new admin to EventAdmins
        INSERT INTO EventAdmins (EventId, CityOrganizerId)
        VALUES (@EventId, @NewAdminUserId);
        
        -- Check if old admin is still admin for other events
        IF NOT EXISTS (
            SELECT 1 FROM EventAdmins WHERE CityOrganizerId = @CurrentAdminId
        )
        BEGIN
            -- Update IsEventAdmin flag to false for old admin
            UPDATE Users
            SET IsEventAdmin = 0
            WHERE UserId = @CurrentAdminId;
        END
        
        -- Update IsEventAdmin flag for new admin if not already set
        UPDATE Users
        SET IsEventAdmin = 1
        WHERE UserId = @NewAdminUserId AND IsEventAdmin = 0;
        
        COMMIT TRANSACTION;
        
        -- Return success
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success;
        THROW;
    END CATCH
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <22/5/2025>
-- Description:	<Change event admin Delete event>
-- =============================================
CREATE PROCEDURE SP_DeleteEvent
    @EventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get the admin of the event before deletion
        DECLARE @AdminUserId INT;
        SELECT @AdminUserId = CityOrganizerId 
        FROM EventAdmins 
        WHERE EventId = @EventId;

		-- Get the location ID before deletion
        DECLARE @LocationId INT;
        SELECT @LocationId = LocationId
        FROM [Events]
        WHERE EventId = @EventId;
        
        -- Delete the event (will cascade to EventAdmins)
        DELETE FROM [Events] WHERE EventId = @EventId;
        
		-- Delete the location only if no other events are using it
        IF @LocationId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM [Events] WHERE LocationId = @LocationId
        )
        BEGIN
            DELETE FROM EventLocations WHERE LocationId = @LocationId;
        END

        -- Check if admin is still admin for other events
        IF @AdminUserId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM EventAdmins WHERE CityOrganizerId = @AdminUserId
        )
        BEGIN
            -- Update IsEventAdmin flag to false
            UPDATE Users
            SET IsEventAdmin = 0
            WHERE UserId = @AdminUserId;
        END
        
        COMMIT TRANSACTION;
        
        -- Return success
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success;
        THROW;
    END CATCH
END
GO
