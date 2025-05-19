-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <18/5/2025>
-- Description:	<This procedure is used to save admin refresh tokens>
-- =============================================
CREATE PROCEDURE SP_SaveAdminRefreshToken
    @UserId INT,
    @Token VARCHAR(255),
    @ExpiryDate DATETIME,
    @UseCount INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO AdminRefreshTokens (UserId, Token, ExpiryDate, Created, UseCount)
    VALUES (@UserId, @Token, @ExpiryDate, GETDATE(), @UseCount);
    
    SELECT 
        Id, UserId, Token, ExpiryDate, Created, UseCount
    FROM AdminRefreshTokens 
    WHERE Id = SCOPE_IDENTITY();
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <18/5/2025>
-- Description:	<This procedure is used to get the saved admin refresh token for the specified CityOrganizer (The details)>
-- =============================================
CREATE PROCEDURE SP_GetAdminRefreshToken
    @Token VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Id, UserId, Token, ExpiryDate, Created, Revoked, ReplacedByToken, 
        ReasonRevoked, UseCount
    FROM AdminRefreshTokens 
    WHERE Token = @Token;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <18/5/2025>
-- Description:	<This procedure is used to Increment the refresh token count for the admin refresh tokens>
-- =============================================
CREATE PROCEDURE SP_IncrementAdminRefreshTokenUseCount
    @TokenId INT,
    @Success BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    
    IF EXISTS (SELECT 1 FROM AdminRefreshTokens WHERE Id = @TokenId AND Revoked IS NULL)
    BEGIN
        UPDATE AdminRefreshTokens
        SET UseCount = UseCount + 1
        WHERE Id = @TokenId;
        
        SET @Success = 1;
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <18/5/2025>
-- Description:	<This procedure is used to revoke admin refresh token>
-- =============================================
CREATE PROCEDURE SP_RevokeAdminRefreshToken
    @Token VARCHAR(255),
    @Reason NVARCHAR(100),
    @ReplacedByToken VARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    
    -- Check if token exists and is not already revoked
    IF EXISTS (SELECT 1 FROM AdminRefreshTokens WHERE Token = @Token AND Revoked IS NULL)
    BEGIN
        UPDATE AdminRefreshTokens
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
-- Create date: <18/5/2025>
-- Description:	<This procedure is used to revoke all admin refresh tokens for the specified user>
-- =============================================
CREATE PROCEDURE SP_RevokeAllUserAdminRefreshTokens
    @UserId INT,
    @Reason NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE AdminRefreshTokens
    SET 
        Revoked = GETDATE(),
        ReasonRevoked = @Reason
    WHERE UserId = @UserId AND Revoked IS NULL;
    
    SELECT @@ROWCOUNT AS AffectedTokens;
END
GO