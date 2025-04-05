INSERT INTO Sports (SportName)
VALUES
('Football'),
('Basketball'),
('Marathon');

INSERT INTO Users (FirstName, LastName, BirthDate, Email, PasswordHash, FavSportId, CityId, ProfileImage, Bio, Gender)
VALUES 
('Avi', 'Cohen', '1995-06-12', 'avi.cohen@example.com', 'hashedpassword1', 1, 123, '', 'Sports enthusiast, loves football', 'M'),
('Yaara', 'Levi', '1992-11-25', 'yaara.levi@example.com', 'hashedpassword2', 2, 456, '', 'Basketball player, traveler', 'F'),
('Oren', 'Shwartz', '1988-03-09', 'oren.shwartz@example.com', 'hashedpassword3', 3, 789, '', 'Tech lover, enjoys swimming', 'M');

INSERT INTO CityOrganizers (UserId, CityId)
VALUES
(8, 1)


-- Football Groups
INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Maccabi Tel Aviv Fans', 'Community football group for Maccabi Tel Aviv supporters meeting weekly for friendly matches', 1, '', 1, '2018-06-15', 22, 18, 18, 'Mixed', 0, 0, 0);

INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Jerusalem United', 'Football enthusiasts from Jerusalem meeting twice a week for training and matches', 1, '', 2, '2019-03-22', 25, 0, 16, 'Male', 0, 0, 0);


-- Basketball Groups
INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Tel Aviv Hoops', 'Competitive basketball group playing at Sportech Center', 2, '', 1, '2019-05-12', 15, 12, 18, 'Male', 0, 0, 0);

INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Jerusalem Ballers', 'Weekend basketball group for all skill levels', 2, '', 2, '2020-01-25', 20, 14, 16, 'Mixed', 0, 0, 0);

-- Marathon Groups
INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Tel Aviv Runners', 'Training group preparing for the Tel Aviv Marathon', 3, '', 1, '2019-08-20', 50, 42, 18, 'Mixed', 0, 0, 0);

INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, FoundedAt, MaxMemNum, TotalMembers, MinAge, Gender, Matches, Wins, Loses)
VALUES ('Herzliya Women Marathoners', 'Women''s marathon training group with professional coaching', 3, '', 7, '2021-03-08', 20, 15, 21, 'Female', 0, 0, 0);


INSERT INTO EventLocations (LocationName)
VALUES
('Haifa Sports Complex'),
('Tel Aviv Beach Arena'),
('Jerusalem Liberty Stadium'),
('Eilat Track Center'),
('Nazareth City Park');

-- Football Event
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender)
VALUES (
    'Haifa Youth Football Cup', 1, 'A regional football tournament for youth teams.',
    '2025-05-10 09:00', '2025-05-10 17:00',
    101, 1, 1, 8, 1, 14, 'Male'
);

-- Basketball Event
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender)
VALUES (
    'Tel Aviv 3x3 Challenge', 1, 'Street-style 3x3 basketball tournament.',
    '2025-06-02 15:00', '2025-06-02 20:00',
    102, 2, 2, 12, 1, 16, 'Mixed'
);

-- Marathon Event
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender)
VALUES (
    'Jerusalem Spring Marathon', 0, 'Scenic marathon through the streets of Jerusalem.',
    '2025-04-18 07:00', '2025-04-18 14:00',
    103, 3, 3, 300, 1, 18, 'Mixed'
);

-- Another Marathon
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender)
VALUES (
    'Eilat Desert Run', 0, 'Endurance run in the stunning Eilat desert.',
    '2025-11-08 06:00', '2025-11-08 12:00',
    104, 4, 3, 200, 1, 21, 'Mixed'
);

-- Women’s Basketball Tournament
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender)
VALUES (
    'Nazareth Women Basketball Cup', 1, 'Tournament for female basketball teams across the north.',
    '2025-07-01 10:00', '2025-07-01 18:00',
    105, 5, 2, 6, 1, 17, 'Female'
);


INSERT INTO EventLocations (LocationName)
VALUES ('Ramat Gan National Stadium');

INSERT INTO Events (
    EventName, RequiresTeams, Description, StartDatetime, EndDatetime,
    CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender
)
VALUES (
    'Ramat Gan Mixed Football Day', 1,
    'A casual football day for mixed-gender teams. Open to all skill levels.',
    '2025-08-10 10:00', '2025-08-10 16:00',
    106, 6, 1, 10, 1, 16, 'Mixed'
);
