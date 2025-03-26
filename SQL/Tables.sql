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
);


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
    Gender NVARCHAR(6) NOT NULL CHECK (Gender IN ('Female', 'Male', 'Mixed')),
    Matches INT NOT NULL DEFAULT 0,
    Wins INT NOT NULL DEFAULT 0,
    Loses INT NOT NULL DEFAULT 0
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
    LocationName NVARCHAR(100) NOT NULL,
    Latitude DECIMAL(9,6) NULL,
    Longitude DECIMAL(9,6) NULL
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
    WinnerId INT, -- Could reference GroupID or UserID based on winner type
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
    RequestedDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    RequestStatus NVARCHAR(20) NOT NULL CHECK (RequestStatus IN ('Pending', 'Approved', 'Rejected'))
);


CREATE TABLE GroupJoinRequests (
    RequestId INT PRIMARY KEY IDENTITY(1,1),
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE,
    RequesterUserId INT REFERENCES Users(UserId) ON DELETE CASCADE,
    RequestStatus NVARCHAR(20) NOT NULL CHECK (RequestStatus IN ('Pending', 'Approved', 'Rejected')),
    RequestDate DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE)
);


CREATE TABLE EventTeams (
    EventId INT REFERENCES [Events](EventId) ON DELETE CASCADE,
    GroupId INT REFERENCES Groups(GroupId) ON DELETE CASCADE,
    ScoreNum INT DEFAULT 0,
    PRIMARY KEY (EventId, GroupId)
);