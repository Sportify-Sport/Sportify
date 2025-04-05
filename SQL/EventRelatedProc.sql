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