-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<Get groups by city for admin with search, sorting, and pagination>
-- =============================================
CREATE PROCEDURE SP_GetGroupsByCityForAdmin
    @CityId INT,
    @Name NVARCHAR(100) = NULL,
    @SortBy INT = 1,  -- 1=GroupName, 2=SportId, 3=FoundedAt, 4=TotalMembers
    @Page INT = 1,
    @PageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate offset for pagination
    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    
    -- Convert text options to numeric if needed
    IF @SortBy IS NULL OR ISNUMERIC(@SortBy) = 0
    BEGIN
        SET @SortBy = 
            CASE LOWER(CONVERT(VARCHAR(20), @SortBy))
                WHEN 'name' THEN 1
                WHEN 'sport' THEN 2
                WHEN 'foundedat' THEN 3
                WHEN 'members' THEN 4
                ELSE 1 -- Default to name
            END;
    END
    
    -- Select groups with sorting based on the numeric option
    SELECT 
        GroupId, GroupName, SportId, GroupImage, CityId, FoundedAt, Gender, TotalMembers
    FROM 
        Groups
    WHERE 
        CityId = @CityId
        AND (@Name IS NULL OR GroupName LIKE '%' + @Name + '%')
    ORDER BY
        CASE WHEN @SortBy = 1 THEN GroupName END,
        CASE WHEN @SortBy = 2 THEN SportId END,
        CASE WHEN @SortBy = 3 THEN FoundedAt END DESC,
        CASE WHEN @SortBy = 4 THEN TotalMembers END DESC,
        GroupName  -- Secondary sort for consistent results
    OFFSET @Offset ROWS
    FETCH NEXT (@PageSize + 1) ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<Get group details for admin>
-- =============================================
CREATE PROCEDURE SP_GetGroupDetailsForAdmin
    @CityId INT,
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        GroupId, GroupName, Description, SportId, GroupImage, CityId,
        FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender
    FROM Groups
    WHERE GroupId = @GroupId AND CityId = @CityId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<Get group admin>
-- =============================================
CREATE PROCEDURE SP_GetGroupAdmin
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 u.UserId, u.FirstName, u.LastName, u.ProfileImage
    FROM Users u
    INNER JOIN GroupAdmins ga ON u.UserId = ga.UserId
    WHERE ga.GroupId = @GroupId
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <20/5/2025>
-- Description:	<Create a new group and assign admin>
-- =============================================
CREATE PROCEDURE SP_CreateGroup
    @GroupName NVARCHAR(100),
    @Description NVARCHAR(500),
    @SportId INT,
    @GroupImage NVARCHAR(255),
    @CityId INT,
    @MaxMemNum INT,
    @TotalMembers INT,
    @MinAge INT,
    @Gender NVARCHAR(6),
    @AdminUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert the group
        INSERT INTO Groups (
            GroupName, Description, SportId, GroupImage, 
            CityId, MaxMemNum, TotalMembers, MinAge, Gender
        ) VALUES (
            @GroupName, @Description, @SportId, @GroupImage,
            @CityId, @MaxMemNum, @TotalMembers, @MinAge, @Gender
        );
        
        -- Get the new group ID
        DECLARE @GroupId INT = SCOPE_IDENTITY();
        
        -- Add admin to GroupAdmins table
        INSERT INTO GroupAdmins (GroupId, UserId)
        VALUES (@GroupId, @AdminUserId);
        
        -- Add admin to GroupMembers table
        INSERT INTO GroupMembers (GroupId, UserId)
        VALUES (@GroupId, @AdminUserId);
        
        -- Update IsGroupAdmin flag if not already set
        UPDATE Users
        SET IsGroupAdmin = 1
        WHERE UserId = @AdminUserId AND IsGroupAdmin = 0;
        
        COMMIT TRANSACTION;
        
        -- Return the new group ID
        SELECT @GroupId AS GroupId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <20/5/2025>
-- Description:	<Change group admin>
-- =============================================
CREATE PROCEDURE SP_ChangeGroupAdmin
    @GroupId INT,
    @NewAdminUserId INT,
    @CurrentAdminId INT,
    @CityId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Check if new admin's gender matches group gender
        DECLARE @UserGender CHAR(1);
        DECLARE @GroupGender NVARCHAR(6);
        
        SELECT @UserGender = Gender FROM Users WHERE UserId = @NewAdminUserId;
        SELECT @GroupGender = Gender FROM Groups WHERE GroupId = @GroupId;
        
        -- Check if genders match
        IF @GroupGender <> 'Mixed' AND 
           (@GroupGender = 'Male' AND @UserGender <> 'M' OR
            @GroupGender = 'Female' AND @UserGender <> 'F')
        BEGIN
            RAISERROR('Gender mismatch between user and group', 16, 1);
            RETURN;
        END
        
        -- Remove current admin from GroupAdmins
        DELETE FROM GroupAdmins WHERE GroupId = @GroupId;
        
        -- Check if current admin is a city organizer
        DECLARE @IsCurrentAdminCityOrganizer BIT = 0;
        
        IF EXISTS (
            SELECT 1 
            FROM CityOrganizers 
            WHERE UserId = @CurrentAdminId AND CityId = @CityId
        )
        BEGIN
            SET @IsCurrentAdminCityOrganizer = 1;
        END
        
        -- Remove current admin from GroupMembers only if a city organizer
        IF @IsCurrentAdminCityOrganizer = 1
        BEGIN
            DELETE FROM GroupMembers WHERE GroupId = @GroupId AND UserId = @CurrentAdminId;
            
            -- Update TotalMembers count
            UPDATE Groups
            SET TotalMembers = TotalMembers - 1
            WHERE GroupId = @GroupId;
        END
        
        -- Add new admin to GroupAdmins
        INSERT INTO GroupAdmins (GroupId, UserId)
        VALUES (@GroupId, @NewAdminUserId);
        
        -- Check if new admin is already a member
        IF NOT EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @GroupId AND UserId = @NewAdminUserId)
        BEGIN
            -- Add new admin to GroupMembers
            INSERT INTO GroupMembers (GroupId, UserId)
            VALUES (@GroupId, @NewAdminUserId);
            
            -- Update TotalMembers count
            UPDATE Groups
            SET TotalMembers = TotalMembers + 1
            WHERE GroupId = @GroupId;
        END
        
        -- Check if old admin is still admin for other groups
        IF NOT EXISTS (
            SELECT 1 FROM GroupAdmins WHERE UserId = @CurrentAdminId
        )
        BEGIN
            -- Update IsGroupAdmin flag to false for old admin
            UPDATE Users
            SET IsGroupAdmin = 0
            WHERE UserId = @CurrentAdminId;
        END
        
        -- Update IsGroupAdmin flag for new admin if not already set
        UPDATE Users
        SET IsGroupAdmin = 1
        WHERE UserId = @NewAdminUserId AND IsGroupAdmin = 0;
        
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
-- Create date: <20/5/2025>
-- Description:	<Delete group>
-- =============================================
CREATE PROCEDURE SP_DeleteGroup
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Get the admin of the group before deletion
        DECLARE @AdminUserId INT;
        SELECT TOP 1 @AdminUserId = UserId FROM GroupAdmins WHERE GroupId = @GroupId;
        
        -- Delete the group (will cascade to GroupMembers and GroupAdmins)
        DELETE FROM Groups WHERE GroupId = @GroupId;
        
        -- Check if admin is still admin for other groups
        IF @AdminUserId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM GroupAdmins WHERE UserId = @AdminUserId
        )
        BEGIN
            -- Update IsGroupAdmin flag to false
            UPDATE Users
            SET IsGroupAdmin = 0
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