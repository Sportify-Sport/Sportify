-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<This procedure is used to get cities that a user is an organizer for>
-- =============================================
CREATE PROCEDURE SP_GetUserManagedCities
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CityId
    FROM CityOrganizers
    WHERE UserId = @UserId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<This procedure is used to check if a user is an organizer for a specific city>
-- =============================================
CREATE PROCEDURE SP_IsUserCityOrganizer
    @UserId INT,
    @CityId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IsOrganizer BIT = 0;
    
    IF EXISTS (SELECT 1 FROM CityOrganizers WHERE UserId = @UserId AND CityId = @CityId)
        SET @IsOrganizer = 1;
    
    SELECT @IsOrganizer AS IsOrganizer;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <19/5/2025>
-- Description:	<This procedure is used to get dashboard statistics for a city>
-- =============================================
CREATE PROCEDURE SP_GetCityDashboardStats
    @CityId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Events count
    DECLARE @EventsCount INT = 
        (SELECT COUNT(EventId) FROM Events WHERE CityId = @CityId);
    
    -- Active events count
    DECLARE @ActiveEventsCount INT = 
        (SELECT COUNT(EventId) 
         FROM Events 
         WHERE CityId = @CityId 
         AND StartDatetime <= GETDATE() 
         AND EndDatetime >= GETDATE());
    
    -- Groups count
    DECLARE @GroupsCount INT = 
        (SELECT COUNT(GroupId) FROM Groups WHERE CityId = @CityId);
    
    -- Total participants in events
    DECLARE @TotalParticipants INT = 
        ISNULL((SELECT SUM(ParticipantsNum) FROM Events WHERE CityId = @CityId), 0);
    
    -- Total members in groups
    DECLARE @TotalGroupMembers INT = 
        ISNULL((SELECT SUM(TotalMembers) FROM Groups WHERE CityId = @CityId), 0);
    
    -- Return the results
    SELECT 
        @EventsCount AS EventsCount,
        @ActiveEventsCount AS ActiveEventsCount,
        @GroupsCount AS GroupsCount,
        @TotalParticipants AS TotalParticipants,
        @TotalGroupMembers AS TotalGroupMembers;
END
GO
