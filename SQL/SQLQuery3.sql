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