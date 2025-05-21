-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<Search users by email or ID>
-- =============================================
CREATE PROCEDURE SP_SearchUsersForAdmin
    @EmailOrId NVARCHAR(100),
    @MaxResults INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Try to parse as integer for ID matching
    DECLARE @UserId INT;
    IF ISNUMERIC(@EmailOrId) = 1
    BEGIN
        SET @UserId = TRY_CAST(@EmailOrId AS INT);
    END
    
    SELECT TOP (@MaxResults)
        UserId, FirstName, LastName, Email, Gender, ProfileImage, CityId
    FROM Users
    WHERE 
        -- Exact match on ID
        (@UserId IS NOT NULL AND UserId = @UserId)
        OR
        -- Partial ID match
        (@UserId IS NOT NULL AND CAST(UserId AS NVARCHAR) LIKE @EmailOrId + '%')
        OR
        -- Email match (exact or partial)
        (Email LIKE '%' + @EmailOrId + '%')
    ORDER BY 
        -- Revised priority order
        CASE 
            -- Exact matches (highest priority)
            WHEN UserId = @UserId THEN 0
            WHEN Email = @EmailOrId THEN 0
            
            -- Partial matches (second priority)
            WHEN CAST(UserId AS NVARCHAR) LIKE @EmailOrId + '%' THEN 1
            WHEN Email LIKE @EmailOrId + '%' THEN 1
            
            -- Other partial email matches (lowest priority)
            ELSE 2
        END,
        UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<Get user gender by ID>
-- =============================================
CREATE PROCEDURE SP_GetUserGender
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Gender 
    FROM Users 
    WHERE UserId = @UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <20/5/2025>
-- Description:	<Check if user exists>
-- =============================================
CREATE PROCEDURE SP_UserExists
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId)
        SELECT 1 AS UserExists;
    ELSE
        SELECT 0 AS UserExists;
END
GO