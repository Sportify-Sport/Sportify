CREATE TABLE Sports (
    SportId INT PRIMARY KEY IDENTITY(1,1),
    SportName NVARCHAR(50) NOT NULL UNIQUE,
	SportImage NVARCHAR(255) DEFAULT '',
);


CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    BirthDate DATE NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FavSportId INT REFERENCES Sports(SportId) NOT NULL,
    CityId INT NOT NULL,
    ProfileImage NVARCHAR(255) DEFAULT '',
    Bio NVARCHAR(500) DEFAULT '',
    Gender NVARCHAR(1) NOT NULL CHECK (Gender IN ('M', 'F')),
	IsCityOrganizer BIT NOT NULL DEFAULT 0,
	IsGroupAdmin BIT NOT NULL DEFAULT 0,
	IsEventAdmin BIT NOT NULL DEFAULT 0,
	IsEmailVerified BIT NOT NULL DEFAULT 0,
	CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
	IsSuperAdmin BIT NOT NULL DEFAULT 0
);

ALTER TABLE Users
ADD CONSTRAINT CK_SuperAdmin_IsCityOrganizer 
CHECK (IsSuperAdmin = 0 OR (IsSuperAdmin = 1 AND IsCityOrganizer = 1));


CREATE TABLE Groups (
    GroupId INT PRIMARY KEY IDENTITY(1,1),
    GroupName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) DEFAULT '',
    SportId INT REFERENCES Sports(SportId) NOT NULL,
    GroupImage NVARCHAR(255) DEFAULT '',
    CityId INT NOT NULL,
    FoundedAt DATETIME DEFAULT GETDATE(),
    MaxMemNum INT NOT NULL CHECK (MaxMemNum > 0),
    TotalMembers INT NOT NULL DEFAULT 0,
    MinAge INT NOT NULL,
    Gender NVARCHAR(6) NOT NULL CHECK (Gender IN ('Female', 'Male', 'Mixed'))
);


CREATE TABLE GroupMembers (
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE,
    UserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    JoinedAt DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    PRIMARY KEY (GroupId, UserId)
);


CREATE TABLE CityOrganizers (
    UserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    CityId INT NOT NULL,
    PRIMARY KEY (UserId, CityId)
);


CREATE TABLE GroupAdmins (
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE,
    UserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    PRIMARY KEY (GroupId, UserId)
);


CREATE TABLE EventLocations (
    LocationId INT PRIMARY KEY IDENTITY(1,1),
    LocationName NVARCHAR(100) NOT NULL
);


CREATE TABLE [Events] (
    EventId INT PRIMARY KEY IDENTITY(1,1),
    EventName NVARCHAR(100) NOT NULL,
    RequiresTeams BIT NOT NULL DEFAULT 0,
    Description NVARCHAR(500) DEFAULT '',
    StartDatetime DATETIME NOT NULL,
    EndDatetime DATETIME NOT NULL,
    CityId INT NOT NULL,
    LocationId INT REFERENCES EventLocations(LocationId),
    SportId INT REFERENCES Sports(SportId) NOT NULL,
    MaxTeams INT,
    CreatedAt DATE DEFAULT CAST(GETDATE() AS DATE),
    IsPublic BIT NOT NULL DEFAULT 1,
    MaxParticipants INT,
    MinAge INT NOT NULL,
    Gender NVARCHAR(6) NOT NULL CHECK (Gender IN ('Female', 'Male', 'Mixed')),
    ParticipantsNum INT DEFAULT 0,
    TeamsNum INT DEFAULT 0,
    ProfileImage NVARCHAR(255) DEFAULT '',
    CONSTRAINT CK_Event_Dates CHECK (EndDatetime >= StartDatetime)
);


CREATE TABLE EventAdmins (
    EventId INT REFERENCES [Events](EventId) ON DELETE CASCADE,
    CityOrganizerId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    PRIMARY KEY (EventId, CityOrganizerId)
);


