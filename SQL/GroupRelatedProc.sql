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

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <5/4/2025>
-- Description:	<This procedure checks if the user is an admin for the specified group>
-- =============================================
CREATE PROCEDURE SP_IsUserGroupAdmin
    @userId INT,
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        CASE WHEN EXISTS (
            SELECT 1
            FROM GroupAdmins
            WHERE UserId = @userId AND GroupId = @groupId
        ) THEN 1 ELSE 0 END AS IsAdmin;
END
GO
