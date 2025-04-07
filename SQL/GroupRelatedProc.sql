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

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <6/4/2025>
-- Description:	<This procedure returns a paginated list of groups (for inifnity scroll)>
-- =============================================
CREATE PROCEDURE SP_GetGroupsPaginated
    @lastGroupId INT = NULL,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        GroupId, 
        GroupName, 
        GroupImage, 
        CityId, 
        SportId,
		Gender
    FROM Groups
    WHERE 
        -- First page or continuation condition
        @lastGroupId IS NULL OR GroupId > @lastGroupId
    ORDER BY GroupId ASC
    OFFSET 0 ROWS
    FETCH NEXT @pageSize ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <6/4/2025>
-- Description:	<This procedure returns a groups details with user status (Member or Admin)>
-- =============================================
CREATE PROCEDURE SP_GetGroupDetailsWithMembershipStatus
    @groupId INT,
    @userId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        g.*,
        CASE WHEN @userId IS NOT NULL AND EXISTS (
            SELECT 1 FROM GroupMembers 
            WHERE GroupId = @groupId AND UserId = @userId
        ) THEN 1 ELSE 0 END AS IsMember,
        CASE WHEN @userId IS NOT NULL AND EXISTS (
            SELECT 1 FROM GroupAdmins 
            WHERE GroupId = @groupId AND UserId = @userId
        ) THEN 1 ELSE 0 END AS IsAdmin
    FROM Groups g
    WHERE g.GroupId = @groupId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/4/2025>
-- Description:	Submits a group join request if allowed.
--              Checks membership, existing sport group, pending requests,
--              and one-month cooldown after rejection/removal.
-- =============================================
CREATE PROCEDURE SP_SubmitGroupJoinRequest
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @sportId INT;
    DECLARE @existingRequestId INT = NULL;
    DECLARE @rejectionDate DATE = NULL;
    DECLARE @oneMonthAgo DATE = DATEADD(MONTH, -1, CAST(GETDATE() AS DATE));
    DECLARE @result NVARCHAR(100) = 'Success';
    
    -- Get the sport ID for this group
    SELECT @sportId = SportId FROM Groups WHERE GroupId = @groupId;
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @userId)
    BEGIN
        SET @result = 'AlreadyMember';
        GOTO ReturnResult;
    END
    
    -- Check if user is a member of another group with same sport type
    IF EXISTS (
        SELECT 1 FROM GroupMembers gm 
        INNER JOIN Groups g ON gm.GroupId = g.GroupId 
        WHERE gm.UserId = @userId AND g.SportId = @sportId AND g.GroupId <> @groupId
    )
    BEGIN
        SET @result = 'AlreadyInSportGroup';
        GOTO ReturnResult;
    END
    
    -- Check for pending request
    IF EXISTS (
        SELECT 1 FROM GroupJoinRequests 
        WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
    )
    BEGIN
        SET @result = 'PendingRequestExists';
        GOTO ReturnResult;
    END
    
    -- Check for recent rejection or removal
    SELECT TOP 1 
        @existingRequestId = RequestId,
        @rejectionDate = RejectionOrRemovalDate
    FROM GroupJoinRequests 
    WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus IN ('Rejected', 'Removed')
    ORDER BY RejectionOrRemovalDate DESC;
    
    IF @rejectionDate IS NOT NULL AND @rejectionDate > @oneMonthAgo
    BEGIN
        SET @result = 'RejectionCooldownActive';
        GOTO ReturnResult;
    END
    
    -- Process the request (update existing or insert new)
    IF @existingRequestId IS NOT NULL
    BEGIN
        -- Update existing request
        UPDATE GroupJoinRequests
        SET RequestStatus = 'Pending', 
            RequestDate = CAST(GETDATE() AS DATE),
            RejectionOrRemovalDate = NULL
        WHERE RequestId = @existingRequestId;
    END
    ELSE
    BEGIN
        -- Insert new request
        INSERT INTO GroupJoinRequests (GroupId, RequesterUserId, RequestStatus, RequestDate)
        VALUES (@groupId, @userId, 'Pending', CAST(GETDATE() AS DATE));
    END
    
ReturnResult:
    SELECT @result AS Result;
END
GO