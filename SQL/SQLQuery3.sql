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

 -- Inserted 22/4/2025
 INSERT INTO Groups (GroupName, Description, SportId, GroupImage, CityId, MaxMemNum, TotalMembers, MinAge, Gender)
VALUES 
-- Haifa groups
('Maccabi Haifa Fans', 'Supporters of Maccabi Haifa FC.', 1, 'default_group.png', 422, 30, 1, 18, 'Male'),
('Haifa Hoops', 'Basketball fans and players in Haifa.', 2, 'default_group.png', 422, 20, 1, 16, 'Mixed'),
('Haifa City Marathoners', 'For Haifa-based runners.', 3, 'default_group.png', 422, 25, 1, 20, 'Mixed'),
('Haifa United FC', 'Competitive football group in Haifa.', 1, 'default_group.png', 422, 18, 1, 17, 'Male'),
('Bay Area Ballers', 'Basketball team from Haifa Bay.', 2, 'default_group.png', 422, 15, 1, 19, 'Mixed'),
('Carmel Marathon Runners', 'Run from the mountains to the beach.', 3, 'default_group.png', 422, 20, 1, 21, 'Mixed'),
('Haifa Titans', 'Casual football group.', 1, 'default_group.png', 422, 22, 1, 16, 'Mixed'),

-- Jerusalem groups
('Jerusalem United', 'Jerusalem football group.', 1, 'default_group.png', 499, 25, 1, 18, 'Mixed'),
('Jerusalem Ballers', 'Basketball players from Jerusalem.', 2, 'default_group.png', 499, 20, 1, 17, 'Male'),
('Old City Runners', 'Marathoners from the Old City.', 3, 'default_group.png', 499, 20, 1, 20, 'Mixed'),
('Jerusalem Storm', 'Jerusalem football crew.', 1, 'default_group.png', 499, 18, 1, 18, 'Mixed'),
('Golden Hoop Jerusalem', 'Basketball squad.', 2, 'default_group.png', 499, 16, 1, 16, 'Mixed'),
('Jerusalem Marathons', 'Group for serious runners.', 3, 'default_group.png', 499, 22, 1, 21, 'Mixed'),

-- Hadera groups
('Hadera Runners', 'Runners across Hadera.', 3, 'default_group.png', 415, 20, 1, 19, 'Mixed'),
('Hadera Women Marathoners', 'Women runners from Hadera.', 3, 'default_group.png', 415, 25, 1, 22, 'Female'),
('Hadera Kicks', 'Football group based in Hadera.', 1, 'default_group.png', 415, 18, 1, 17, 'Mixed'),
('Marathon Queens', 'All-women running group.', 3, 'default_group.png', 415, 15, 1, 20, 'Female'),
('Hadera Hoopstars', 'Basketball players from Hadera.', 2, 'default_group.png', 415, 16, 1, 18, 'Mixed'),
('Fast & Female Hadera', 'Quick women marathoners.', 3, 'default_group.png', 415, 20, 1, 20, 'Female'),
('Hadera Blaze', 'Co-ed basketball group.', 2, 'default_group.png', 415, 20, 1, 19, 'Mixed');


 -- Inserted 22/4/2025
 -- Location 46
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Bay Stadium', 32.7930, 35.0456);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Football Stars League', 1, N'A thrilling football tournament for local teams.', '2025-05-01 15:00:00', '2025-05-01 18:00:00', 422, 46, 1, 8, 1, 18, 'Mixed', 'default_event.png');

-- Location 47
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Arena', 31.7515, 35.2035);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Kings Basketball Cup', 1, N'Competitive basketball event for city-wide teams.', '2025-05-05 17:00:00', '2025-05-05 21:00:00', 499, 47, 2, 6, 1, 16, 'Male', 'default_event.png');

-- Location 48
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera Sports Complex', 32.4410, 34.9035);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Local Football Teams', 1, N'Teams across Hadera compete for the cup.', '2025-06-10 14:00:00', '2025-06-10 18:00:00', 415, 48, 1, 10, 1, 16, 'Female', 'default_event.png');

-- Location 49
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Seaside Track', 32.8167, 34.9833);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Beach Marathon', 0, N'Run along the stunning coastline of Haifa.', '2025-05-12 06:00:00', '2025-05-12 10:00:00', 422, 49, 3, 200, 1, 14, 'Mixed', 'default_event.png');

-- Location 50
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Park Circuit', 31.7710, 35.2170);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Morning Run', 0, N'Community morning run through Jerusalem parks.', '2025-06-01 07:00:00', '2025-06-01 09:00:00', 499, 50, 3, 150, 1, 13, 'Male', 'default_event.png');

-- Location 51
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera Green Fields', 32.4372, 34.9196);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Half Marathon', 0, N'Push your limits with a 21k run.', '2025-06-15 06:30:00', '2025-06-15 10:00:00', 415, 51, 3, 180, 1, 15, 'Female', 'default_event.png');

-- Location 52
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Community Court', 31.7780, 35.2300);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem All-Star Basketball', 1, N'An all-star basketball face-off.', '2025-06-22 17:00:00', '2025-06-22 20:00:00', 499, 52, 2, 4, 1, 18, 'Mixed', 'default_event.png');

-- Location 53
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Heights Stadium', 32.7940, 35.0150);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Premier League Final', 1, N'The most awaited football finale of the season.', '2025-07-10 19:00:00', '2025-07-10 21:30:00', 422, 53, 1, 6, 1, 17, 'Male', 'default_event.png');

