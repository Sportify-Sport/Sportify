-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <26/3/2025>
-- Description:	<This Procedure returns 3 groups that the user joined to>
-- =============================================
CREATE PROCEDURE SP_GetTop3UserGroups
	@userId INT
AS
BEGIN
	SET NOCOUNT ON;

	SELECT TOP 3 g.GroupId, g.GroupName, g.GroupImage, g.CityId, g.SportId
    FROM Groups g INNER JOIN GroupMembers gm ON g.GroupId = gm.GroupId
	WHERE gm.UserId = @userId
	ORDER BY gm.JoinedAt DESC
END
GO
