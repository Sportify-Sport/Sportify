-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets event details>
-- =============================================
CREATE PROCEDURE SP_GetEventDetails
    @eventId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        e.*,
        el.LocationName,
        el.Latitude,
        el.Longitude
    FROM 
        Events e
    LEFT JOIN 
        EventLocations el ON e.LocationId = el.LocationId
    WHERE 
        e.EventId = @eventId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets 5 random events from the events table>
-- =============================================
CREATE PROCEDURE SP_GetRandomEvents
    @count INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@count) EventId, EventName, ProfileImage
    FROM [Events]
    WHERE IsPublic = 1
      AND StartDatetime >= GETDATE()
    ORDER BY NEWID();
END


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This Procedure gets events from the events table (Paginiation)>
-- =============================================
CREATE PROCEDURE SP_GetEventsPaginated
    @lastEventDate DATETIME = NULL,
    @lastEventId INT = NULL,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EventId, 
        EventName, 
        StartDatetime, 
        EndDatetime, 
        SportId, 
        ProfileImage,
		CityId
    FROM [Events]
    WHERE 
        -- First page or continuation condition
        @lastEventDate IS NULL
        OR StartDatetime > @lastEventDate
        OR (StartDatetime = @lastEventDate AND EventId > @lastEventId)
    ORDER BY StartDatetime ASC, EventId ASC
    OFFSET 0 ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO