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
