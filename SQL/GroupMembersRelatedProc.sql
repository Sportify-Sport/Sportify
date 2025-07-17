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




-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Check if a user is an admin of a specific group>
-- =============================================
CREATE PROCEDURE SP_IsUserGroupAdmin
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) 
    FROM GroupMembers 
    INNER JOIN Users ON GroupMembers.UserId = Users.UserId
    WHERE GroupId = @groupId 
    AND GroupMembers.UserId = @userId 
    AND Users.IsGroupAdmin = 1;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Check if a user is a member of a specific group>
-- =============================================
CREATE PROCEDURE SP_IsUserGroupMember
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) 
    FROM GroupMembers 
    WHERE GroupId = @groupId 
    AND UserId = @userId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Get user details for a group member with age calculation>
-- =============================================
CREATE PROCEDURE SP_GetGroupUserDetails
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.FirstName + ' ' + u.LastName AS FullName,
        DATEDIFF(YEAR, u.BirthDate, GETDATE()) AS Age,
        u.Email,
        u.CityId,
        u.Bio,
        u.Gender,
		u.ProfileImage AS UserImage
    FROM Users u
    INNER JOIN GroupMembers gm ON u.UserId = gm.UserId
    WHERE gm.GroupId = @groupId AND u.UserId = @userId;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<This Procedure gets group pending requests with infinty scroll / pagination>
-- =============================================
CREATE PROCEDURE SP_GetGroupPendingJoinRequests
    @groupId INT,
    @page INT = 1,
    @pageSize INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @skip INT = (@page - 1) * @pageSize;
    
    SELECT 
        gjr.RequestId,
        gjr.RequesterUserId AS UserId,
        u.FirstName + ' ' + u.LastName AS FullName,
        u.ProfileImage AS UserPicture,
        gjr.RequestDate
    FROM GroupJoinRequests gjr
    INNER JOIN Users u ON gjr.RequesterUserId = u.UserId
    WHERE 
        gjr.GroupId = @groupId
        AND gjr.RequestStatus = 'Pending'
    ORDER BY 
        gjr.RequestDate DESC  -- Most recent requests first
    OFFSET @skip ROWS
    FETCH NEXT @pageSize + 1 ROWS ONLY;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <7/4/2025>
