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
    
    SELECT UserId, FirstName, LastName, Email, PasswordHash, IsGroupAdmin, IsCityOrganizer, IsEventAdmin
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

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <13/5/2025>
-- Description:	<This procedure saves a new refresh token>
-- =============================================
CREATE PROCEDURE SP_SaveRefreshToken
    @UserId INT,
    @Token VARCHAR(255),
    @ExpiryDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO RefreshTokens (UserId, Token, ExpiryDate, Created)
    VALUES (@UserId, @Token, @ExpiryDate, GETDATE());
    
    SELECT 
        Id, UserId, Token, ExpiryDate, Created
    FROM RefreshTokens 
    WHERE Id = SCOPE_IDENTITY();
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <13/5/2025>
-- Description:	<This procedure gets a refresh token and its details>
-- =============================================
CREATE PROCEDURE SP_GetRefreshToken
    @Token VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id, UserId, Token, ExpiryDate, Created, Revoked, ReplacedByToken, ReasonRevoked
    FROM RefreshTokens 
    WHERE Token = @Token;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <13/5/2025>
-- Description:	<This procedure revokes a token>
-- =============================================
CREATE PROCEDURE SP_RevokeRefreshToken
    @Token VARCHAR(255),
    @Reason NVARCHAR(100),
    @ReplacedByToken VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    
    -- Check if token exists and is not already revoked
    IF EXISTS (SELECT 1 FROM RefreshTokens WHERE Token = @Token AND Revoked IS NULL)
    BEGIN
        UPDATE RefreshTokens
        SET 
            Revoked = GETDATE(),
            ReasonRevoked = @Reason,
            ReplacedByToken = @ReplacedByToken
        WHERE Token = @Token;
        
        SET @success = 1;
    END
    
    SELECT @success AS Success;
END
GO
