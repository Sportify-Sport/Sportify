-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Add City Organizer>
-- =============================================
CREATE PROCEDURE SP_AddCityOrganizer
    @UserId INT,
    @CityId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM Users WHERE UserId = @UserId)
    BEGIN
        SELECT 0 AS Success, 'User not found' AS Message;
        RETURN;
    END
    
    -- Check if already a city organizer for this city
    IF EXISTS (SELECT 1 FROM CityOrganizers WHERE UserId = @UserId AND CityId = @CityId)
    BEGIN
        SELECT 0 AS Success, 'User is already a city organizer for this city' AS Message;
        RETURN;
    END
    
    -- Add to CityOrganizers table
    INSERT INTO CityOrganizers (UserId, CityId)
    VALUES (@UserId, @CityId);
    
    -- Update IsCityOrganizer flag in Users table
    UPDATE Users
    SET IsCityOrganizer = 1
    WHERE UserId = @UserId;
    
    SELECT 1 AS Success, 'City organizer added successfully' AS Message;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Remove City Organizer>
-- =============================================
CREATE PROCEDURE SP_RemoveCityOrganizer
    @UserId INT,
    @CityId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if city organizer exists
    IF NOT EXISTS (SELECT 1 FROM CityOrganizers WHERE UserId = @UserId AND CityId = @CityId)
    BEGIN
        SELECT 0 AS Success, 'User is not a city organizer for this city' AS Message;
        RETURN;
    END
    
    -- Remove from CityOrganizers table
    DELETE FROM CityOrganizers
    WHERE UserId = @UserId AND CityId = @CityId;
    
    -- Check if user is still organizer for other cities
    IF NOT EXISTS (SELECT 1 FROM CityOrganizers WHERE UserId = @UserId)
    BEGIN
        -- Update IsCityOrganizer flag if not organizer for any city
        UPDATE Users
        SET IsCityOrganizer = 0
        WHERE UserId = @UserId AND IsSuperAdmin = 0; -- Don't remove flag from SuperAdmin
    END
    
    SELECT 1 AS Success, 'City organizer removed successfully' AS Message;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Search procedure with filters and pagination for city organizers>
-- =============================================
CREATE PROCEDURE SP_SearchCityOrganizers
    @Query NVARCHAR(100) = NULL,
    @CityId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate skip value
    DECLARE @Skip INT = (@PageNumber - 1) * @PageSize;
    
    -- Get total count for the query
    DECLARE @TotalCount INT;
    
    SELECT @TotalCount = COUNT(*)
    FROM CityOrganizers co
    INNER JOIN Users u ON co.UserId = u.UserId
    WHERE 
        (@Query IS NULL OR 
         u.Email LIKE '%' + @Query + '%' OR 
         CAST(u.UserId AS NVARCHAR(10)) = @Query)
    AND (@CityId IS NULL OR co.CityId = @CityId);
    
    -- Get paginated results + 1 to check if there are more
    SELECT 
        u.UserId,
        u.FirstName,
        u.LastName,
        u.Email,
        u.ProfileImage,
        u.IsSuperAdmin,
        co.CityId
    FROM CityOrganizers co
    INNER JOIN Users u ON co.UserId = u.UserId
    WHERE 
        (@Query IS NULL OR 
         u.Email LIKE '%' + @Query + '%' OR 
         CAST(u.UserId AS NVARCHAR(10)) = @Query)
    AND (@CityId IS NULL OR co.CityId = @CityId)
    ORDER BY u.FirstName, u.LastName
    OFFSET @Skip ROWS
    FETCH NEXT @PageSize + 1 ROWS ONLY;
    
    -- Return total count as well
    SELECT @TotalCount AS TotalCount;
END
GO