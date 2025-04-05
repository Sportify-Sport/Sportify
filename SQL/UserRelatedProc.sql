-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <26/3/2025>
-- Description:	<This Procedure returns 3 groups that the user joined to>
-- =============================================
CREATE PROCEDURE SP_GetTop3UserGroups
	@userId INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT TOP 3 g.GroupId, g.GroupName, g.GroupImage, g.CityId, g.SportId
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