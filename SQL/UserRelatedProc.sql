-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure returns 4 groups that the user joined to>
-- =============================================
CREATE PROCEDURE SP_GetTop4UserGroups
	@userId INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT TOP 4 g.GroupId, g.GroupName, g.GroupImage, g.CityId, g.SportId
    FROM Groups g INNER JOIN GroupMembers gm ON g.GroupId = gm.GroupId
	WHERE gm.UserId = @userId
	ORDER BY gm.JoinedAt DESC
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <27/3/2025>
-- Description:	<This Procedure returns user profile>
-- =============================================
CREATE PROCEDURE SP_GetUserProfile
    @userId INT
AS
BEGIN
	SET NOCOUNT ON;
    SELECT UserId, FirstName, LastName, BirthDate, Email, FavSportId, CityId, ProfileImage,Bio, Gender
    FROM Users
    WHERE UserId = @userId
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <27/3/2025>
-- Description:	<This Procedure update user profile>
-- =============================================
CREATE PROCEDURE SP_UpdateUserProfile
    @userId INT,
    @birthDate DATE,
    @favSportId INT,
    @cityId INT,
    @bio NVARCHAR(500) = NULL,
    @gender NVARCHAR(1),
    @profileImage NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT OFF;
    
    UPDATE Users
    SET BirthDate = @birthDate, FavSportId = @favSportId, CityId = @cityId, Bio = @bio, Gender = @gender,
        -- Only update ProfileImage if value is provided
        ProfileImage = CASE WHEN @profileImage IS NOT NULL THEN @profileImage ELSE ProfileImage END
    WHERE UserId = @userId;
    
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure update user details>
-- =============================================
CREATE PROCEDURE SP_UpdateUserDetails
    @userId INT,
    @birthDate DATE,
    @favSportId INT,
    @cityId INT,
    @bio NVARCHAR(500) = '',
    @gender NVARCHAR(1)
AS
BEGIN
    SET NOCOUNT OFF; -- We want the count of affected rows
    
    UPDATE Users
    SET BirthDate = @birthDate, 
        FavSportId = @favSportId, 
        CityId = @cityId, 
        Bio = @bio, 
        Gender = @gender
    WHERE UserId = @userId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure update user profile Image>
-- =============================================

CREATE PROCEDURE SP_UpdateProfileImage
    @userId INT,
    @profileImage NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT OFF;
    
    UPDATE Users
    SET ProfileImage = CASE 
                         WHEN @profileImage IS NULL THEN ProfileImage  -- Keep existing value
                         ELSE @profileImage  -- Use new value
                       END
    WHERE UserId = @userId;
END



-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure returns all the groups the user registered to>
-- =============================================
CREATE PROCEDURE SP_GetAllUserGroups
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        g.GroupId,
        g.GroupName,
        g.GroupImage,
        g.CityId,
        g.SportId
    FROM 
        Groups g
    INNER JOIN 
        GroupMembers gm ON g.GroupId = gm.GroupId
    WHERE 
        gm.UserId = @userId
    ORDER BY 
        g.FoundedAt DESC;
END


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure returns 4 (limit) events that the user joined to>
-- =============================================
CREATE PROCEDURE SP_GetUserEvents
    @userId INT,
    @limit INT = 4
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT TOP (@limit) 
        e.EventId, 
        e.EventName, 
        e.StartDatetime, 
        e.SportId, 
        e.ProfileImage,
        CASE
            WHEN ep.UserId IS NOT NULL THEN ep.PlayWatch  -- Direct participation
            WHEN EXISTS (  -- Check for group participation
                SELECT 1
                FROM EventTeams et
                JOIN GroupMembers gm ON et.GroupId = gm.GroupId
                WHERE et.EventId = e.EventId AND gm.UserId = @userId
            ) THEN 1  -- Set to TRUE(1) for group participation
            ELSE NULL  -- Should never reach here due to WHERE clause
        END AS PlayWatch
    FROM [Events] e
    LEFT JOIN EventParticipants ep ON e.EventId = ep.EventId AND ep.UserId = @userId
    WHERE e.EventId IN (
        -- Direct participation
        SELECT ep2.EventId
        FROM EventParticipants ep2
        WHERE ep2.UserId = @userId
        
        UNION
        
        -- Indirect participation through groups
        SELECT et.EventId
        FROM EventTeams et
        JOIN GroupMembers gm ON et.GroupId = gm.GroupId
        WHERE gm.UserId = @userId
    )
    ORDER BY e.StartDatetime ASC;
END


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <6/4/2025>
-- Description:	<This procedure returns paginated events that the user participated in, either directly or through a group>
-- =============================================
CREATE PROCEDURE SP_GetUserEventsPaginated
    @userId INT,
    @lastEventDate DATETIME = NULL,
    @lastEventId INT = NULL,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        e.EventId, 
        e.EventName, 
        e.StartDatetime, 
        e.SportId, 
        e.ProfileImage,
        CASE
            WHEN ep.UserId IS NOT NULL THEN ep.PlayWatch  -- Direct participation
            WHEN EXISTS (  -- Check for group participation
                SELECT 1
                FROM EventTeams et
                JOIN GroupMembers gm ON et.GroupId = gm.GroupId
                WHERE et.EventId = e.EventId AND gm.UserId = @userId
            ) THEN 1  -- Set to TRUE(1) for group participation
            ELSE NULL
        END AS PlayWatch
    FROM [Events] e
    LEFT JOIN EventParticipants ep ON e.EventId = ep.EventId AND ep.UserId = @userId
    WHERE e.EventId IN (
        -- Direct participation
        SELECT ep2.EventId
        FROM EventParticipants ep2
        WHERE ep2.UserId = @userId
        
        UNION
        
        -- Indirect participation through groups
        SELECT et.EventId
        FROM EventTeams et
        JOIN GroupMembers gm ON et.GroupId = gm.GroupId
        WHERE gm.UserId = @userId

		UNION
        
        -- Admin of event
        SELECT ea.EventId
        FROM EventAdmins ea
        WHERE ea.CityOrganizerId = @userId
    )
    AND (
        -- First page or continuation condition
        @lastEventDate IS NULL 
        OR e.StartDatetime > @lastEventDate
        OR (e.StartDatetime = @lastEventDate AND e.EventId > @lastEventId)
    )
    ORDER BY e.StartDatetime ASC, e.EventId ASC
    OFFSET 0 ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <13/5/2025>
-- Description:	<This procedure returns the specified user details>
-- =============================================
CREATE PROCEDURE SP_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserId, FirstName, LastName, Email, IsGroupAdmin, IsCityOrganizer
    FROM Users
    WHERE UserId = @UserId
END
GO