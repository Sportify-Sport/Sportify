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