-- Location 54
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Downtown Trail', 31.7700, 35.2200);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Downtown Run', 0, N'Run through the heart of Jerusalem.', '2025-07-05 06:30:00', '2025-07-05 09:30:00', 499, 54, 3, 160, 1, 15, 'Male', 'default_event.png');

-- Location 55
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Victory Park', 32.8070, 35.0010);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Late Night Sprint', 0, N'Nighttime speed challenge.', '2025-07-20 21:00:00', '2025-07-20 22:30:00', 422, 55, 3, 120, 1, 18, 'Mixed', 'default_event.png');

-- Location 56
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Urban Arena', 32.7990, 35.0210);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Weekend Football Clash', 1, N'Weekend showdown for local football teams.', '2025-08-01 16:00:00', '2025-08-01 19:00:00', 422, 56, 1, 8, 1, 16, 'Male', 'default_event.png');

-- Location 57
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera City Hall Court', 32.4365, 34.9134);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Female Football Fest', 1, N'All-girl football tournament.', '2025-08-05 15:00:00', '2025-08-05 18:00:00', 415, 57, 1, 6, 1, 14, 'Female', 'default_event.png');

-- Location 58
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Gold Gym', 31.7740, 35.2155);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Hoops Battle', 1, N'Competitive basketball event for rising stars.', '2025-08-10 17:30:00', '2025-08-10 20:30:00', 499, 58, 2, 8, 1, 17, 'Mixed', 'default_event.png');

-- Location 59
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Mountain Path', 32.8065, 35.0065);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Mountain Run', 0, N'Mountain trail challenge for seasoned runners.', '2025-08-12 07:00:00', '2025-08-12 11:00:00', 422, 59, 3, 220, 1, 18, 'Mixed', 'default_event.png');

-- Location 60
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera School Field', 32.4425, 34.9090);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Girls Marathon', 0, N'An all-female run for students and locals.', '2025-08-15 07:30:00', '2025-08-15 10:30:00', 415, 60, 3, 130, 1, 13, 'Female', 'default_event.png');

-- Location 61
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Old City Loop', 31.7785, 35.2255);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Old City Historic Run', 0, N'Run through Jerusalem''s ancient paths.', '2025-08-20 06:00:00', '2025-08-20 08:30:00', 499, 61, 3, 140, 1, 16, 'Male', 'default_event.png');

-- Location 62
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Open Field', 32.8123, 35.0099);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Under 18 Football Cup', 1, N'Football competition for under-18 teams.', '2025-08-25 16:00:00', '2025-08-25 19:00:00', 422, 62, 1, 6, 0, 15, 'Mixed', 'default_event.png');

-- Location 63
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera River Path', 32.4389, 34.9111);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Sunrise Dash', 0, N'Short marathon at dawn.', '2025-08-28 05:30:00', '2025-08-28 07:30:00', 415, 63, 3, 90, 1, 14, 'Female', 'default_event.png');

-- Location 64
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem High School Court', 31.7722, 35.2211);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Youth Basketball', 1, N'Tournament for young basketball teams.', '2025-09-01 16:00:00', '2025-09-01 19:00:00', 499, 64, 2, 4, 1, 14, 'Male', 'default_event.png');

-- Location 65
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Marathon Boulevard', 32.8100, 35.0130);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Boulevard Run', 0, N'Run on the most scenic road in Haifa.', '2025-09-05 06:00:00', '2025-09-05 09:00:00', 422, 65, 3, 200, 1, 17, 'Mixed', 'default_event.png');

-- Location 66
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Unity Stadium', 31.7760, 35.2205);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem United Football', 1, N'A unique football collaboration between schools.', '2025-09-10 16:00:00', '2025-09-10 18:30:00', 499, 66, 1, 8, 1, 16, 'Male', 'default_event.png');

-- Location 67
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera Forest Track', 32.4440, 34.9122);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Fall Forest Run', 0, N'Peaceful run through Hadera''s forest.', '2025-09-15 07:00:00', '2025-09-15 10:00:00', 415, 67, 3, 110, 1, 15, 'Female', 'default_event.png');

-- Location 68
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa High Hills', 32.8088, 35.0180);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Champions League', 1, N'Top-tier football event in Haifa.', '2025-09-20 18:00:00', '2025-09-20 21:00:00', 422, 68, 1, 10, 0, 18, 'Male', 'default_event.png');

-- Location 69
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Hadera East Ground', 32.4455, 34.9105);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Hadera Local Football Show', 1, N'Football for community awareness.', '2025-09-30 15:00:00', '2025-09-30 18:00:00', 415, 69, 1, 6, 0, 14, 'Female', 'default_event.png');

-- Location 70
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Jerusalem Training Camp', 31.7733, 35.2188);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxTeams, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Jerusalem Elite Basketball', 1, N'Invite-only basketball showdown.', '2025-10-03 16:00:00', '2025-10-03 19:00:00', 499, 70, 2, 4, 0, 18, 'Male', 'default_event.png');

-- Location 71
INSERT INTO EventLocations (LocationName, Latitude, Longitude)
VALUES (N'Haifa Coastal Road', 32.8177, 35.0055);
INSERT INTO Events (EventName, RequiresTeams, Description, StartDatetime, EndDatetime, CityId, LocationId, SportId, MaxParticipants, IsPublic, MinAge, Gender, ProfileImage)
VALUES (N'Haifa Speed Trial', 0, N'Flat speed trial for pro runners.', '2025-10-06 07:00:00', '2025-10-06 08:30:00', 422, 71, 3, 90, 1, 17, 'Mixed', 'default_event.png'); 
