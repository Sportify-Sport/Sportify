using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using System.Text;
using Backend.BL;
using System.Data.Common;
using System.Net;
using Microsoft.AspNetCore.Identity;
using Backend.Models;
using System.Reflection;

public class DBservices
{

    public DBservices() { }

    //--------------------------------------------------------------------------------------------------
    // This method creates a connection to the database according to the connectionString name in the web.config 
    //--------------------------------------------------------------------------------------------------
    public SqlConnection connect(String conString)
    {

        // read the connection string from the configuration file
        IConfigurationRoot configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json").Build();
        string cStr = configuration.GetConnectionString("myProjDB");
        SqlConnection con = new SqlConnection(cStr);
        con.Open();
        return con;
    }

    //--------------------------------------------------------------------------------------------------
    // This method checks if an email is already registered in the database
    //--------------------------------------------------------------------------------------------------
    public bool IsEmailRegistered(string email)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureIsEmailRegistered("SP_IsEmailRegistered", con, email);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["IsRegistered"]);
            }
            else
            {
                return false;
            }
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand using a stored procedure for email registration check
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsEmailRegistered(string spName, SqlConnection con, string email)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@email", email);

        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method inserts a new user into the database and returns the generated UserID
    //--------------------------------------------------------------------------------------------------
    public int InsertUser(RegisterDto registerDto, string hashedPassword)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureInsertUser("SP_InsertUser", con, registerDto, hashedPassword);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["UserId"]); ;
            }
            else
            {
                return 0;
            }
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand using a stored procedure for user insertion
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureInsertUser(string spName, SqlConnection con, RegisterDto registerDto, string hashedPassword)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;          // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@FirstName", registerDto.FirstName);
        cmd.Parameters.AddWithValue("@LastName", registerDto.LastName);
        cmd.Parameters.AddWithValue("@BirthDate", registerDto.BirthDate);
        cmd.Parameters.AddWithValue("@Email", registerDto.Email);
        cmd.Parameters.AddWithValue("@PasswordHash", hashedPassword);
        cmd.Parameters.AddWithValue("@FavSportID", registerDto.FavSportId);
        cmd.Parameters.AddWithValue("@CityID", registerDto.CityId);
        cmd.Parameters.AddWithValue("@Gender", registerDto.Gender);
        cmd.Parameters.AddWithValue("@ProfileImage", "default_profile.png");

        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method validates user credentials and performs login operation
    //--------------------------------------------------------------------------------------------------
    public User LoginUser(string email, string password)
    {
        SqlConnection con;
        SqlCommand cmd;
        User user = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetUserByEmail("SP_GetUserByEmail", con, email);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                string hashedPassword = dataReader["PasswordHash"].ToString();

                // Verify the password
                if (BCrypt.Net.BCrypt.Verify(password, hashedPassword))
                {
                    user = new User
                    {
                        UserId = Convert.ToInt32(dataReader["UserId"]),
                        FirstName = dataReader["FirstName"].ToString(),
                        LastName = dataReader["LastName"].ToString(),
                        Email = dataReader["Email"].ToString(),
                        IsGroupAdmin = Convert.ToBoolean(dataReader["IsGroupAdmin"]),
                        IsCityOrganizer = Convert.ToBoolean(dataReader["IsCityOrganizer"])
                        //IsGroupAdmin = false,
                        //IsCityOrganizer = false,
                        //AdminForGroups = new List<int>(),
                        //OrganizerForCities = new List<int>()
                    };
                }
            }
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }

        if (user == null)
        {
            return null;
        }

        // Check if user is group admin and get admin groups
        //GetUserAdminGroups(user);

        // Check if user is city organizer and get organizer cities
        //GetUserOrganizerCities(user);

        return user;
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand to get user by email for login validation
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserByEmail(string spName, SqlConnection con, string email)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Email", email);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves all groups where the user is an admin
    //--------------------------------------------------------------------------------------------------
    private void GetUserAdminGroups(User user)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetAdminGroups("SP_GetAdminGroups", con, user.UserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                user.AdminForGroups.Add(Convert.ToInt32(dataReader["GroupId"]));
            }

            // Set IsGroupAdmin flag based on whether user has any admin groups
            user.IsGroupAdmin = user.AdminForGroups.Count > 0;
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand to retrieve all groups where user has admin privileges
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetAdminGroups(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves all cities where the user is an organizer
    //--------------------------------------------------------------------------------------------------
    private void GetUserOrganizerCities(User user)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetOrganizerCities("SP_GetOrganizerCities", con, user.UserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                user.OrganizerForCities.Add(Convert.ToInt32(dataReader["CityId"]));
            }

            // Set IsCityOrganizer flag based on whether user has any organizer cities
            user.IsCityOrganizer = user.OrganizerForCities.Count > 0;
        }
        catch (Exception ex)
        {
            // Write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand to retrieve all cities where user is designated organizer
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetOrganizerCities(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method retrieves all sports from the database
    //--------------------------------------------------------------------------------------------------
    public List<Sport> GetAllSports()
    {
        SqlConnection con;
        SqlCommand cmd;
        List<Sport> sportsList = new List<Sport>();

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetAllSports("SP_GetAllSports", con);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Sport sport = new Sport(
                    Convert.ToInt32(dataReader["SportId"]),
                    dataReader["SportName"].ToString(),
                    dataReader["SportImage"].ToString()
                );

                sportsList.Add(sport);
            }

            return sportsList;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting all sports 
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetAllSports(string spName, SqlConnection con)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;          // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        return cmd;
    }



    //--------------------------------------------------------------------------------------------------
    // This method retrieves 4 Groups that the user joined to
    //--------------------------------------------------------------------------------------------------
    public List<object> GetTop4UserGroups(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;


        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetTop4UserGroups("SP_GetTop4UserGroups", con, userId);

        List<object> groupsList = new List<object>();

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                groupsList.Add(new
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    GroupImage = dataReader["GroupImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    SportId = Convert.ToInt32(dataReader["SportId"])
                });
            }

            return groupsList;
        }
        catch (Exception ex)
        {
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }


    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting 4 groups for the user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetTop4UserGroups(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves a user's profile data without the password
    //--------------------------------------------------------------------------------------------------
    public object GetUserProfile(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetUserProfile("SP_GetUserProfile", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return new
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    BirthDate = Convert.ToDateTime(dataReader["BirthDate"]),
                    Email = dataReader["Email"].ToString(),
                    FavSportId = Convert.ToInt32(dataReader["FavSportId"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Bio = dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString()
                };
            }
            else
            {
                return null;
            }
        }
        catch (Exception ex)
        {
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting user profile data
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserProfile(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method retrieves the current profile image file name for a user
    //--------------------------------------------------------------------------------------------------
    public string GetUserProfileImage(int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = new SqlCommand("SELECT ProfileImage FROM Users WHERE UserId = @userId", con);
            cmd.Parameters.AddWithValue("@userId", userId);

            object result = cmd.ExecuteScalar();
            return result == DBNull.Value ? null : (string)result;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    ////---------------------------------------------------------------------------------
    //// This method updates a user's profile information 
    ////---------------------------------------------------------------------------------
    //public bool UpdateUserProfile(int userId, UserUpdateModel model, string imageFileName)
    //{
    //    SqlConnection con = null;

    //    try
    //    {
    //        con = connect("myProjDB");
    //        SqlCommand cmd = CreateCommandWithStoredProcedureUpdateUserProfile("SP_UpdateUserProfile", con, userId, model, imageFileName);

    //        int rowsAffected = cmd.ExecuteNonQuery();

    //        return rowsAffected > 0;
    //    }
    //    catch (Exception ex)
    //    {
    //        throw ex;
    //    }
    //    finally
    //    {
    //        if (con != null && con.State == ConnectionState.Open)
    //        {
    //            con.Close();
    //        }
    //    }
    //}

    ////---------------------------------------------------------------------------------
    //// Create the SqlCommand for updating user profile data
    ////---------------------------------------------------------------------------------
    //private SqlCommand CreateCommandWithStoredProcedureUpdateUserProfile(string spName, SqlConnection con, int userId, UserUpdateModel model, string imageFileName)
    //{
    //    SqlCommand cmd = new SqlCommand();
    //    cmd.Connection = con;
    //    cmd.CommandText = spName;
    //    cmd.CommandTimeout = 10;
    //    cmd.CommandType = System.Data.CommandType.StoredProcedure;

    //    cmd.Parameters.AddWithValue("@userId", userId);
    //    cmd.Parameters.AddWithValue("@birthDate", model.BirthDate);
    //    cmd.Parameters.AddWithValue("@favSportId", model.FavSportId);
    //    cmd.Parameters.AddWithValue("@cityId", model.CityId);
    //    cmd.Parameters.AddWithValue("@bio", string.IsNullOrEmpty(model.Bio) ? (object)DBNull.Value : model.Bio);
    //    cmd.Parameters.AddWithValue("@gender", model.Gender);

    //    // Only update image if a new one was provided
    //    if (!string.IsNullOrEmpty(imageFileName))
    //    {
    //        cmd.Parameters.AddWithValue("@profileImage", imageFileName);
    //    }
    //    else
    //    {
    //        cmd.Parameters.AddWithValue("@profileImage", DBNull.Value);
    //    }

    //    return cmd;
    //}



    //---------------------------------------------------------------------------------
    // This method updates only user profile details (without image)
    //---------------------------------------------------------------------------------
    public bool UpdateUserDetails(int userId, UserUpdateModel model)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUpdateUserDetails("SP_UpdateUserDetails", con, userId, model);

            int rowsAffected = cmd.ExecuteNonQuery();

            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null && con.State == ConnectionState.Open)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for updating user profile details
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateUserDetails(string spName, SqlConnection con, int userId, UserUpdateModel model)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@birthDate", model.BirthDate);
        cmd.Parameters.AddWithValue("@favSportId", model.FavSportId);
        cmd.Parameters.AddWithValue("@cityId", model.CityId);
        cmd.Parameters.AddWithValue("@bio", string.IsNullOrEmpty(model.Bio) ? (object)DBNull.Value : model.Bio);
        cmd.Parameters.AddWithValue("@gender", model.Gender);

        return cmd;
    }










    //---------------------------------------------------------------------------------
    // This method updates only the user profile image
    //---------------------------------------------------------------------------------
    public bool UpdateProfileImage(int userId, string imageFileName)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUpdateProfileImage("SP_UpdateProfileImage", con, userId, imageFileName);

            int rowsAffected = cmd.ExecuteNonQuery();

            return rowsAffected > 0;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null && con.State == ConnectionState.Open)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for updating user profile image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateProfileImage(string spName, SqlConnection con, int userId, string imageFileName)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@userId", userId);

        // Only update image if a new one was provided
        if (!string.IsNullOrEmpty(imageFileName))
        {
            cmd.Parameters.AddWithValue("@profileImage", imageFileName);
        }
        else
        {
            cmd.Parameters.AddWithValue("@profileImage", DBNull.Value);
        }

        return cmd;
    }









    ////--------------------------------------------------------------------------------------------------
    //// This method retrieves complete information for a specific group
    ////--------------------------------------------------------------------------------------------------
    //public Group GetGroupDetails(int groupId)
    //{
    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB");
    //    }
    //    catch (Exception ex)
    //    {
    //        throw (ex);
    //    }

    //    cmd = CreateCommandWithStoredProcedureGetGroupDetails("SP_GetGroupDetails", con, groupId);

    //    try
    //    {
    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        if (dataReader.Read())
    //        {
    //            string groupImage = dataReader["GroupImage"] == DBNull.Value || string.IsNullOrEmpty(dataReader["GroupImage"].ToString())
    //            ? "default_group.png"
    //            : dataReader["GroupImage"].ToString();

    //            Group group = new Group(
    //                Convert.ToInt32(dataReader["GroupId"]),
    //                dataReader["GroupName"].ToString(),
    //                dataReader["Description"].ToString(),
    //                Convert.ToInt32(dataReader["SportId"]),
    //                groupImage,
    //                Convert.ToInt32(dataReader["CityId"]),
    //                Convert.ToDateTime(dataReader["FoundedAt"]),
    //                Convert.ToInt32(dataReader["MaxMemNum"]),
    //                Convert.ToInt32(dataReader["TotalMembers"]),
    //                Convert.ToInt32(dataReader["MinAge"]),
    //                dataReader["Gender"].ToString(),
    //                Convert.ToInt32(dataReader["Matches"]),
    //                Convert.ToInt32(dataReader["Wins"]),
    //                Convert.ToInt32(dataReader["Loses"])
    //            );

    //            return group;
    //        }
    //        else
    //        {
    //            return null;
    //        }
    //    }
    //    catch (Exception ex)
    //    {
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            con.Close();
    //        }
    //    }
    //}

    ////---------------------------------------------------------------------------------
    //// Create the SqlCommand for retrieving group details
    ////---------------------------------------------------------------------------------
    //private SqlCommand CreateCommandWithStoredProcedureGetGroupDetails(string spName, SqlConnection con, int groupId)
    //{
    //    SqlCommand cmd = new SqlCommand();
    //    cmd.Connection = con;
    //    cmd.CommandText = spName;
    //    cmd.CommandTimeout = 10;
    //    cmd.CommandType = System.Data.CommandType.StoredProcedure;
    //    cmd.Parameters.AddWithValue("@groupId", groupId);
    //    return cmd;
    //}

    //--------------------------------------------------------------------------------------------------
    // This method retrieves all groups that the user has joined
    //--------------------------------------------------------------------------------------------------
    public List<object> GetAllUserGroups(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetAllUserGroups("SP_GetAllUserGroups", con, userId);

        List<object> groupsList = new List<object>();

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                groupsList.Add(new
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    GroupImage = dataReader["GroupImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    SportId = Convert.ToInt32(dataReader["SportId"])
                });
            }

            return groupsList;
        }
        catch (Exception ex)
        {
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting all groups for the user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetAllUserGroups(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    ////--------------------------------------------------------------------------------------------------
    //// This method retrieves details for a specific event
    ////--------------------------------------------------------------------------------------------------
    //public Event GetEventDetails(int eventId)
    //{
    //    SqlConnection con = null;

    //    try
    //    {
    //        con = connect("myProjDB");
    //        SqlCommand cmd = CreateCommandWithStoredProcedureEventDetails("SP_GetEventDetails", con, eventId);

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        if (dataReader.Read())
    //        {
    //            Event eventDetails = new Event();

    //            eventDetails.EventId = Convert.ToInt32(dataReader["EventId"]);
    //            eventDetails.EventName = dataReader["EventName"].ToString();
    //            eventDetails.RequiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]);
    //            eventDetails.StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]);
    //            eventDetails.EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]);
    //            eventDetails.CityId = Convert.ToInt32(dataReader["CityId"]);
    //            eventDetails.LocationId = dataReader["LocationId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["LocationId"]);
    //            eventDetails.SportId = Convert.ToInt32(dataReader["SportId"]);
    //            eventDetails.MaxTeams = dataReader["MaxTeams"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxTeams"]);
    //            eventDetails.CreatedAt = Convert.ToDateTime(dataReader["CreatedAt"]);
    //            eventDetails.IsPublic = Convert.ToBoolean(dataReader["IsPublic"]);
    //            eventDetails.WinnerId = dataReader["WinnerId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["WinnerId"]);
    //            eventDetails.WaxParticipants = dataReader["MaxParticipants"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxParticipants"]);
    //            eventDetails.MinAge = Convert.ToInt32(dataReader["MinAge"]);
    //            eventDetails.Gender = dataReader["Gender"].ToString();
    //            eventDetails.ParticipantsNum = Convert.ToInt32(dataReader["ParticipantsNum"]);
    //            eventDetails.TeamsNum = Convert.ToInt32(dataReader["TeamsNum"]);
    //            eventDetails.ProfileImage = dataReader["ProfileImage"].ToString();
    //            eventDetails.LocationName = dataReader["LocationName"].ToString();
    //            eventDetails.Latitude = dataReader["Latitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Latitude"]);
    //            eventDetails.Longitude = dataReader["Longitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Longitude"]);

    //            return eventDetails;
    //        }

    //        return null;
    //    }
    //    catch (Exception ex)
    //    {
    //        throw ex;
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            con.Close();
    //        }
    //    }
    //}

    ////---------------------------------------------------------------------------------
    //// Create the SqlCommand for getting event details
    ////---------------------------------------------------------------------------------
    //private SqlCommand CreateCommandWithStoredProcedureEventDetails(string spName, SqlConnection con, int eventId)
    //{
    //    SqlCommand cmd = new SqlCommand();
    //    cmd.Connection = con;
    //    cmd.CommandText = spName;
    //    cmd.CommandTimeout = 10;
    //    cmd.CommandType = System.Data.CommandType.StoredProcedure;
    //    cmd.Parameters.AddWithValue("@eventId", eventId);
    //    return cmd;
    //}


    //--------------------------------------------------------------------------------------------------
    // This method checks if a user is an admin for a specific group
    //--------------------------------------------------------------------------------------------------
    public bool IsUserGroupAdmin(int userId, int groupId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureIsUserGroupAdmin("SP_IsUserGroupAdmin", con, userId, groupId);

            // Returns the first column of the first row
            object result = cmd.ExecuteScalar();

            // If result is 1, user is admin; if 0, user is not admin
            return result != null && Convert.ToInt32(result) == 1;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for checking if user is a group admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsUserGroupAdmin(string spName, SqlConnection con, int userId, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@groupId", groupId);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves random upcoming public events
    //--------------------------------------------------------------------------------------------------
    public object GetRandomEvents(int count)
    {
        SqlConnection con = null;
        List<object> randomEventsList = new List<object>();

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureRandomEvents("SP_GetRandomEvents", con, count);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var eventPreview = new
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString()
                };

                randomEventsList.Add(eventPreview);
            }

            return randomEventsList;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting random events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRandomEvents(string spName, SqlConnection con, int count)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@count", count);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves events a user is registered for
    //--------------------------------------------------------------------------------------------------
    public object GetUserEvents(int userId, int limit)
    {
        SqlConnection con = null;
        List<object> userEventsList = new List<object>();

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUserEvents("SP_GetUserEvents", con, userId, limit);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var eventInfo = new
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    EventImage = dataReader["ProfileImage"].ToString(),
                    PlayWatch = dataReader["PlayWatch"] != DBNull.Value ? Convert.ToBoolean(dataReader["PlayWatch"]) : true
                };

                userEventsList.Add(eventInfo);
            }

            return userEventsList;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting user events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUserEvents(string spName, SqlConnection con, int userId, int limit)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@limit", limit);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves paginated events a user is registered for
    //--------------------------------------------------------------------------------------------------
    public (List<object> Events, bool HasMore) GetUserEventsPaginated(
        int userId,
        DateTime? lastEventDate,
        int? lastEventId,
        int pageSize)
    {
        SqlConnection con = null;
        List<object> userEventsList = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUserEventsPaginated(
                "SP_GetUserEventsPaginated", con, userId, lastEventDate, lastEventId, pageSize + 1); // Request one extra to check for more

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            int count = 0;

            while (dataReader.Read())
            {
                count++;

                // Skip the last item if we got more than requested
                if (count <= pageSize)
                {
                    var eventInfo = new
                    {
                        EventId = Convert.ToInt32(dataReader["EventId"]),
                        EventName = dataReader["EventName"].ToString(),
                        StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                        SportId = Convert.ToInt32(dataReader["SportId"]),
                        EventImage = dataReader["ProfileImage"].ToString(),
                        PlayWatch = dataReader["PlayWatch"] != DBNull.Value ? Convert.ToBoolean(dataReader["PlayWatch"]) : true
                    };

                    userEventsList.Add(eventInfo);
                }
            }

            // If we got more items than requested, there are more pages
            hasMore = count > pageSize;

            return (userEventsList, hasMore);
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting paginated user events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUserEventsPaginated(
        string spName,
        SqlConnection con,
        int userId,
        DateTime? lastEventDate,
        int? lastEventId,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        if (lastEventDate.HasValue)
            cmd.Parameters.AddWithValue("@lastEventDate", lastEventDate.Value);
        else
            cmd.Parameters.AddWithValue("@lastEventDate", DBNull.Value);

        if (lastEventId.HasValue)
            cmd.Parameters.AddWithValue("@lastEventId", lastEventId.Value);
        else
            cmd.Parameters.AddWithValue("@lastEventId", DBNull.Value);

        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method retrieves paginated groups
    //--------------------------------------------------------------------------------------------------
    public (List<object> Groups, bool HasMore) GetGroupsPaginated(int? lastGroupId, int pageSize)
    {
        SqlConnection con = null;
        List<object> groupsList = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGroupsPaginated(
                "SP_GetGroupsPaginated", con, lastGroupId, pageSize + 1); // Request one extra to check for more

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            int count = 0;

            while (dataReader.Read())
            {
                count++;

                // Skip the last item if we got more than requested
                if (count <= pageSize)
                {
                    var groupInfo = new
                    {
                        GroupId = Convert.ToInt32(dataReader["GroupId"]),
                        GroupName = dataReader["GroupName"].ToString(),
                        GroupImage = dataReader["GroupImage"].ToString(),
                        CityId = Convert.ToInt32(dataReader["CityId"]),
                        SportId = Convert.ToInt32(dataReader["SportId"]),
                        Gender = dataReader["Gender"].ToString()
                    };

                    groupsList.Add(groupInfo);
                }
            }

            // If we got more items than requested, there are more pages
            hasMore = count > pageSize;

            return (groupsList, hasMore);
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting paginated groups
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGroupsPaginated(
        string spName,
        SqlConnection con,
        int? lastGroupId,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        if (lastGroupId.HasValue)
            cmd.Parameters.AddWithValue("@lastGroupId", lastGroupId.Value);
        else
            cmd.Parameters.AddWithValue("@lastGroupId", DBNull.Value);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves paginated events
    //--------------------------------------------------------------------------------------------------
    public (List<object> Events, bool HasMore) GetEventsPaginated(
        DateTime? lastEventDate,
        int? lastEventId,
        int pageSize)
    {
        SqlConnection con = null;
        List<object> eventsList = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureEventsPaginated(
                "SP_GetEventsPaginated", con, lastEventDate, lastEventId, pageSize + 1); // Request one extra to check for more

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            int count = 0;

            while (dataReader.Read())
            {
                count++;

                // Skip the last item if we got more than requested
                if (count <= pageSize)
                {
                    var eventInfo = new
                    {
                        EventId = Convert.ToInt32(dataReader["EventId"]),
                        EventName = dataReader["EventName"].ToString(),
                        StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                        EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                        SportId = Convert.ToInt32(dataReader["SportId"]),
                        ProfileImage = dataReader["ProfileImage"].ToString(),
                        CityId = Convert.ToInt32(dataReader["CityId"]),
                    };

                    eventsList.Add(eventInfo);
                }
            }

            // If we got more items than requested, there are more pages
            hasMore = count > pageSize;

            return (eventsList, hasMore);
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting paginated events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureEventsPaginated(string spName, SqlConnection con, DateTime? lastEventDate, int? lastEventId, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        if (lastEventDate.HasValue)
            cmd.Parameters.AddWithValue("@lastEventDate", lastEventDate.Value);
        else
            cmd.Parameters.AddWithValue("@lastEventDate", DBNull.Value);

        if (lastEventId.HasValue)
            cmd.Parameters.AddWithValue("@lastEventId", lastEventId.Value);
        else
            cmd.Parameters.AddWithValue("@lastEventId", DBNull.Value);

        return cmd;
    }


    //--------------------------------------------------------------------------------------------------
    // This method retrieves group details with optional user membership status
    //--------------------------------------------------------------------------------------------------
    public object GetGroupDetailsWithMembershipStatus(int groupId, int? userId = null)
    {
        SqlConnection con = null;
        object groupDetails = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGroupDetails(
                "SP_GetGroupDetailsWithMembershipStatus", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                string groupImage = dataReader["GroupImage"] == DBNull.Value || string.IsNullOrEmpty(dataReader["GroupImage"].ToString())
                    ? "default_group.png"
                    : dataReader["GroupImage"].ToString();

                bool isMember = userId.HasValue && Convert.ToBoolean(dataReader["IsMember"]);
                bool isAdmin = userId.HasValue && Convert.ToBoolean(dataReader["IsAdmin"]);

                groupDetails = new
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    Description = dataReader["Description"].ToString(),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    GroupImage = groupImage,
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    FoundedAt = Convert.ToDateTime(dataReader["FoundedAt"]),
                    MaxMemNum = Convert.ToInt32(dataReader["MaxMemNum"]),
                    TotalMembers = Convert.ToInt32(dataReader["TotalMembers"]),
                    MinAge = Convert.ToInt32(dataReader["MinAge"]),
                    Gender = dataReader["Gender"].ToString(),
                    Matches = Convert.ToInt32(dataReader["Matches"]),
                    Wins = Convert.ToInt32(dataReader["Wins"]),
                    Loses = Convert.ToInt32(dataReader["Loses"]),
                    IsMember = isMember,
                    IsAdmin = isAdmin
                };
            }

            return groupDetails;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for retrieving group details with membership status
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGroupDetails(
        string spName,
        SqlConnection con,
        int groupId,
        int? userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@groupId", groupId);

        if (userId.HasValue)
            cmd.Parameters.AddWithValue("@userId", userId.Value);
        else
            cmd.Parameters.AddWithValue("@userId", DBNull.Value);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method retrieves details for a specific event with user participation status
    //--------------------------------------------------------------------------------------------------
    public object GetEventDetailsWithParticipationStatus(int eventId, int? userId = null)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureEventDetails("SP_GetEventDetailsWithParticipationStatus", con, eventId, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                var eventDetails = new
                {
                    // Basic event details for all users
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    RequiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]),
                    Description = dataReader["Description"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    LocationId = dataReader["LocationId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["LocationId"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    MaxTeams = dataReader["MaxTeams"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxTeams"]),
                    CreatedAt = Convert.ToDateTime(dataReader["CreatedAt"]),
                    IsPublic = Convert.ToBoolean(dataReader["IsPublic"]),
                    WinnerId = dataReader["WinnerId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["WinnerId"]),
                    MaxParticipants = dataReader["MaxParticipants"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxParticipants"]),
                    MinAge = Convert.ToInt32(dataReader["MinAge"]),
                    Gender = dataReader["Gender"].ToString(),
                    ParticipantsNum = Convert.ToInt32(dataReader["ParticipantsNum"]),
                    TeamsNum = Convert.ToInt32(dataReader["TeamsNum"]),
                    EventImage = dataReader["ProfileImage"].ToString(),

                    // Location information
                    LocationName = dataReader["LocationName"] == DBNull.Value ? null : dataReader["LocationName"].ToString(),
                    Latitude = dataReader["Latitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Latitude"]),
                    Longitude = dataReader["Longitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Longitude"]),

                    // User participation information (only for authenticated users)
                    IsParticipant = userId.HasValue && Convert.ToBoolean(dataReader["IsParticipant"]),
                    IsGroupParticipant = userId.HasValue && Convert.ToBoolean(dataReader["IsGroupParticipant"]),
                    PlayWatch = userId.HasValue && dataReader["PlayWatch"] != DBNull.Value ? (bool?)Convert.ToBoolean(dataReader["PlayWatch"]) : null,
                    IsAdmin = userId.HasValue && Convert.ToBoolean(dataReader["IsAdmin"])
                };

                return eventDetails;
            }

            return null;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting event details with participation status
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureEventDetails(
        string spName,
        SqlConnection con,
        int eventId,
        int? userId = null)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // the stored procedure name

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command

        cmd.Parameters.AddWithValue("@eventId", eventId);

        if (userId.HasValue)
            cmd.Parameters.AddWithValue("@userId", userId.Value);
        else
            cmd.Parameters.AddWithValue("@userId", DBNull.Value);

        return cmd;
    }
}