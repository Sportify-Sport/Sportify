-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <28/3/2025>
-- Description:	<This procedure retrieves group details by groupId>
-- =============================================
CREATE PROCEDURE SP_GetGroupDetails
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM Groups
    WHERE GroupId = @groupId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This procedure checks if the user is an admin for the specified group>
-- =============================================
CREATE PROCEDURE SP_IsUserGroupAdmin
    @userId INT,
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        CASE WHEN EXISTS (
            SELECT 1
            FROM GroupAdmins
            WHERE UserId = @userId AND GroupId = @groupId
        ) THEN 1 ELSE 0 END AS IsAdmin;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <6/4/2025>
-- Description:	<This procedure returns a paginated list of groups (for inifnity scroll)>
-- =============================================
CREATE PROCEDURE SP_GetGroupsPaginated
    @lastGroupId INT = NULL,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        GroupId, 
        GroupName, 
        GroupImage, 
        CityId, 
        SportId,
		Gender
    FROM Groups
    WHERE 
        -- First page or continuation condition
        @lastGroupId IS NULL OR GroupId > @lastGroupId
    ORDER BY GroupId ASC
    OFFSET 0 ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <6/4/2025>
-- Description:	<This procedure returns a groups details with user status (Member or Admin)>
-- =============================================
CREATE PROCEDURE SP_GetGroupDetailsWithMembershipStatus
    @groupId INT,
    @userId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First, calculate IsMember
    DECLARE @isMember BIT = 0;
    
    IF @userId IS NOT NULL
    BEGIN
        SELECT @isMember = CASE WHEN EXISTS (
            SELECT 1 FROM GroupMembers 
            WHERE GroupId = @groupId AND UserId = @userId
        ) THEN 1 ELSE 0 END;
    END
    
    SELECT 
        g.*,
        @isMember AS IsMember,
        CASE WHEN @userId IS NOT NULL AND EXISTS (
            SELECT 1 FROM GroupAdmins 
            WHERE GroupId = @groupId AND UserId = @userId
        ) THEN 1 ELSE 0 END AS IsAdmin,
        CASE WHEN @userId IS NOT NULL 
             AND @isMember = 0  -- Using the variable instead of repeating the EXISTS check
             AND EXISTS (
                SELECT 1 FROM GroupJoinRequests
                WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
             ) 
             THEN 1 ELSE 0 
        END AS HasPendingRequest
    FROM Groups g
    WHERE g.GroupId = @groupId;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Gets Upcoming Group Events for the specified page with pagination / infinity scroll>
-- =============================================
CREATE PROCEDURE SP_GetUpcomingGroupEvents
    @groupId INT,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    SELECT 
        e.EventId,
        e.EventName,
        e.StartDatetime
    FROM [Events] e
    INNER JOIN EventTeams et ON e.EventId = et.EventId
    WHERE 
        et.GroupId = @groupId
        AND e.EndDatetime >= GETDATE()  
    ORDER BY 
        e.StartDatetime ASC
    OFFSET @skip ROWS
    FETCH NEXT @pageSize + 1 ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <22/5/2025>
-- Description:	<Get the CityId for a specific group>
-- =============================================
CREATE PROCEDURE SP_GetGroupCityId
    @GroupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CityId 
    FROM Groups 
    WHERE GroupId = @GroupId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <29/5/2025>
-- Description:	<Is used to update group details>
-- =============================================
CREATE PROCEDURE SP_UpdateGroup
    @GroupId INT,
    @GroupName NVARCHAR(100),
    @Description NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if group exists
        IF NOT EXISTS (SELECT 1 FROM Groups WHERE GroupId = @GroupId)
        BEGIN
            SELECT 0 AS Success, 'Group not found' AS Message;
            RETURN;
        END
        
        -- Check if group name already exists (excluding current group)
        --IF EXISTS (SELECT 1 FROM Groups WHERE GroupName = @GroupName AND GroupId != @GroupId)
        --BEGIN
            --SELECT 0 AS Success, 'A group with this name already exists' AS Message;
            --RETURN;
        --END
        
        -- Update the group
        UPDATE Groups 
        SET 
            GroupName = @GroupName,
            Description = @Description
        WHERE GroupId = @GroupId;
        
        SELECT 1 AS Success, 'Group updated successfully' AS Message;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END
GO