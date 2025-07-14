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

	-- Check if email exists AND is verified
    -- Allow re-registration if account exists but is unverified for more than 24 hours
    IF EXISTS (
        SELECT 1 FROM Users 
        WHERE Email = @email 
        AND (IsEmailVerified = 1 OR DATEDIFF(HOUR, CreatedAt, GETUTCDATE()) < 24)
    )
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
    
	SELECT UserId, FirstName, LastName, Email, PasswordHash, 
           IsGroupAdmin, IsCityOrganizer, IsEventAdmin, IsEmailVerified, IsSuperAdmin
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

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Save email verification code>
-- =============================================
CREATE PROCEDURE SP_SaveEmailVerificationCode
    @UserId INT,
    @Code NVARCHAR(6),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Invalidate any existing codes for this user
    UPDATE EmailVerificationCodes 
    SET IsUsed = 1 
    WHERE UserId = @UserId AND IsUsed = 0;
    
    -- Insert new code
    INSERT INTO EmailVerificationCodes (UserId, Code, ExpiresAt)
    VALUES (@UserId, @Code, @ExpiresAt);
    
    SELECT SCOPE_IDENTITY() AS CodeId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Verify email with code>
-- =============================================
CREATE PROCEDURE SP_VerifyEmailWithCode
    @Code NVARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserId INT;
    DECLARE @IsValid BIT = 0;
    
    -- Check if code exists and is valid
    SELECT @UserId = UserId
    FROM EmailVerificationCodes
    WHERE Code = @Code 
        AND IsUsed = 0 
        AND ExpiresAt > GETUTCDATE();
    
    IF @UserId IS NOT NULL
    BEGIN
        -- Mark email as verified
        UPDATE Users SET IsEmailVerified = 1 WHERE UserId = @UserId;
        
        -- Mark code as used
        UPDATE EmailVerificationCodes SET IsUsed = 1 WHERE Code = @Code;
        
        SET @IsValid = 1;
    END
    
    SELECT @IsValid AS IsValid, @UserId AS UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Save password reset code>
-- =============================================
CREATE PROCEDURE SP_SavePasswordResetCode
    @UserId INT,
    @Code NVARCHAR(6),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Invalidate any existing codes for this user
    UPDATE PasswordResetCodes 
    SET IsUsed = 1 
    WHERE UserId = @UserId AND IsUsed = 0;
    
    -- Insert new code
    INSERT INTO PasswordResetCodes (UserId, Code, ExpiresAt)
    VALUES (@UserId, @Code, @ExpiresAt);
    
    SELECT SCOPE_IDENTITY() AS CodeId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Validate password reset code>
-- =============================================
CREATE PROCEDURE SP_ValidatePasswordResetCode
    @Code NVARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT prc.UserId, u.Email, u.FirstName, u.LastName, u.PasswordHash, u.BirthDate, u.Gender,
        u.FavSportId, u.CityId, u.IsGroupAdmin, u.IsCityOrganizer, u.IsEventAdmin, u.IsEmailVerified
    FROM PasswordResetCodes prc
    INNER JOIN Users u ON prc.UserId = u.UserId
    WHERE prc.Code = @Code 
        AND prc.IsUsed = 0 
        AND prc.ExpiresAt > GETUTCDATE();
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Update user password>
-- =============================================
CREATE PROCEDURE SP_UpdateUserPassword
    @UserId INT,
    @NewPasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET PasswordHash = @NewPasswordHash 
    WHERE UserId = @UserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Mark password reset code as used>
-- =============================================
CREATE PROCEDURE SP_MarkPasswordResetCodeAsUsed
    @Code NVARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE PasswordResetCodes 
    SET IsUsed = 1 
    WHERE Code = @Code;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Revoke all user refresh tokens>
-- =============================================
CREATE PROCEDURE SP_RevokeAllUserRefreshTokens
    @UserId INT,
    @Reason NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE RefreshTokens 
    SET Revoked = GETDATE(), 
        ReasonRevoked = @Reason
    WHERE UserId = @UserId 
        AND Revoked IS NULL;
    
    SELECT @@ROWCOUNT AS RevokedCount;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Handles unverified account Reregistration>
-- =============================================
CREATE PROCEDURE SP_HandleUnverifiedAccountReregistration
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ExistingUserId INT;
    
    -- Check if unverified account exists that's older than 24 hours
    SELECT @ExistingUserId = UserId
    FROM Users
    WHERE Email = @Email 
        AND IsEmailVerified = 0 
        AND DATEDIFF(HOUR, CreatedAt, GETUTCDATE()) >= 24;
    
    IF @ExistingUserId IS NOT NULL
    BEGIN
        -- Delete old unverified account and related data
        DELETE FROM Users WHERE UserId = @ExistingUserId;
        
        SELECT 1 AS Success, 'Old unverified account removed' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, 'No action needed' AS Message;
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/6/2025>
-- Description:	<Handles unverified accounts by removing them from the database>
-- =============================================
CREATE PROCEDURE SP_CleanupUnverifiedAccounts
    @DaysOld INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CutoffDate DATETIME = DATEADD(DAY, -@DaysOld, GETUTCDATE());
    
    -- Delete unverified users
    DELETE FROM Users
    WHERE IsEmailVerified = 0 AND CreatedAt < @CutoffDate;
    
    SELECT @@ROWCOUNT AS DeletedUsers;
END
GO
