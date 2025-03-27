-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <24/3/2025>
-- Description:	<This Procedure checks if a specific email exists in the Users table>
-- =============================================
CREATE PROCEDURE SP_IsEmailRegistered 
	@email NVARCHAR(100)
AS
BEGIN
	SET NOCOUNT ON;

	IF EXISTS (SELECT 1 FROM Users WHERE Email = @email)
        SELECT 1 AS IsRegistered
    ELSE
        SELECT 0 AS IsRegistered
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <24/3/2025>
-- Description:	<This Procedure Inserts a new User to the Users table>
-- =============================================
CREATE PROCEDURE SP_InsertUser
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @BirthDate DATE,
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @FavSportId INT,
    @CityId INT,
    @Gender NVARCHAR(1),
	@ProfileImage NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    
    INSERT INTO Users (
        FirstName, 
        LastName, 
        BirthDate, 
        Email, 
        PasswordHash, 
        FavSportId, 
        CityId, 
        Gender,
		ProfileImage
    )
    VALUES (
        @FirstName,
        @LastName,
        @BirthDate,
        @Email,
        @PasswordHash,
        @FavSportId,
        @CityId,
        @Gender,
		@ProfileImage
    );
    
    SET @UserId = SCOPE_IDENTITY();
    
    SELECT @UserId AS UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <25/3/2025>
-- Description:	<This procedure retrieves user information by email for authentication>
-- =============================================
CREATE PROCEDURE SP_GetUserByEmail
    @Email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserId, FirstName, LastName, Email, PasswordHash
    FROM Users
    WHERE Email = @Email
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <25/3/2025>
-- Description:	<This procedure retrieves all groups for which a user has admin privileges>
-- =============================================
CREATE PROCEDURE SP_GetAdminGroups
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT GroupId
    FROM GroupAdmins
    WHERE UserId = @UserId
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <25/3/2025>
-- Description:	<This procedure retrieves all cities for which a user is designated as an organizer>
-- =============================================
CREATE PROCEDURE SP_GetOrganizerCities
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CityId
    FROM CityOrganizers
    WHERE UserId = @UserId
END
GO