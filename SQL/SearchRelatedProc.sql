-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/4/2025>
-- Description:	Used for searching groups
-- =============================================
CREATE PROCEDURE SP_SearchGroups
    @name NVARCHAR(100) = NULL,
    @sportId INT = NULL,
    @cityId INT = NULL,
    @minAge INT = NULL,
    @maxAge INT = NULL,
    @gender VARCHAR(10) = NULL,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    SELECT 
        g.GroupId,
        g.GroupName,
        g.GroupImage,
        g.CityId,
        g.SportId,
        g.Gender
    FROM Groups g
    WHERE (@name IS NULL OR g.GroupName LIKE '%' + @name + '%')
        AND (@sportId IS NULL OR g.SportId = @sportId)
        AND (@cityId IS NULL OR g.CityId = @cityId)
        AND (@gender IS NULL OR g.Gender = @gender)
        AND (@minAge IS NULL OR g.MinAge >= @minAge)
        AND (@maxAge IS NULL OR g.MinAge <= @maxAge)
    ORDER BY g.GroupName
    OFFSET @skip ROWS
    FETCH NEXT @pageSize + 1 ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/4/2025>
-- Description:	Used for searching event with infinity scroll
-- =============================================
CREATE PROCEDURE SP_SearchEvents
    @name NVARCHAR(100) = NULL,
    @sportId INT = NULL,
    @cityId INT = NULL,
    @minAge INT = NULL,
    @maxAge INT = NULL,
    @gender VARCHAR(10) = NULL,
    @startDate DATETIME = NULL,
	@endDate DATETIME = NULL,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    SELECT 
        e.EventId,
        e.EventName,
        e.StartDatetime,
        e.EndDatetime,
        e.SportId,
        e.ProfileImage,
        e.CityId
    FROM [Events] e
    WHERE e.IsPublic = 1
        AND (@name IS NULL OR e.EventName LIKE '%' + @name + '%')
        AND (@sportId IS NULL OR e.SportId = @sportId)
        AND (@cityId IS NULL OR e.CityId = @cityId)
        AND (@gender IS NULL OR e.Gender = @gender)
        AND (@minAge IS NULL OR e.MinAge >= @minAge)
        AND (@maxAge IS NULL OR e.MinAge <= @maxAge)
        AND (@startDate IS NULL OR e.StartDatetime >= @startDate)
        AND (@endDate IS NULL OR e.EndDatetime <= DATEADD(DAY, 1, @endDate))
    ORDER BY 
    CASE WHEN e.EndDatetime >= GETDATE() THEN 0 ELSE 1 END,
    e.StartDatetime ASC
    OFFSET @skip ROWS
    FETCH NEXT @pageSize + 1 ROWS ONLY;
END
GO