-- Description:	Submits a group join request if allowed.
--              Checks membership, pending requests,
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
    DECLARE @oneWeekAgo DATE = DATEADD(WEEK, -1, CAST(GETDATE() AS DATE)); 
    DECLARE @result NVARCHAR(100) = 'Success';
	DECLARE @groupMinAge INT;
    DECLARE @groupGender NVARCHAR(6);
    DECLARE @groupMaxMembers INT;
    DECLARE @groupCurrentMembers INT;
    DECLARE @userBirthDate DATE;
    DECLARE @userGender NVARCHAR(1);
    DECLARE @userAge INT;
    DECLARE @currentDate DATETIME = GETDATE();

    -- Get the sport ID for this group
    SELECT
		@sportId = SportId,
        @groupMinAge = MinAge,
        @groupGender = Gender,
        @groupMaxMembers = MaxMemNum,
        @groupCurrentMembers = TotalMembers
	FROM Groups 
	WHERE GroupId = @groupId;
    
	-- Check if group exists
	IF @sportId IS NULL
	BEGIN
		SET @result = 'GroupNotFound';
		GOTO ReturnResult;
	END

	-- Get user information
    SELECT 
        @userBirthDate = BirthDate,
        @userGender = Gender
    FROM Users
    WHERE UserId = @userId;

	-- Calculate user's age
    SET @userAge = DATEDIFF(YEAR, @userBirthDate, @currentDate) -
        CASE
            WHEN DATEADD(YEAR, DATEDIFF(YEAR, @userBirthDate, @currentDate), @userBirthDate) > @currentDate
            THEN 1
            ELSE 0
        END;
    
    -- Check if group is full
    IF @groupCurrentMembers >= @groupMaxMembers
    BEGIN
        SET @result = 'GroupFull';
        GOTO ReturnResult;
    END

	-- Check age requirement
    IF @userAge < @groupMinAge
    BEGIN
        SET @result = 'AgeTooLow';
        GOTO ReturnResult;
    END
    
    -- Check gender requirement
    IF (@groupGender = 'Male' AND @userGender <> 'M') OR 
       (@groupGender = 'Female' AND @userGender <> 'F')
       -- No check needed for 'Mixed' as it accepts both genders
    BEGIN
        SET @result = 'GenderMismatch';
        GOTO ReturnResult;
    END

    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @userId)
    BEGIN
        SET @result = 'AlreadyMember';
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
    WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus IN ('Rejected', 'Removed', 'Left')
    ORDER BY RejectionOrRemovalDate DESC;
    
    IF @rejectionDate IS NOT NULL AND @rejectionDate > @oneWeekAgo
    BEGIN
        SET @result = 'CooldownActive';
        GOTO ReturnResult;
    END
    
	-- If no rejected/removed/left request found, check for canceled request
	IF @existingRequestId IS NULL
	BEGIN
		SELECT TOP 1 
			@existingRequestId = RequestId
		FROM GroupJoinRequests 
		WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Canceled'
		ORDER BY RequestDate DESC;
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


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Approve a join request and add the user to the group>
-- =============================================
CREATE PROCEDURE SP_ApproveJoinRequest
    @requestId INT,
    @groupId INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    DECLARE @requesterUserId INT;
    DECLARE @currentStatus NVARCHAR(20);
    DECLARE @maxMembers INT;
    DECLARE @currentMembers INT;
    DECLARE @groupMinAge INT;
    DECLARE @groupGender NVARCHAR(6);
    DECLARE @userBirthDate DATE;
    DECLARE @userGender NVARCHAR(1);
    DECLARE @userAge INT;

    -- Get the request information
    SELECT 
        @requesterUserId = RequesterUserId,
        @currentStatus = RequestStatus
    FROM GroupJoinRequests
    WHERE RequestId = @requestId AND GroupId = @groupId;
    
    -- Check if request exists
    IF @requesterUserId IS NULL
    BEGIN
        SET @Success = 0;
        SET @Message = 'Join request not found';
        ROLLBACK;
        RETURN;
    END
    
    -- Check if already processed
    IF @currentStatus != 'Pending'
    BEGIN
        SET @Success = 0;
        SET @Message = 'Request has already been ' + @currentStatus;
        ROLLBACK;
        RETURN;
    END
    
    -- Get group information
    SELECT 
        @maxMembers = MaxMemNum,
        @currentMembers = TotalMembers,
        @groupMinAge = MinAge,
        @groupGender = Gender
    FROM Groups
    WHERE GroupId = @groupId;
    
    -- Check if group is full
    IF @currentMembers >= @maxMembers
    BEGIN
        SET @Success = 0;
        SET @Message = 'Group is already at maximum capacity';
        ROLLBACK;
        RETURN;
    END
    
	-- Get user information
    SELECT 
        @userBirthDate = BirthDate,
        @userGender = Gender
    FROM Users
    WHERE UserId = @requesterUserId;
    
    -- Calculate user age
    SET @userAge = DATEDIFF(YEAR, @userBirthDate, GETDATE()) - 
        CASE 
            WHEN DATEADD(YEAR, DATEDIFF(YEAR, @userBirthDate, GETDATE()), @userBirthDate) > GETDATE() 
            THEN 1 
            ELSE 0 
        END;
    
    -- Check age requirement
    IF @userAge < @groupMinAge
    BEGIN
        SET @Success = 0;
        SET @Message = 'User does not meet the minimum age requirement';
        ROLLBACK;
        RETURN;
    END
    
    -- Check gender requirement
    IF (@groupGender = 'Male' AND @userGender <> 'M') OR 
       (@groupGender = 'Female' AND @userGender <> 'F')
       -- No check needed for 'Mixed' as it accepts both genders
    BEGIN
        SET @Success = 0;
        SET @Message = 'User gender does not match group requirements';
        ROLLBACK;
        RETURN;
    END
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @requesterUserId)
    BEGIN
        -- Update only the request status
        UPDATE GroupJoinRequests
        SET RequestStatus = 'Approved'
        WHERE RequestId = @requestId;
        
        SET @Success = 1;
        SET @Message = 'User is already a member, request marked as approved';
        COMMIT;
        RETURN;
    END
    
    -- All checks passed, proceed with approval
    
    -- Update the request status
    UPDATE GroupJoinRequests
    SET RequestStatus = 'Approved'
    WHERE RequestId = @requestId;
    
    -- Add user to group members
    INSERT INTO GroupMembers (GroupId, UserId)
    VALUES (@groupId, @requesterUserId);
    
    -- Update the total members count
    UPDATE Groups
    SET TotalMembers = TotalMembers + 1
    WHERE GroupId = @groupId;
    
    SET @Success = 1;
    SET @Message = 'Join request approved successfully';
    COMMIT;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Reject a join request>
