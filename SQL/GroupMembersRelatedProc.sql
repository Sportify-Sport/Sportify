-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<This Procedure gets group members with infinty scroll / pagination>
-- =============================================
CREATE PROCEDURE SP_GetGroupMembers
    @groupId INT,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculate skip for pagination
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    -- Get group members with N+1 approach for infinite scroll
    SELECT 
        u.UserId,
        u.FirstName + ' ' + u.LastName AS GroupMemberName,
        u.ProfileImage AS GroupMemberImage,
        YEAR(gm.JoinedAt) AS JoinYear,
        CASE WHEN u.IsGroupAdmin = 1 THEN 1 ELSE 0 END AS IsAdmin
    FROM GroupMembers gm
    INNER JOIN Users u ON gm.UserId = u.UserId
    WHERE gm.GroupId = @groupId
    ORDER BY 
        gm.JoinedAt ASC
    OFFSET @skip ROWS
    FETCH NEXT @pageSize + 1 ROWS ONLY;
END
GO