CREATE TABLE EventParticipants (
    UserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    EventId INT REFERENCES [Events](EventId) ON DELETE CASCADE,
    PlayWatch BIT NOT NULL,  -- 1 for 'Play', 0 for 'Watch'
    PRIMARY KEY (UserId, EventId)
);


CREATE TABLE EventJoinRequests (
    RequestId INT PRIMARY KEY IDENTITY(1,1),
    EventId INT REFERENCES [Events](EventId) ON DELETE CASCADE,
    RequesterUserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    RequestStatus NVARCHAR(20) NOT NULL CHECK (RequestStatus IN ('Pending', 'Approved', 'Rejected', 'Removed', 'Left', 'Canceled')),
	RequestedDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
	RejectionOrRemovalDate DATE NULL
);


CREATE TABLE GroupJoinRequests (
    RequestId INT PRIMARY KEY IDENTITY(1,1),
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE,
    RequesterUserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    RequestStatus NVARCHAR(20) NOT NULL CHECK (RequestStatus IN ('Pending', 'Approved', 'Rejected', 'Removed', 'Left', 'Canceled')),
    RequestDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
	RejectionOrRemovalDate DATE NULL
);


CREATE TABLE EventTeams (
    EventId INT REFERENCES [Events](EventId) ON DELETE CASCADE,
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE
    PRIMARY KEY (EventId, GroupId)
);

CREATE TABLE RefreshTokens (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Token VARCHAR(255) NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    Created DATETIME NOT NULL DEFAULT GETDATE(),
    Revoked DATETIME NULL,
    ReplacedByToken VARCHAR(255) NULL,
    ReasonRevoked NVARCHAR(100) NULL,
	UseCount INT NOT NULL DEFAULT 0
);

CREATE TABLE AdminRefreshTokens (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Token VARCHAR(255) NOT NULL,
    ExpiryDate DATETIME NOT NULL,
    Created DATETIME NOT NULL DEFAULT GETDATE(),
    Revoked DATETIME NULL,
    ReplacedByToken VARCHAR(255) NULL,
    ReasonRevoked NVARCHAR(100) NULL
);

CREATE TABLE EmailVerificationCodes (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Code NVARCHAR(6) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PasswordResetCodes (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Code NVARCHAR(6) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    IsUsed BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_EmailVerificationCodes_Code ON EmailVerificationCodes(Code) WHERE IsUsed = 0;
CREATE INDEX IX_PasswordResetCodes_Code ON PasswordResetCodes(Code) WHERE IsUsed = 0;

CREATE TABLE UserPushNotificationTokens (
    TokenId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    PushToken NVARCHAR(500) NOT NULL,
    DeviceId NVARCHAR(255) NOT NULL,
    Platform NVARCHAR(50) NOT NULL CHECK (Platform IN ('ios', 'android')),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    LastUsedAt DATETIME NULL,
    FailureCount INT DEFAULT 0,
    CONSTRAINT UQ_UserDevice UNIQUE(UserId, DeviceId)
);

CREATE TABLE NotificationHistory (
    NotificationId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL REFERENCES Users(UserId) ON DELETE CASCADE,
    Title NVARCHAR(255) NOT NULL,
    Body NVARCHAR(1000) NOT NULL,
    NotificationData NVARCHAR(MAX) NULL, -- JSON data
    SentAt DATETIME NOT NULL DEFAULT GETDATE(),
    IsRead BIT NOT NULL DEFAULT 0,
    ReadAt DATETIME NULL,
    NotificationType NVARCHAR(100) NULL,
    RelatedEntityId INT NULL,
    RelatedEntityType NVARCHAR(50) NULL
);

CREATE INDEX IX_UserPushTokens_UserId_Active ON UserPushNotificationTokens(UserId, IsActive);
CREATE INDEX IX_NotificationHistory_UserId_SentAt ON NotificationHistory(UserId, SentAt DESC);