-- =============================================
CREATE PROCEDURE SP_RejectJoinRequest
    @requestId INT,
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update the request status to Rejected and set rejection date
    UPDATE GroupJoinRequests
    SET 
        RequestStatus = 'Rejected',
        RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
    WHERE 
        RequestId = @requestId 
        AND GroupId = @groupId
        AND RequestStatus = 'Pending';
        
    -- Return the number of rows affected
    RETURN @@ROWCOUNT;
END
GO


-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Approve a join request and add the user to the group>
-- =============================================
CREATE PROCEDURE SP_ApproveJoinRequest
    @requestId INT,
    @groupId INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    DECLARE @requesterUserId INT;
    DECLARE @currentStatus NVARCHAR(20);
    DECLARE @maxMembers INT;
    DECLARE @currentMembers INT;
    
    -- Get the request information
    SELECT 
        @requesterUserId = RequesterUserId,
        @currentStatus = RequestStatus
    FROM GroupJoinRequests
    WHERE RequestId = @requestId AND GroupId = @groupId;
    
    -- Check if request exists
    IF @requesterUserId IS NULL
    BEGIN
        SET @Success = 0;
        SET @Message = 'Join request not found';
        ROLLBACK;
        RETURN;
    END
    
    -- Check if already processed
    IF @currentStatus != 'Pending'
    BEGIN
        SET @Success = 0;
        SET @Message = 'Request has already been ' + @currentStatus;
        ROLLBACK;
        RETURN;
    END
    
    -- Get group capacity information
    SELECT 
        @maxMembers = MaxMemNum,
        @currentMembers = TotalMembers
    FROM Groups
    WHERE GroupId = @groupId;
    
    -- Check if group is full
    IF @currentMembers >= @maxMembers
    BEGIN
        SET @Success = 0;
        SET @Message = 'Group is already at maximum capacity';
        ROLLBACK;
        RETURN;
    END
    
    -- Check if user is already a member
    IF EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @requesterUserId)
    BEGIN
        -- Update only the request status
        UPDATE GroupJoinRequests
        SET RequestStatus = 'Approved'
        WHERE RequestId = @requestId;
        
        SET @Success = 1;
        SET @Message = 'User is already a member, request marked as approved';
        COMMIT;
        RETURN;
    END
    
    -- All checks passed, proceed with approval
    
    -- Update the request status
    UPDATE GroupJoinRequests
    SET RequestStatus = 'Approved'
    WHERE RequestId = @requestId;
    
    -- Add user to group members
    INSERT INTO GroupMembers (GroupId, UserId)
    VALUES (@groupId, @requesterUserId);
    
    -- Update the total members count
    UPDATE Groups
    SET TotalMembers = TotalMembers + 1
    WHERE GroupId = @groupId;
    
    SET @Success = 1;
    SET @Message = 'Join request approved successfully';
    COMMIT;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Reject a join request>
-- =============================================
CREATE PROCEDURE SP_RejectJoinRequest
    @requestId INT,
    @groupId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM GroupJoinRequests
        WHERE RequestId = @requestId 
          AND GroupId = @groupId 
          AND RequestStatus = 'Pending'
    )
    BEGIN
        UPDATE GroupJoinRequests
        SET 
            RequestStatus = 'Rejected',
            RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
        WHERE 
            RequestId = @requestId 
            AND GroupId = @groupId;

        SELECT 1 AS Success; 
        RETURN;
    END

    SELECT 0 AS Success;
