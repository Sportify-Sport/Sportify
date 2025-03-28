-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <28/3/2025>
-- Description:	<This procedure retrieves group details by groupId>
-- =============================================
CREATE PROCEDURE SP_GetGroupDetails
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM Groups
    WHERE GroupId = @groupId;
END
GO