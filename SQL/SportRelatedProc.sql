-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <26/3/2025>
-- Description:	<This Procedure returns all the sports and their details>
-- =============================================
CREATE PROCEDURE SP_GetAllSports 
AS
BEGIN
	SET NOCOUNT ON;

	SELECT SportId, SportName, SportImage
    FROM Sports
	ORDER BY SportName ASC
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Add new sport>
-- =============================================
CREATE PROCEDURE SP_AddSport
    @SportName NVARCHAR(50),
    @SportImage NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if sport name already exists
    IF EXISTS (SELECT 1 FROM Sports WHERE SportName = @SportName)
    BEGIN
        SELECT 0 AS Success, 'Sport name already exists' AS Message, 0 AS SportId;
        RETURN;
    END
    
    -- Insert new sport
    INSERT INTO Sports (SportName, SportImage)
    VALUES (@SportName, @SportImage);
    
    DECLARE @NewSportId INT = SCOPE_IDENTITY();
    
    SELECT 1 AS Success, 'Sport added successfully' AS Message, @NewSportId AS SportId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Update sport image>
-- =============================================
CREATE PROCEDURE SP_UpdateSportImage
    @SportId INT,
    @SportImage NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if sport exists
    IF NOT EXISTS (SELECT 1 FROM Sports WHERE SportId = @SportId)
    BEGIN
        SELECT 0 AS Success, 'Sport not found' AS Message;
        RETURN;
    END
    
    -- Update sport image
    UPDATE Sports
    SET SportImage = @SportImage
    WHERE SportId = @SportId;
    
    SELECT 1 AS Success, 'Sport image updated successfully' AS Message;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Delete sport>
-- =============================================
CREATE PROCEDURE SP_DeleteSport
    @SportId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if sport exists
    IF NOT EXISTS (SELECT 1 FROM Sports WHERE SportId = @SportId)
    BEGIN
        SELECT 0 AS Success, 'Sport not found' AS Message, NULL AS SportImage;
        RETURN;
    END
    
    -- Check if sport is referenced by users
    IF EXISTS (SELECT 1 FROM Users WHERE FavSportId = @SportId)
    BEGIN
        SELECT 0 AS Success, 'Cannot delete sport. It is selected as favorite sport by some users' AS Message, NULL AS SportImage;
        RETURN;
    END
    
    -- Check if sport is referenced by groups
    IF EXISTS (SELECT 1 FROM Groups WHERE SportId = @SportId)
    BEGIN
        SELECT 0 AS Success, 'Cannot delete sport. It is associated with existing groups' AS Message, NULL AS SportImage;
        RETURN;
    END
    
    -- Check if sport is referenced by events
    IF EXISTS (SELECT 1 FROM [Events] WHERE SportId = @SportId)
    BEGIN
        SELECT 0 AS Success, 'Cannot delete sport. It is associated with existing events' AS Message, NULL AS SportImage;
        RETURN;
    END
    
    -- Get image for deletion
    DECLARE @SportImage NVARCHAR(255);
    SELECT @SportImage = SportImage FROM Sports WHERE SportId = @SportId;
    
    -- Delete sport
    DELETE FROM Sports WHERE SportId = @SportId;
    
    SELECT 1 AS Success, 'Sport deleted successfully' AS Message, @SportImage AS SportImage;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <14/7/2025>
-- Description:	<Get current sport image>
-- =============================================
CREATE PROCEDURE SP_GetSportImage
    @SportId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SportImage
    FROM Sports
    WHERE SportId = @SportId;
END
GO