END

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <8/4/2025>
-- Description:	<Remove a group member>
-- =============================================
CREATE PROCEDURE SP_RemoveGroupMember
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    DECLARE @Success BIT = 0;
    DECLARE @Message NVARCHAR(255);
    
    -- Check if the user is a member of the group
    IF NOT EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @userId)
    BEGIN
        SET @Message = 'User is not a member of this group';
        SELECT @Success AS Success, @Message AS Message;
        ROLLBACK;
        RETURN;
    END
    
    -- Remove the member from GroupMembers table
    DELETE FROM GroupMembers
    WHERE GroupId = @groupId AND UserId = @userId;
    
    -- Decrement the TotalMembers count in the Groups table
    UPDATE Groups
    SET TotalMembers = TotalMembers - 1
    WHERE GroupId = @groupId;
    
    -- Check if this user had a join request, and if so update it to "Removed"
    IF EXISTS (SELECT 1 FROM GroupJoinRequests 
               WHERE GroupId = @groupId 
               AND RequesterUserId = @userId)
    BEGIN
        UPDATE GroupJoinRequests
        SET 
            RequestStatus = 'Removed',
            RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
        WHERE 
            GroupId = @groupId 
            AND RequesterUserId = @userId;
    END
    -- If the user never had a join request, create a new record with status "Removed"
    ELSE
    BEGIN
        INSERT INTO GroupJoinRequests (GroupId, RequesterUserId, RequestStatus, RequestDate, RejectionOrRemovalDate)
        VALUES (@groupId, @userId, 'Removed', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE));
    END
    
    SET @Success = 1;
    SET @Message = 'Member removed successfully';
    
    SELECT @Success AS Success, @Message AS Message;
    COMMIT;
END

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Made for leaving a group>
-- =============================================
CREATE PROCEDURE SP_LeaveGroup
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Success BIT = 0;
    
    BEGIN TRANSACTION;
    
    -- Check if user is a member of the group
    IF EXISTS (SELECT 1 FROM GroupMembers WHERE GroupId = @groupId AND UserId = @userId)
    BEGIN
        -- Remove user from GroupMembers
        DELETE FROM GroupMembers
        WHERE GroupId = @groupId AND UserId = @userId;
        
        -- Update TotalMembers in Groups table
        UPDATE Groups
        SET TotalMembers = TotalMembers - 1
        WHERE GroupId = @groupId;
        
        -- Check if this user had a join request, and if so update it to "Left"
        IF EXISTS (SELECT 1 FROM GroupJoinRequests 
                   WHERE GroupId = @groupId 
                   AND RequesterUserId = @userId)
        BEGIN
            UPDATE GroupJoinRequests
            SET 
                RequestStatus = 'Left',
                RejectionOrRemovalDate = CAST(GETDATE() AS DATE)
            WHERE 
                GroupId = @groupId 
                AND RequesterUserId = @userId;
        END
        -- If the user never had a join request, create a new record with status "Left"
        ELSE
        BEGIN
            INSERT INTO GroupJoinRequests (GroupId, RequesterUserId, RequestStatus, RequestDate, RejectionOrRemovalDate)
            VALUES (@groupId, @userId, 'Left', CAST(GETDATE() AS DATE), CAST(GETDATE() AS DATE));
        END
        
        SET @Success = 1;
    END
    
    COMMIT;
    
    SELECT @Success AS Success;
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Get a user details that got a pending request in the sepcified group>
-- =============================================
CREATE PROCEDURE SP_GetUserWithPendingRequest
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First check if the user has a pending request for this group
    IF EXISTS (
        SELECT 1 
        FROM GroupJoinRequests 
        WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
    )
    BEGIN
        -- User has a pending request, return their details
        SELECT u.FirstName + ' ' + u.LastName AS FullName, DATEDIFF(YEAR, u.BirthDate, GETDATE()) AS Age, u.Email, u.CityId, u.Bio, u.Gender, u.ProfileImage AS UserImage
        FROM Users u
        WHERE u.UserId = @userId;
    END
END
GO

-- =============================================
-- Author:		<Mohamed Abo Full>
-- Create date: <9/4/2025>
-- Description:	<Made for canceling join request for a group>
-- =============================================
CREATE PROCEDURE SP_CancelGroupJoinRequest
    @groupId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @success BIT = 0;
    DECLARE @errorMessage NVARCHAR(100) = NULL;
    
    -- Check if the user has a pending request for this group
    IF EXISTS (
        SELECT 1 
        FROM GroupJoinRequests 
        WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Pending'
    )
    BEGIN
        -- Update the request status to Canceled
        UPDATE GroupJoinRequests
        SET RequestStatus = 'Canceled'
        WHERE GroupId = @groupId AND RequesterUserId = @userId AND RequestStatus = 'Pending';
        
        SET @success = 1;
    END
    ELSE
    BEGIN
        SET @errorMessage = 'No pending request found to cancel';
    END
    
    -- Return result
    SELECT @success AS Success, @errorMessage AS ErrorMessage;
END
