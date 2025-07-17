using Backend.BL;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Text;
using System.Web;

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
    // This method logs in user and returns the complete user object
    //--------------------------------------------------------------------------------------------------
    public User LoginUser(string email, string password)
    {
        DBservices dbServices = new DBservices();
        var user = dbServices.GetUserByEmail(email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
        }

        return user;
    }

    //--------------------------------------------------------------------------------------------------
    // This method gets user some user details by email 
    //--------------------------------------------------------------------------------------------------
    public User GetUserByEmail(string email)
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

        cmd = CreateCommandWithStoredProcedureGetUserByEmail("SP_GetUserByEmail", con, email);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return new User
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    PasswordHash = dataReader["PasswordHash"].ToString(),
                    IsGroupAdmin = Convert.ToBoolean(dataReader["IsGroupAdmin"]),
                    IsCityOrganizer = Convert.ToBoolean(dataReader["IsCityOrganizer"]),
                    IsEventAdmin = Convert.ToBoolean(dataReader["IsEventAdmin"]),
                    IsEmailVerified = Convert.ToBoolean(dataReader["IsEmailVerified"]),
                    IsSuperAdmin = Convert.ToBoolean(dataReader["IsSuperAdmin"])
                };
            }
            else
            {
                return null;
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
    // Create the SqlCommand using a stored procedure for getting user by email
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserByEmail(string spName, SqlConnection con, string email)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

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
    //    cmd.Parameters.AddWithValue("@firstName", model.FirstName);
    //    cmd.Parameters.AddWithValue("@lastName", model.LastName);
    //    cmd.Parameters.AddWithValue("@favSportId", model.FavSportId);
    //    cmd.Parameters.AddWithValue("@cityId", model.CityId);
    //    cmd.Parameters.AddWithValue("@bio", string.IsNullOrEmpty(model.Bio) ? (object)DBNull.Value : model.Bio);

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
        cmd.Parameters.AddWithValue("@firstName", model.FirstName);
        cmd.Parameters.AddWithValue("@lastName", model.LastName);
        cmd.Parameters.AddWithValue("@favSportId", model.FavSportId);
        cmd.Parameters.AddWithValue("@cityId", model.CityId);
        cmd.Parameters.AddWithValue("@bio", string.IsNullOrEmpty(model.Bio) ? (object)DBNull.Value : model.Bio);
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
            cmd.Parameters.AddWithValue("@profileImage", "default_profile.png");
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

    //--------------------------------------------------------------------------------------------------
    // This method retrieves details for a specific event
    //--------------------------------------------------------------------------------------------------
    public Event GetEventDetailsWithoutStatus(int eventId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGetEventDetailsWithoutStatus("SP_GetEventDetails", con, eventId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                Event eventDetails = new Event();

                eventDetails.EventId = Convert.ToInt32(dataReader["EventId"]);
                eventDetails.EventName = dataReader["EventName"].ToString();
                eventDetails.RequiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]);
                eventDetails.StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]);
                eventDetails.EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]);
                eventDetails.CityId = Convert.ToInt32(dataReader["CityId"]);
                eventDetails.LocationId = dataReader["LocationId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["LocationId"]);
                eventDetails.SportId = Convert.ToInt32(dataReader["SportId"]);
                eventDetails.MaxTeams = dataReader["MaxTeams"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxTeams"]);
                eventDetails.CreatedAt = Convert.ToDateTime(dataReader["CreatedAt"]);
                eventDetails.IsPublic = Convert.ToBoolean(dataReader["IsPublic"]);
                eventDetails.WinnerId = dataReader["WinnerId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["WinnerId"]);
                eventDetails.MaxParticipants = dataReader["MaxParticipants"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxParticipants"]);
                eventDetails.MinAge = Convert.ToInt32(dataReader["MinAge"]);
                eventDetails.Gender = dataReader["Gender"].ToString();
                eventDetails.ParticipantsNum = Convert.ToInt32(dataReader["ParticipantsNum"]);
                eventDetails.TeamsNum = Convert.ToInt32(dataReader["TeamsNum"]);
                eventDetails.ProfileImage = dataReader["ProfileImage"].ToString();
                eventDetails.LocationName = dataReader["LocationName"].ToString();
                eventDetails.Latitude = dataReader["Latitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Latitude"]);
                eventDetails.Longitude = dataReader["Longitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Longitude"]);

                return eventDetails;
            }

            return null;
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
    // Create the SqlCommand for getting event details
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventDetailsWithoutStatus(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
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
    public (List<object> Events, bool HasMore) GetUserEventsPaginated(int userId, DateTime? lastEventDate, int? lastEventId, int pageSize)
    {
        SqlConnection con = null;
        List<object> userEventsList = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUserEventsPaginated("SP_GetUserEventsPaginated", con, userId, lastEventDate, lastEventId, pageSize + 1); // Request one extra to check for more

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            int count = 0;

            while (dataReader.Read())
            {
                count++;

                // Skip the last item if we got more than requested
                if (count <= pageSize)
                {
                    bool? playWatchValue = dataReader["PlayWatch"] != DBNull.Value ? (bool?)Convert.ToBoolean(dataReader["PlayWatch"]) : null;

                    var eventInfo = new
                    {
                        EventId = Convert.ToInt32(dataReader["EventId"]),
                        EventName = dataReader["EventName"].ToString(),
                        StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                        SportId = Convert.ToInt32(dataReader["SportId"]),
                        EventImage = dataReader["ProfileImage"].ToString(),
                        PlayWatch = playWatchValue
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
    private SqlCommand CreateCommandWithStoredProcedureUserEventsPaginated(string spName, SqlConnection con, int userId, DateTime? lastEventDate, int? lastEventId, int pageSize)
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
                bool hasPendingRequest = userId.HasValue && Convert.ToBoolean(dataReader["HasPendingRequest"]);

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
                    IsAdmin = isAdmin,
                    HasPendingRequest = hasPendingRequest
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
                // Check if we got an empty result set (access denied)
                if (dataReader["EventId"] == DBNull.Value)
                {
                    return null;
                }

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
                    ViewerCount = Convert.ToInt32(dataReader["ViewerCount"]),

                    // Location information
                    LocationName = dataReader["LocationName"] == DBNull.Value ? null : dataReader["LocationName"].ToString(),

                    // User participation information (only for authenticated users)
                    IsParticipant = userId.HasValue && Convert.ToBoolean(dataReader["IsParticipant"]),
                    PlayWatch = userId.HasValue && dataReader["PlayWatch"] != DBNull.Value ? (bool?)Convert.ToBoolean(dataReader["PlayWatch"]) : null,
                    IsAdmin = userId.HasValue && Convert.ToBoolean(dataReader["IsAdmin"]),
                    HasPendingRequest = userId.HasValue && Convert.ToBoolean(dataReader["HasPendingRequest"])
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


    //--------------------------------------------------------------------------------------------------
    // This method submits a group join request
    //--------------------------------------------------------------------------------------------------
    public string SubmitGroupJoinRequest(int groupId, int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGroupJoinRequest("SP_SubmitGroupJoinRequest", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return dataReader["Result"].ToString();
            }

            return "Error";
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
    // Create the SqlCommand for group join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGroupJoinRequest(
        string spName, SqlConnection con, int groupId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }


    //---------------------------------------------------------------------------------
    // Method for searching groups with infinity scroll
    //---------------------------------------------------------------------------------
    public (List<object>, bool) SearchGroups(
        string name = null,
        int? sportId = null,
        int? cityId = null,
        int? minAge = null,
        int? maxAge = null,
        string gender = null,
        int page = 1,
        int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> groups = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureSearchGroups("SP_SearchGroups", con, name, sportId, cityId, minAge, maxAge, gender, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var group = new
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    GroupImage = dataReader["GroupImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    Gender = dataReader["Gender"].ToString()
                };

                groups.Add(group);
            }

            if (groups.Count > pageSize)
            {
                hasMore = true;
                groups.RemoveAt(groups.Count - 1);
            }

            return (groups, hasMore);
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
    // Method for searching events with infinity scroll
    //---------------------------------------------------------------------------------
    public (List<object>, bool) SearchEvents(
        string name = null,
        int? sportId = null,
        int? cityId = null,
        int? minAge = null,
        int? maxAge = null,
        string gender = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> events = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureSearchEvents("SP_SearchEvents", con, name, sportId, cityId, minAge, maxAge, gender, startDate, endDate, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var eventItem = new
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"])
                };

                events.Add(eventItem);
            }

            if (events.Count > pageSize)
            {
                hasMore = true;
                events.RemoveAt(events.Count - 1);
            }

            return (events, hasMore);
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
    // Create the SqlCommand for group search
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSearchGroups(
        string spName,
        SqlConnection con,
        string name,
        int? sportId,
        int? cityId,
        int? minAge,
        int? maxAge,
        string gender,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        // Add parameters
        if (!string.IsNullOrEmpty(name))
            cmd.Parameters.AddWithValue("@name", name);
        else
            cmd.Parameters.AddWithValue("@name", DBNull.Value);

        if (sportId.HasValue)
            cmd.Parameters.AddWithValue("@sportId", sportId.Value);
        else
            cmd.Parameters.AddWithValue("@sportId", DBNull.Value);

        if (cityId.HasValue)
            cmd.Parameters.AddWithValue("@cityId", cityId.Value);
        else
            cmd.Parameters.AddWithValue("@cityId", DBNull.Value);

        if (minAge.HasValue)
            cmd.Parameters.AddWithValue("@minAge", minAge.Value);
        else
            cmd.Parameters.AddWithValue("@minAge", DBNull.Value);

        if (maxAge.HasValue)
            cmd.Parameters.AddWithValue("@maxAge", maxAge.Value);
        else
            cmd.Parameters.AddWithValue("@maxAge", DBNull.Value);

        if (!string.IsNullOrEmpty(gender))
            cmd.Parameters.AddWithValue("@gender", gender);
        else
            cmd.Parameters.AddWithValue("@gender", DBNull.Value);

        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for event search
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSearchEvents(
        string spName,
        SqlConnection con,
        string name,
        int? sportId,
        int? cityId,
        int? minAge,
        int? maxAge,
        string gender,
        DateTime? startDate,
        DateTime? endDate,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        if (!string.IsNullOrEmpty(name))
            cmd.Parameters.AddWithValue("@name", name);
        else
            cmd.Parameters.AddWithValue("@name", DBNull.Value);

        if (sportId.HasValue)
            cmd.Parameters.AddWithValue("@sportId", sportId.Value);
        else
            cmd.Parameters.AddWithValue("@sportId", DBNull.Value);

        if (cityId.HasValue)
            cmd.Parameters.AddWithValue("@cityId", cityId.Value);
        else
            cmd.Parameters.AddWithValue("@cityId", DBNull.Value);

        if (minAge.HasValue)
            cmd.Parameters.AddWithValue("@minAge", minAge.Value);
        else
            cmd.Parameters.AddWithValue("@minAge", DBNull.Value);

        if (maxAge.HasValue)
            cmd.Parameters.AddWithValue("@maxAge", maxAge.Value);
        else
            cmd.Parameters.AddWithValue("@maxAge", DBNull.Value);

        if (!string.IsNullOrEmpty(gender))
            cmd.Parameters.AddWithValue("@gender", gender);
        else
            cmd.Parameters.AddWithValue("@gender", DBNull.Value);

        if (startDate.HasValue)
            cmd.Parameters.AddWithValue("@startDate", startDate.Value);
        else
            cmd.Parameters.AddWithValue("@startDate", DBNull.Value);

        if (endDate.HasValue)
            cmd.Parameters.AddWithValue("@endDate", endDate.Value);
        else
            cmd.Parameters.AddWithValue("@endDate", DBNull.Value);

        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method gets group members paginated with their group participation status (Admin or Member)
    //---------------------------------------------------------------------------------
    public (List<object>, bool) GetGroupMembers(int groupId, int page = 1, int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> members = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureGetGroupMembers("SP_GetGroupMembers", con, groupId, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var member = new
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    GroupMemberName = dataReader["GroupMemberName"].ToString(),
                    GroupMemberImage = dataReader["GroupMemberImage"].ToString(),
                    JoinYear = Convert.ToInt32(dataReader["JoinYear"]),
                    IsAdmin = Convert.ToBoolean(dataReader["IsAdmin"])
                };

                members.Add(member);
            }

            // Check if we got more results than requested
            if (members.Count > pageSize)
            {
                hasMore = true;
                members.RemoveAt(members.Count - 1); // Remove the extra item
            }

            return (members, hasMore);
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
    // Create the SqlCommand for getting group members paginated
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupMembers(
        string spName,
        SqlConnection con,
        int groupId,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method gets Group Upcoming Events using pagination
    //---------------------------------------------------------------------------------
    public (List<object>, bool) GetUpcomingGroupEvents(int groupId, int page = 1, int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> events = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureGetUpcomingGroupEvents("SP_GetUpcomingGroupEvents", con, groupId, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var eventItem = new
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"])
                };

                events.Add(eventItem);
            }

            // Check if we got more results than requested
            if (events.Count > pageSize)
            {
                hasMore = true;
                events.RemoveAt(events.Count - 1); // Remove the extra item
            }

            return (events, hasMore);
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
    // Create the SqlCommand for getting Upcoming Group Events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUpcomingGroupEvents(
        string spName,
        SqlConnection con,
        int groupId,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method checks if a user is an admin of a specific group
    //---------------------------------------------------------------------------------
    public bool IsUserGroupAdmin(int groupId, int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureIsUserGroupAdmin("SP_IsUserGroupAdmin", con, groupId, userId);

            int count = (int)cmd.ExecuteScalar();
            return count > 0;
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
    // Create the SqlCommand for checking if a user is a group admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsUserGroupAdmin(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method checks if a user is a member of a specific group
    //---------------------------------------------------------------------------------
    public bool IsUserGroupMember(int groupId, int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureIsUserGroupMember("SP_IsUserGroupMember", con, groupId, userId);

            int count = (int)cmd.ExecuteScalar();
            return count > 0;
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
    // Create the SqlCommand for checking if a user is a group member
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsUserGroupMember(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method gets user details for a group member
    //---------------------------------------------------------------------------------
    public object GetGroupUserDetails(int groupId, int userId)
    {
        SqlConnection con = null;
        object userDetails = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureGetGroupUserDetails("SP_GetGroupUserDetails", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                userDetails = new
                {
                    FullName = dataReader["FullName"].ToString(),
                    Age = Convert.ToInt32(dataReader["Age"]),
                    Email = dataReader["Email"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Bio = dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString(),
                    UserImage = dataReader["UserImage"].ToString()
                };
            }

            return userDetails;
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
    // Create the SqlCommand for getting group user details
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupUserDetails(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method gets pending group join requests with pagination
    //---------------------------------------------------------------------------------
    public (List<object>, bool) GetGroupPendingJoinRequests(int groupId, int page = 1, int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> requests = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureGetPendingJoinRequests("SP_GetGroupPendingJoinRequests", con, groupId, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                var request = new
                {
                    RequestId = Convert.ToInt32(dataReader["RequestId"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FullName = dataReader["FullName"].ToString(),
                    UserPicture = dataReader["UserPicture"].ToString(),
                    RequestDate = Convert.ToDateTime(dataReader["RequestDate"])
                };

                requests.Add(request);
            }

            // Check if we got more results than requested
            if (requests.Count > pageSize)
            {
                hasMore = true;
                requests.RemoveAt(requests.Count - 1); // Remove the extra item
            }

            return (requests, hasMore);
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
    // Create the SqlCommand for getting pending join requests
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetPendingJoinRequests(
        string spName,
        SqlConnection con,
        int groupId,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method approves a join request and adds the user to the group
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) ApproveJoinRequest(int requestId, int groupId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureApproveJoinRequest("SP_ApproveJoinRequest", con, requestId, groupId);

            SqlParameter outputSuccess = new SqlParameter("@Success", SqlDbType.Bit);
            outputSuccess.Direction = ParameterDirection.Output;
            cmd.Parameters.Add(outputSuccess);

            SqlParameter outputMessage = new SqlParameter("@Message", SqlDbType.NVarChar, 255);
            outputMessage.Direction = ParameterDirection.Output;
            cmd.Parameters.Add(outputMessage);

            cmd.ExecuteNonQuery();

            bool success = (bool)outputSuccess.Value;
            string message = outputMessage.Value.ToString();

            return (success, message);
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
    // Create the SqlCommand for approving a join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureApproveJoinRequest(string spName, SqlConnection con, int requestId, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@requestId", requestId);
        cmd.Parameters.AddWithValue("@groupId", groupId);

        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method rejects a join request
    //---------------------------------------------------------------------------------
    public bool RejectJoinRequest(int requestId, int groupId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureRejectJoinRequest("SP_RejectJoinRequest", con, requestId, groupId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                int success = Convert.ToInt32(dataReader["Success"]);
                return success == 1; // Return true if success is 1
            }

            return false; // Default to false if no rows are returned
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
    // Create the SqlCommand for rejecting a join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRejectJoinRequest(
        string spName,
        SqlConnection con,
        int requestId,
        int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@requestId", requestId);
        cmd.Parameters.AddWithValue("@groupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method removes a member from a group
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) RemoveGroupMember(int groupId, int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureRemoveGroupMember(
                "SP_RemoveGroupMember", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                int success = Convert.ToInt32(dataReader["Success"]);
                string message = dataReader["Message"].ToString();

                return (success == 1, message);
            }

            return (false, "Failed to process the removal request");
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
    // Create the SqlCommand for removing a group member
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRemoveGroupMember(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);

        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method handles a user leaving a group
    //---------------------------------------------------------------------------------
    public bool LeaveGroup(int groupId, int userId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureLeaveGroup(
                "SP_LeaveGroup", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                int success = Convert.ToInt32(dataReader["Success"]);
                return success == 1;
            }

            return false;
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
    // Create the SqlCommand for leaving a group
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureLeaveGroup(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method handles getting user details that got a pending request in the specified group
    //---------------------------------------------------------------------------------
    public object GetUserWithPendingRequest(int groupId, int userId)
    {
        SqlConnection con = null;
        object userDetails = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUserPendingRequest("SP_GetUserWithPendingRequest", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                userDetails = new
                {
                    FullName = dataReader["FullName"].ToString(),
                    Age = Convert.ToInt32(dataReader["Age"]),
                    Email = dataReader["Email"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Bio = dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString(),
                    UserImage = dataReader["UserImage"].ToString()
                };
            }

            return userDetails;
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
    // Create the SqlCommand for getting user details
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUserPendingRequest(
        string spName,
        SqlConnection con,
        int groupId,
        int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //--------------------------------------------------------------------------------- 
    // This method checks if an event requires teams 
    //---------------------------------------------------------------------------------
    public bool? EventRequiresTeams(int eventId)
    {
        SqlConnection con = null;
        bool? requiresTeams = null;
        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureEventRequiresTeams("SP_EventRequiresTeams", con, eventId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                requiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]);
            }

            return requiresTeams;
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
    // Create the SqlCommand for checking if an event requires teams 
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureEventRequiresTeams(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method checks if a user is an admin of an event, returns true if the user is an admin, false otherwise.
    //---------------------------------------------------------------------------------
    public bool IsUserEventAdmin(int eventId, int userId)
    {
        SqlConnection con = null;
        bool isAdmin = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureIsUserEventAdmin("SP_IsUserEventAdmin", con, eventId, userId);
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                isAdmin = Convert.ToBoolean(dataReader["isAdmin"]);
            }

            return isAdmin;
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
    // Create the SqlCommand for checking if a user is an event admin using the stored procedure
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsUserEventAdmin(string spName, SqlConnection con, int eventId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method retrieves players for a non-team event with pagination
    //---------------------------------------------------------------------------------
    public (List<object>, bool) GetEventPlayers(int eventId, int page, int pageSize)
    {
        SqlConnection con = null;
        List<object> players = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGetEventPlayers("SP_GetEventPlayers", con, eventId, page, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                players.Add(new
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FullName = dataReader["FullName"].ToString(),
                    Image = dataReader["Image"].ToString(),
                    IsAdmin = Convert.ToBoolean(dataReader["IsAdmin"])
                });
            }

            // Check if we got more results than requested
            if (players.Count > pageSize)
            {
                hasMore = true;
                players.RemoveAt(players.Count - 1); // Remove the extra item
            }

            return (players, hasMore);
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
    // Create the SqlCommand for retrieving event players
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventPlayers(
        string spName,
        SqlConnection con,
        int eventId,
        int page,
        int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method processes a request to join an event as either a player or watcher
    //---------------------------------------------------------------------------------
    public string ProcessEventJoinRequest(int eventId, int userId, bool playWatch)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureEventJoinRequest("SP_ProcessEventJoinRequestParticipants", con, eventId, userId, playWatch);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return dataReader["Result"].ToString();
            }

            return "UnknownError";
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
    // Create the SqlCommand for processing an event join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureEventJoinRequest(string spName, SqlConnection con, int eventId, int userId, bool playWatch)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@playWatch", playWatch);
        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method cancels a user's pending join request for a group
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) CancelGroupJoinRequest(int groupId, int userId)
    {
        SqlConnection con = null;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureCancelRequest("SP_CancelGroupJoinRequest", con, groupId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            return (success, errorMessage);
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
    // Create the SqlCommand for canceling a group join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCancelRequest(string spName, SqlConnection con, int groupId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method cancels a pending event join request
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) CancelEventJoinRequest(int eventId, int userId)
    {
        SqlConnection con = null;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureCancelEventRequest("SP_CancelEventJoinRequest", con, eventId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            return (success, errorMessage);
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
    // Create the SqlCommand for canceling an event join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCancelEventRequest(string spName, SqlConnection con, int eventId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method processes a user's request to leave an event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) LeaveEvent(int eventId, int userId)
    {
        SqlConnection con = null;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureLeaveEvent("SP_LeaveEvent", con, eventId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            return (success, errorMessage);
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
    // Create the SqlCommand for leaving an event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureLeaveEvent(string spName, SqlConnection con, int eventId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method allows an event admin to remove a player from an event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) AdminRemoveEventPlayer(int eventId, int playerUserId, int adminUserId)
    {
        SqlConnection con = null;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureAdminRemovePlayer("SP_AdminRemoveEventPlayer", con, eventId, playerUserId, adminUserId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            return (success, errorMessage);
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
    // Create the SqlCommand for an admin removing a player from an event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureAdminRemovePlayer(string spName, SqlConnection con, int eventId, int playerUserId, int adminUserId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@playerUserId", playerUserId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method allows an event admin to process a join request
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) AdminProcessJoinRequest(int eventId, int requestUserId, int adminUserId, bool approve)
    {
        SqlConnection con = null;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureProcessJoinRequest("SP_AdminProcessJoinRequest", con, eventId, requestUserId, adminUserId, approve);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            return (success, errorMessage);
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
    // Create the SqlCommand for processing a join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureProcessJoinRequest(string spName, SqlConnection con, int eventId, int requestUserId, int adminUserId, bool approve)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@requestUserId", requestUserId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        cmd.Parameters.AddWithValue("@approve", approve);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method retrieves pending join requests with pagination for infinite scroll
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage, List<object> Requests, bool HasMore) GetEventPendingJoinRequests(int eventId, int adminUserId, int page, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;
        List<object> requests = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetPendingRequests("SP_GetEventPendingJoinRequestsPaginated", con, eventId, adminUserId, page, pageSize);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            // First result set - status information
            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            // If successful, proceed to second result set with the actual requests
            if (success)
            {
                dataReader.NextResult();

                int count = 0;
                while (dataReader.Read())
                {
                    count++;

                    // Only add to result if within the requested page size
                    if (count <= pageSize)
                    {
                        requests.Add(new
                        {
                            UserId = Convert.ToInt32(dataReader["UserId"]),
                            FullName = dataReader["FullName"].ToString(),
                            UserPicture = dataReader["UserPicture"].ToString(),
                            RequestDate = Convert.ToDateTime(dataReader["RequestedDate"])
                        });
                    }
                }

                // If we got more records than the page size, there are more records
                hasMore = (count > pageSize);
            }

            return (success, errorMessage, requests, hasMore);
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
    // Create the SqlCommand for getting pending join requests
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetPendingRequests(string spName, SqlConnection con, int eventId, int adminUserId, int page, int pageSize)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;          // the stored procedure name

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command

        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method retrieves user details that got a pending request in a event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage, object UserDetails) GetEventPendingRequestUserDetails(int eventId, int userId, int adminUserId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;
        object userDetails = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandGetEventPendingRequestUserDetails("SP_GetEventPendingRequestUserDetails", con, eventId, userId, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            // First result set - status information
            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            // If successful, proceed to second result set with user details
            if (success && dataReader.NextResult() && dataReader.Read())
            {
                userDetails = new
                {
                    FullName = dataReader["FullName"].ToString(),
                    Age = Convert.ToInt32(dataReader["Age"]),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Bio = dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString()
                };
            }

            dataReader.Close();

            return (success, errorMessage, userDetails);
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
    // Create the SqlCommand for getting user details that got a pending request in a event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandGetEventPendingRequestUserDetails(string spName, SqlConnection con, int eventId, int userId, int adminUserId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method Gets details of a user who is a player in an event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage, object UserDetails) GetEventPlayerDetails(int eventId, int userId, int adminUserId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;
        object userDetails = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandGetEventPlayerDetails("SP_GetEventPlayerDetails", con, eventId, userId, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            // First result set - status information
            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            // If successful, proceed to second result set with user details
            if (success && dataReader.NextResult() && dataReader.Read())
            {
                userDetails = new
                {
                    FullName = dataReader["FullName"].ToString(),
                    Age = Convert.ToInt32(dataReader["Age"]),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Bio = dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString()
                };
            }

            dataReader.Close();

            return (success, errorMessage, userDetails);
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
    // Create the SqlCommand for Getting user details that is a player in the sepcified event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandGetEventPlayerDetails(string spName, SqlConnection con, int eventId, int userId, int adminUserId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for joining a team event as a spectator
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) JoinTeamEventAsSpectator(int eventId, int userId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureJoinAsSpectator("SP_JoinTeamEventAsSpectator", con, eventId, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            dataReader.Close();

            return (success, errorMessage);
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
    // Create the SqlCommand for joining a team event as a spectator
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureJoinAsSpectator(string spName, SqlConnection con, int eventId, int userId)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object
        cmd.Connection = con;              // assign the connection to the command object
        cmd.CommandText = spName;          // the stored procedure name
        cmd.CommandTimeout = 10;           // Time to wait for the execution
        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method cancels spectating in a team event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) CancelTeamEventSpectating(int eventId, int userId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureCancelSpectating("SP_CancelTeamEventSpectating", con, eventId, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            dataReader.Close();

            return (success, errorMessage);
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
    // Create the SqlCommand for canceling spectating in a team event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCancelSpectating(string spName, SqlConnection con, int eventId, int userId)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object
        cmd.Connection = con;              // assign the connection to the command object
        cmd.CommandText = spName;          // the stored procedure name
        cmd.CommandTimeout = 10;           // Time to wait for the execution
        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@userId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method Gets paginated list of groups registered in a team event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage, List<object> Groups, bool HasMore) GetTeamEventGroups(int eventId, int page, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;
        List<object> groups = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetTeamEventGroups("SP_GetTeamEventGroupsPaginated",
            con, eventId, page, pageSize);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            // First result set - status information
            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            // If successful, proceed to second result set with the group data
            if (success && dataReader.NextResult())
            {
                int count = 0;
                while (dataReader.Read())
                {
                    count++;

                    // Only add actual page size number of records to result
                    if (count <= pageSize)
                    {
                        groups.Add(new
                        {
                            GroupId = Convert.ToInt32(dataReader["GroupId"]),
                            GroupName = dataReader["GroupName"].ToString(),
                            GroupImage = dataReader["GroupImage"].ToString()
                        });
                    }
                }

                // If we got more records than requested page size, there are more records
                hasMore = (count > pageSize);
            }

            dataReader.Close();

            return (success, errorMessage, groups, hasMore);
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
    // Create the SqlCommand for getting paginated list of groups registered in a team event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetTeamEventGroups(string spName, SqlConnection con, int eventId, int page, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@page", page);
        cmd.Parameters.AddWithValue("@pageSize", pageSize);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for removing a group from the specified event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) RemoveGroupFromEvent(int eventId, int groupId, int adminUserId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureForAddingAndRemovingGroupFromAnEvent("SP_RemoveGroupFromEvent", con, eventId, groupId, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            dataReader.Close();
            return (success, errorMessage);
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
    // This method is for adding a group for the specified event
    //---------------------------------------------------------------------------------
    public (bool Success, string ErrorMessage) AddGroupToEvent(int eventId, int groupId, int adminUserId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool success = false;
        string errorMessage = null;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureForAddingAndRemovingGroupFromAnEvent("SP_AddGroupToEvent", con, eventId, groupId, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                success = Convert.ToBoolean(dataReader["Success"]);
                errorMessage = dataReader["ErrorMessage"] != DBNull.Value ? dataReader["ErrorMessage"].ToString() : null;
            }

            dataReader.Close();
            return (success, errorMessage);
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
    // Create the SqlCommand for adding/removing a group for/from the specified event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureForAddingAndRemovingGroupFromAnEvent(string spName, SqlConnection con, int eventId, int groupId, int adminUserId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        cmd.Parameters.AddWithValue("@groupId", groupId);
        cmd.Parameters.AddWithValue("@adminUserId", adminUserId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for saving a refresh token for the specified user
    //---------------------------------------------------------------------------------
    public RefreshToken SaveRefreshToken(int userId, string token, DateTime expiryDate)
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

        cmd = CreateCommandWithStoredProcedureSaveRefreshToken("SP_SaveRefreshToken", con, userId, token, expiryDate);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                var refreshToken = new RefreshToken
                {
                    Id = Convert.ToInt32(dataReader["Id"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    Token = dataReader["Token"].ToString(),
                    ExpiryDate = Convert.ToDateTime(dataReader["ExpiryDate"]),
                    Created = Convert.ToDateTime(dataReader["Created"])
                };

                return refreshToken;
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
    // Create the SqlCommand for saving a refresh token for the specified user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSaveRefreshToken(string spName, SqlConnection con, int userId, string token, DateTime expiryDate)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Token", token);
        cmd.Parameters.AddWithValue("@ExpiryDate", expiryDate);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for getting the refresh token for the specified user
    //---------------------------------------------------------------------------------
    public RefreshToken GetRefreshToken(string token)
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

        cmd = CreateCommandWithStoredProcedureGetRefreshToken("SP_GetRefreshToken", con, token);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                var refreshToken = new RefreshToken
                {
                    Id = Convert.ToInt32(dataReader["Id"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    Token = dataReader["Token"].ToString(),
                    ExpiryDate = Convert.ToDateTime(dataReader["ExpiryDate"]),
                    Created = Convert.ToDateTime(dataReader["Created"]),
                    Revoked = dataReader["Revoked"] != DBNull.Value ? Convert.ToDateTime(dataReader["Revoked"]) : (DateTime?)null,
                    ReplacedByToken = dataReader["ReplacedByToken"] != DBNull.Value ? dataReader["ReplacedByToken"].ToString() : null,
                    ReasonRevoked = dataReader["ReasonRevoked"] != DBNull.Value ? dataReader["ReasonRevoked"].ToString() : null,
                    UseCount = Convert.ToInt32(dataReader["UseCount"])
                };

                return refreshToken;
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
    // Create the SqlCommand for getting the refresh token for the specified user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetRefreshToken(string spName, SqlConnection con, string token)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Token", token);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for revoking the refresh token for the specified user
    //---------------------------------------------------------------------------------
    public bool RevokeRefreshToken(string token, string reason, string replacedByToken = null)
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

        cmd = CreateCommandWithStoredProcedureRevokeRefreshToken("SP_RevokeRefreshToken", con, token, reason, replacedByToken);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for revoking the refresh token for the specified user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRevokeRefreshToken(string spName, SqlConnection con, string token, string reason, string replacedByToken)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Token", token);
        cmd.Parameters.AddWithValue("@Reason", reason);

        if (replacedByToken != null)
            cmd.Parameters.AddWithValue("@ReplacedByToken", replacedByToken);
        else
            cmd.Parameters.AddWithValue("@ReplacedByToken", DBNull.Value);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is for getting the specified user details for the tokens
    //---------------------------------------------------------------------------------
    public User GetUserById(int userId)
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

        cmd = CreateCommandWithStoredProcedureGetUserById("SP_GetUserById", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return new User
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    PasswordHash = dataReader["PasswordHash"].ToString(),
                    BirthDate = Convert.ToDateTime(dataReader["BirthDate"]),
                    Gender = dataReader["Gender"].ToString(),
                    FavSportId = Convert.ToInt32(dataReader["FavSportId"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    IsGroupAdmin = Convert.ToBoolean(dataReader["IsGroupAdmin"]),
                    IsCityOrganizer = Convert.ToBoolean(dataReader["IsCityOrganizer"]),
                    IsEventAdmin = Convert.ToBoolean(dataReader["IsEventAdmin"]),
                    IsEmailVerified = Convert.ToBoolean(dataReader["IsEmailVerified"]),
                    IsSuperAdmin = Convert.ToBoolean(dataReader["IsSuperAdmin"])
                };
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

        return null;
    }

    //---------------------------------------------------------------------------------
    // Create the SqlCommand for getting the specified user details for the tokens
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserById(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to save admin refresh tokens
    //---------------------------------------------------------------------------------
    public RefreshToken SaveAdminRefreshToken(int userId, string token, DateTime expiryDate)
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

        cmd = CreateCommandWithStoredProcedureSaveAdminRefreshToken("SP_SaveAdminRefreshToken", con, userId, token, expiryDate);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                var refreshToken = new RefreshToken
                {
                    Id = Convert.ToInt32(dataReader["Id"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    Token = dataReader["Token"].ToString(),
                    ExpiryDate = Convert.ToDateTime(dataReader["ExpiryDate"]),
                    Created = Convert.ToDateTime(dataReader["Created"])
                };

                return refreshToken;
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
    // Create the SqlCommand for saving admin refresh tokens
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSaveAdminRefreshToken(string spName, SqlConnection con, int userId, string token, DateTime expiryDate)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Token", token);
        cmd.Parameters.AddWithValue("@ExpiryDate", expiryDate);

        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method is used to get the saved admin refresh token for the specified CityOrganizer (The details)
    //---------------------------------------------------------------------------------
    public RefreshToken GetAdminRefreshToken(string token)
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

        cmd = CreateCommandWithStoredProcedureGetAdminRefreshToken("SP_GetAdminRefreshToken", con, token);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                var refreshToken = new RefreshToken
                {
                    Id = Convert.ToInt32(dataReader["Id"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    Token = dataReader["Token"].ToString(),
                    ExpiryDate = Convert.ToDateTime(dataReader["ExpiryDate"]),
                    Created = Convert.ToDateTime(dataReader["Created"]),
                    Revoked = dataReader["Revoked"] != DBNull.Value ? Convert.ToDateTime(dataReader["Revoked"]) : (DateTime?)null,
                    ReplacedByToken = dataReader["ReplacedByToken"] != DBNull.Value ? dataReader["ReplacedByToken"].ToString() : null,
                    ReasonRevoked = dataReader["ReasonRevoked"] != DBNull.Value ? dataReader["ReasonRevoked"].ToString() : null
                };

                return refreshToken;
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
    // Create the SqlCommand for getting the saved admin refresh token for the specified CityOrganizer (The details)
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetAdminRefreshToken(string spName, SqlConnection con, string token)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@Token", token);
        return cmd;
    }
    
    //---------------------------------------------------------------------------------
    // This method is used to revoke admin refresh token
    //---------------------------------------------------------------------------------
    public bool RevokeAdminRefreshToken(string token, string reason, string replacedByToken = null)
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

        cmd = CreateCommandWithStoredProcedureRevokeAdminRefreshToken("SP_RevokeAdminRefreshToken", con, token, reason, replacedByToken);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for revoking admin refresh token
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRevokeAdminRefreshToken(string spName, SqlConnection con, string token, string reason, string replacedByToken)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Token", token);
        cmd.Parameters.AddWithValue("@Reason", reason);

        if (replacedByToken != null)
            cmd.Parameters.AddWithValue("@ReplacedByToken", replacedByToken);
        else
            cmd.Parameters.AddWithValue("@ReplacedByToken", DBNull.Value);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to revoke all admin refresh tokens for the specified user
    //---------------------------------------------------------------------------------
    public int RevokeAllUserAdminRefreshTokens(int userId, string reason)
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

        cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = "SP_RevokeAllUserAdminRefreshTokens";
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Reason", reason);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["AffectedTokens"]);
            }
            else
            {
                return 0;
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
    // This method is used to get cities that a user is an organizer for
    //---------------------------------------------------------------------------------
    public List<CityOrganizer> GetManagedCities(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;
        List<CityOrganizer> cities = new List<CityOrganizer>();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetManagedCities("SP_GetUserManagedCities", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                cities.Add(new CityOrganizer
                {
                    CityId = Convert.ToInt32(dataReader["CityId"])
                });
            }

            return cities;
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
    // Create the SqlCommand for getting managed cities
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetManagedCities(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to check if a user is an organizer for a specific city
    //---------------------------------------------------------------------------------
    public bool IsUserCityOrganizer(int userId, int cityId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool isOrganizer = false;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureIsUserCityOrganizer("SP_IsUserCityOrganizer", con, userId, cityId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                isOrganizer = Convert.ToBoolean(dataReader["IsOrganizer"]);
            }

            return isOrganizer;
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
    // Create the SqlCommand for checking if user is city organizer
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIsUserCityOrganizer(string spName, SqlConnection con, int userId, int cityId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@CityId", cityId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get dashboard statistics for a city
    //---------------------------------------------------------------------------------
    public DashboardStats GetCityDashboardStats(int cityId)
    {
        SqlConnection con;
        SqlCommand cmd;
        DashboardStats stats = new DashboardStats();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetCityDashboardStats("SP_GetCityDashboardStats", con, cityId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                stats.EventsCount = Convert.ToInt32(dataReader["EventsCount"]);
                stats.ActiveEventsCount = Convert.ToInt32(dataReader["ActiveEventsCount"]);
                stats.GroupsCount = Convert.ToInt32(dataReader["GroupsCount"]);
                stats.TotalParticipants = Convert.ToInt32(dataReader["TotalParticipants"]);
                stats.TotalGroupMembers = Convert.ToInt32(dataReader["TotalGroupMembers"]);
            }

            return stats;
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
    // Create the SqlCommand for getting city dashboard stats
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetCityDashboardStats(string spName, SqlConnection con, int cityId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@CityId", cityId);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get groups by city for admin with search, sorting and pagination
    //---------------------------------------------------------------------------------
    public List<GroupListItem> GetGroupsByCityForAdmin(int cityId, string name, int sortBy, int page, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        List<GroupListItem> groups = new List<GroupListItem>();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetGroupsByCityForAdmin(
            "SP_GetGroupsByCityForAdmin", con, cityId, name, sortBy, page, pageSize);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                groups.Add(new GroupListItem
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    GroupImage = dataReader["GroupImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    FoundedAt = Convert.ToDateTime(dataReader["FoundedAt"]),
                    Gender = dataReader["Gender"].ToString(),
                    TotalMembers = Convert.ToInt32(dataReader["TotalMembers"])
                });
            }

            return groups;
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
    // Create the SqlCommand for getting groups by city for admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupsByCityForAdmin(
        string spName, SqlConnection con, int cityId, string name, int sortBy, int page, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@CityId", cityId);
        cmd.Parameters.AddWithValue("@Name", name ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@SortBy", sortBy);
        cmd.Parameters.AddWithValue("@Page", page);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        return cmd;
    }


    //---------------------------------------------------------------------------------
    // This method is used to get group details for admin
    //---------------------------------------------------------------------------------
    public GroupDetailsAdmin GetGroupDetailsForAdmin(int cityId, int groupId)
    {
        SqlConnection con;
        SqlCommand cmd;
        GroupDetailsAdmin groupDetails = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetGroupDetailsForAdmin("SP_GetGroupDetailsForAdmin", con, cityId, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                groupDetails = new GroupDetailsAdmin
                {
                    GroupId = Convert.ToInt32(dataReader["GroupId"]),
                    GroupName = dataReader["GroupName"].ToString(),
                    Description = dataReader["Description"].ToString(),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    GroupImage = dataReader["GroupImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    FoundedAt = Convert.ToDateTime(dataReader["FoundedAt"]),
                    MaxMemNum = Convert.ToInt32(dataReader["MaxMemNum"]),
                    TotalMembers = Convert.ToInt32(dataReader["TotalMembers"]),
                    MinAge = Convert.ToInt32(dataReader["MinAge"]),
                    Gender = dataReader["Gender"].ToString(),
                };
            }

            return groupDetails;
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
    // Create the SqlCommand for getting group details for admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupDetailsForAdmin(string spName, SqlConnection con, int cityId, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@CityId", cityId);
        cmd.Parameters.AddWithValue("@GroupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the group admin
    //---------------------------------------------------------------------------------
    public GroupAdmin GetGroupAdmin(int groupId)
    {
        SqlConnection con;
        SqlCommand cmd;
        GroupAdmin admin = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetGroupAdmin("SP_GetGroupAdmin", con, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                admin = new GroupAdmin
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString()
                };
            }

            return admin;
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
    // Create the SqlCommand for getting the group admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupAdmin(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to search users by email or ID
    //---------------------------------------------------------------------------------
    public List<UserSearchResult> SearchUsersForAdmin(string emailOrId, int maxResults)
    {
        SqlConnection con;
        SqlCommand cmd;
        List<UserSearchResult> users = new List<UserSearchResult>();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureSearchUsersForAdmin("SP_SearchUsersForAdmin", con, emailOrId, maxResults);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                users.Add(new UserSearchResult
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FullName = $"{dataReader["FirstName"]} {dataReader["LastName"]}",
                    Email = dataReader["Email"].ToString(),
                    Gender = dataReader["Gender"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"])
                });
            }

            return users;
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
    // Create the SqlCommand for searching users
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSearchUsersForAdmin(string spName, SqlConnection con, string emailOrId, int maxResults)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EmailOrId", emailOrId);
        cmd.Parameters.AddWithValue("@MaxResults", maxResults);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Create new group and assign admin
    //---------------------------------------------------------------------------------
    public int CreateGroup(GroupInfo group, int adminUserId)
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

        cmd = CreateCommandWithStoredProcedureCreateGroup("SP_CreateGroup", con, group, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["GroupId"]);
            }
            else
            {
                return -1;
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
    // Create the SqlCommand for creating a group
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCreateGroup(string spName, SqlConnection con, GroupInfo group, int adminUserId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupName", group.GroupName);
        cmd.Parameters.AddWithValue("@Description", group.Description);
        cmd.Parameters.AddWithValue("@SportId", group.SportId);
        cmd.Parameters.AddWithValue("@GroupImage", group.GroupImage);
        cmd.Parameters.AddWithValue("@CityId", group.CityId);
        cmd.Parameters.AddWithValue("@MaxMemNum", group.MaxMemNum);
        cmd.Parameters.AddWithValue("@TotalMembers", group.TotalMembers);
        cmd.Parameters.AddWithValue("@MinAge", group.MinAge);
        cmd.Parameters.AddWithValue("@Gender", group.Gender);
        cmd.Parameters.AddWithValue("@AdminUserId", adminUserId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Change group admin
    //---------------------------------------------------------------------------------
    public bool ChangeGroupAdmin(int groupId, int newAdminUserId, int currentAdminId, int cityId)
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

        cmd = CreateCommandWithStoredProcedureChangeGroupAdmin("SP_ChangeGroupAdmin", con, groupId, newAdminUserId, currentAdminId, cityId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for changing group admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureChangeGroupAdmin(string spName, SqlConnection con, int groupId, int newAdminUserId, int currentAdminId, int cityId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);
        cmd.Parameters.AddWithValue("@NewAdminUserId", newAdminUserId);
        cmd.Parameters.AddWithValue("@CurrentAdminId", currentAdminId);
        cmd.Parameters.AddWithValue("@CityId", cityId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Delete group
    //---------------------------------------------------------------------------------
    public bool DeleteGroup(int groupId)
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

        cmd = CreateCommandWithStoredProcedureDeleteGroup("SP_DeleteGroup", con, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for deleting a group
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureDeleteGroup(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Get user gender for validation using stored procedure
    //---------------------------------------------------------------------------------
    public string GetUserGender(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;
        string gender = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetUserGender("SP_GetUserGender", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                gender = dataReader["Gender"].ToString();
            }

            return gender;
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
    // Create the SqlCommand for getting user gender
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserGender(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@UserId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Check if user exists using stored procedure
    //---------------------------------------------------------------------------------
    public bool UserExists(int userId)
    {
        SqlConnection con;
        SqlCommand cmd;
        bool exists = false;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureUserExists("SP_UserExists", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                exists = Convert.ToBoolean(dataReader["UserExists"]);
            }

            return exists;
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
    // Create the SqlCommand for checking if user exists
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUserExists(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@UserId", userId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get events by city for admin with search, sorting and pagination
    //---------------------------------------------------------------------------------
    public List<EventListItem> GetEventsByCityForAdmin(int cityId, string name, int sortBy, int page, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        List<EventListItem> events = new List<EventListItem>();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetEventsByCityForAdmin("SP_GetEventsByCityForAdmin", con, cityId, name, sortBy, page, pageSize);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                events.Add(new EventListItem
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    RequiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    EventImage = dataReader["ProfileImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    Gender = dataReader["Gender"].ToString(),
                    IsPublic = Convert.ToBoolean(dataReader["IsPublic"]),
                    LocationName = dataReader["LocationName"]?.ToString() ?? "No Location"
                });
            }

            return events;
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
    // Create the SqlCommand for getting events by city for admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventsByCityForAdmin(string spName, SqlConnection con, int cityId, string name, int sortBy, int page, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@CityId", cityId);
        cmd.Parameters.AddWithValue("@Name", name ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@SortBy", sortBy);
        cmd.Parameters.AddWithValue("@Page", page);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get event details for admin
    //---------------------------------------------------------------------------------
    public EventDetailsAdmin GetEventDetailsForAdmin(int cityId, int eventId)
    {
        SqlConnection con;
        SqlCommand cmd;
        EventDetailsAdmin eventDetails = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetEventDetailsForAdmin("SP_GetEventDetailsForAdmin", con, cityId, eventId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                eventDetails = new EventDetailsAdmin
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    RequiresTeams = Convert.ToBoolean(dataReader["RequiresTeams"]),
                    Description = dataReader["Description"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    LocationName = dataReader["LocationName"]?.ToString() ?? "No Location",
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    CreatedAt = Convert.ToDateTime(dataReader["CreatedAt"]),
                    MinAge = Convert.ToInt32(dataReader["MinAge"]),
                    Gender = dataReader["Gender"].ToString(),
                    EventImage = dataReader["ProfileImage"].ToString()
                };

                // Set either team-related or participant-related properties based on RequiresTeams
                if (eventDetails.RequiresTeams)
                {
                    if (dataReader["MaxTeams"] != DBNull.Value)
                        eventDetails.MaxTeams = Convert.ToInt32(dataReader["MaxTeams"]);

                    if (dataReader["TeamsNum"] != DBNull.Value)
                        eventDetails.TeamsNum = Convert.ToInt32(dataReader["TeamsNum"]);
                }
                else
                {
                    if (dataReader["MaxParticipants"] != DBNull.Value)
                        eventDetails.MaxParticipants = Convert.ToInt32(dataReader["MaxParticipants"]);

                    if (dataReader["ParticipantsNum"] != DBNull.Value)
                        eventDetails.ParticipantsNum = Convert.ToInt32(dataReader["ParticipantsNum"]);
                }
            }

            return eventDetails;
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
    // Create the SqlCommand for getting event details for admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventDetailsForAdmin(string spName, SqlConnection con, int cityId, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@CityId", cityId);
        cmd.Parameters.AddWithValue("@EventId", eventId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the event admin
    //---------------------------------------------------------------------------------
    public EventAdmin GetEventAdmin(int eventId)
    {
        SqlConnection con;
        SqlCommand cmd;
        EventAdmin admin = null;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        cmd = CreateCommandWithStoredProcedureGetEventAdmin("SP_GetEventAdmin", con, eventId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                admin = new EventAdmin
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString()
                };
            }

            return admin;
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
    // Create the SqlCommand for getting the event admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventAdmin(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Create new event and assign admin
    //---------------------------------------------------------------------------------
    public int CreateEvent(Backend.Models.EventInfo eventInfo, int adminUserId)
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

        cmd = CreateCommandWithStoredProcedureCreateEvent("SP_CreateEvent", con, eventInfo, adminUserId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["EventId"]);
            }
            else
            {
                return -1;
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
    // Create the SqlCommand for creating an event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCreateEvent(string spName, SqlConnection con, Backend.Models.EventInfo eventInfo, int adminUserId) 
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventName", eventInfo.EventName);
        cmd.Parameters.AddWithValue("@RequiresTeams", eventInfo.RequiresTeams);
        cmd.Parameters.AddWithValue("@Description", eventInfo.Description);
        cmd.Parameters.AddWithValue("@StartDatetime", eventInfo.StartDatetime);
        cmd.Parameters.AddWithValue("@EndDatetime", eventInfo.EndDatetime);
        cmd.Parameters.AddWithValue("@CityId", eventInfo.CityId);
        cmd.Parameters.AddWithValue("@LocationName", eventInfo.LocationName);
        cmd.Parameters.AddWithValue("@SportId", eventInfo.SportId);
        cmd.Parameters.AddWithValue("@IsPublic", eventInfo.IsPublic);
        cmd.Parameters.AddWithValue("@Gender", eventInfo.Gender);
        cmd.Parameters.AddWithValue("@MinAge", eventInfo.MinAge);
        cmd.Parameters.AddWithValue("@ProfileImage", eventInfo.ProfileImage);

        // Handle nullable parameters
        cmd.Parameters.AddWithValue("@MaxTeams", eventInfo.MaxTeams.HasValue ? (object)eventInfo.MaxTeams.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("@MaxParticipants", eventInfo.MaxParticipants.HasValue ? (object)eventInfo.MaxParticipants.Value : DBNull.Value);

        cmd.Parameters.AddWithValue("@AdminUserId", adminUserId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Change event admin
    //---------------------------------------------------------------------------------
    public bool ChangeEventAdmin(int eventId, int newAdminUserId, int currentAdminId)
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

        cmd = CreateCommandWithStoredProcedureChangeEventAdmin("SP_ChangeEventAdmin", con, eventId, newAdminUserId, currentAdminId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for changing event admin
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureChangeEventAdmin(string spName, SqlConnection con, int eventId, int newAdminUserId, int currentAdminId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);
        cmd.Parameters.AddWithValue("@NewAdminUserId", newAdminUserId);
        cmd.Parameters.AddWithValue("@CurrentAdminId", currentAdminId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Delete event
    //---------------------------------------------------------------------------------
    public bool DeleteEvent(int eventId)
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

        cmd = CreateCommandWithStoredProcedureDeleteEvent("SP_DeleteEvent", con, eventId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }
            else
            {
                return false;
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
    // Create the SqlCommand for deleting an event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureDeleteEvent(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the city id for the specified group
    //---------------------------------------------------------------------------------
    public int? GetGroupCityId(int groupId)
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

        cmd = CreateCommandWithStoredProcedureGetGroupCityId("SP_GetGroupCityId", con, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["CityId"]);
            }

            return null;
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
    // Create the SqlCommand for getting the city id for the specified group
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupCityId(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the city id for the specified event
    //---------------------------------------------------------------------------------
    public int? GetEventCityId(int eventId)
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

        cmd = CreateCommandWithStoredProcedureGetEventCityId("SP_GetEventCityId", con, eventId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["CityId"]);
            }

            return null;
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
    // Create the SqlCommand for getting the city id for the specified event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventCityId(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the city id for the specified event
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) UpdateGroup(int groupId, string groupName, string description)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw ex;
        }

        cmd = CreateCommandWithStoredProcedureUpdateGroup("SP_UpdateGroup", con, groupId, groupName, description);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Unexpected error occurred");
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
    // Create the SqlCommand for getting the city id for the specified event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateGroup(string spName, SqlConnection con, int groupId, string groupName, string description)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);
        cmd.Parameters.AddWithValue("@GroupName", groupName);
        cmd.Parameters.AddWithValue("@Description", description ?? "");

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get the city id for the specified event
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) UpdateEvent(int eventId, string eventName, string description, string locationName)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw ex;
        }

        cmd = CreateCommandWithStoredProcedureUpdateEvent("SP_UpdateEvent", con, eventId, eventName, description, locationName);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Unexpected error occurred");
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
    // Create the SqlCommand for getting the city id for the specified event
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateEvent(string spName, SqlConnection con, int eventId, string eventName, string description, string locationName)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);
        cmd.Parameters.AddWithValue("@EventName", eventName);
        cmd.Parameters.AddWithValue("@Description", description ?? "");
        cmd.Parameters.AddWithValue("@LocationName", locationName);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to update group image
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) UpdateGroupImage(int groupId, string imageFileName)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUpdateGroupImage("SP_UpdateGroupImage", con, groupId, imageFileName);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Unexpected error occurred");
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
    // Create the SqlCommand for updating group image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateGroupImage(string spName, SqlConnection con, int groupId, string imageFileName)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);
        cmd.Parameters.AddWithValue("@GroupImage", imageFileName ?? "default_group.png");

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get group image
    //---------------------------------------------------------------------------------
    public string GetGroupImage(int groupId)
    {
        SqlConnection con = null;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
            cmd = CreateCommandWithStoredProcedureGetGroupImage("SP_GetGroupImage", con, groupId);

            SqlDataReader reader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (reader.Read())
            {
                return reader["GroupImage"].ToString();
            }

            return null;
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
    // Create the SqlCommand for getting group image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupImage(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@GroupId", groupId);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to update event image
    //---------------------------------------------------------------------------------
    public (bool Success, string Message) UpdateEventImage(int eventId, string imageFileName)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUpdateEventImage("SP_UpdateEventImage", con, eventId, imageFileName);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Unexpected error occurred");
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
    // Create the SqlCommand for updating event image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateEventImage(string spName, SqlConnection con, int eventId, string imageFileName)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);
        cmd.Parameters.AddWithValue("@ProfileImage", imageFileName ?? "default_event.png");

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // This method is used to get event image
    //---------------------------------------------------------------------------------
    public string GetEventImage(int eventId)
    {
        SqlConnection con = null;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
            cmd = CreateCommandWithStoredProcedureGetEventImage("SP_GetEventImage", con, eventId);

            SqlDataReader reader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (reader.Read())
            {
                return reader["ProfileImage"].ToString();
            }

            return null;
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
    // Create the SqlCommand for getting event image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventImage(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@EventId", eventId);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method saves email verification code
    //--------------------------------------------------------------------------------------------------
    public bool SaveEmailVerificationCode(int userId, string code, DateTime expiresAt)
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

        cmd = CreateCommandWithStoredProcedureSaveEmailVerificationCode("SP_SaveEmailVerificationCode", con, userId, code, expiresAt);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["CodeId"]) > 0;
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
    // Create the SqlCommand using a stored procedure for saving email verification code
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSaveEmailVerificationCode(string spName, SqlConnection con, int userId, string code, DateTime expiresAt)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Code", code);
        cmd.Parameters.AddWithValue("@ExpiresAt", expiresAt);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method verifies email with code
    //--------------------------------------------------------------------------------------------------
    public (bool IsValid, int UserId) VerifyEmailWithCode(string code)
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

        cmd = CreateCommandWithStoredProcedureVerifyEmailWithCode("SP_VerifyEmailWithCode", con, code);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool isValid = Convert.ToBoolean(dataReader["IsValid"]);
                int userId = dataReader["UserId"] != DBNull.Value ? Convert.ToInt32(dataReader["UserId"]) : 0;
                return (isValid, userId);
            }
            else
            {
                return (false, 0);
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
    // Create the SqlCommand using a stored procedure for verifying email with code
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureVerifyEmailWithCode(string spName, SqlConnection con, string code)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@Code", code);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method saves password reset code
    //--------------------------------------------------------------------------------------------------
    public bool SavePasswordResetCode(int userId, string code, DateTime expiresAt)
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

        cmd = CreateCommandWithStoredProcedureSavePasswordResetCode("SP_SavePasswordResetCode", con, userId, code, expiresAt);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["CodeId"]) > 0;
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
    // Create the SqlCommand using a stored procedure for saving password reset code
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSavePasswordResetCode(string spName, SqlConnection con, int userId, string code, DateTime expiresAt)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Code", code);
        cmd.Parameters.AddWithValue("@ExpiresAt", expiresAt);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method validates password reset code
    //--------------------------------------------------------------------------------------------------
    public User ValidatePasswordResetCode(string code)
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

        cmd = CreateCommandWithStoredProcedureValidatePasswordResetCode("SP_ValidatePasswordResetCode", con, code);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return new User
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    PasswordHash = dataReader["PasswordHash"].ToString(),
                    BirthDate = Convert.ToDateTime(dataReader["BirthDate"]),
                    Gender = dataReader["Gender"].ToString(),
                    FavSportId = Convert.ToInt32(dataReader["FavSportId"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    IsGroupAdmin = Convert.ToBoolean(dataReader["IsGroupAdmin"]),
                    IsCityOrganizer = Convert.ToBoolean(dataReader["IsCityOrganizer"]),
                    IsEventAdmin = Convert.ToBoolean(dataReader["IsEventAdmin"]),
                    IsEmailVerified = Convert.ToBoolean(dataReader["IsEmailVerified"])
                };
            }
            else
            {
                return null;
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
    // Create the SqlCommand using a stored procedure for validating password reset code
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureValidatePasswordResetCode(string spName, SqlConnection con, string code)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@Code", code);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method updates user password
    //--------------------------------------------------------------------------------------------------
    public bool UpdateUserPassword(int userId, string newPasswordHash)
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

        cmd = CreateCommandWithStoredProcedureUpdateUserPassword("SP_UpdateUserPassword", con, userId, newPasswordHash);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["RowsAffected"]) > 0;
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
    // Create the SqlCommand using a stored procedure for updating user password
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateUserPassword(string spName, SqlConnection con, int userId, string newPasswordHash)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@NewPasswordHash", newPasswordHash);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method marks password reset code as used
    //--------------------------------------------------------------------------------------------------
    public bool MarkPasswordResetCodeAsUsed(string code)
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

        cmd = CreateCommandWithStoredProcedureMarkPasswordResetCodeAsUsed("SP_MarkPasswordResetCodeAsUsed", con, code);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["RowsAffected"]) > 0;
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
    // Create the SqlCommand using a stored procedure for marking password reset code as used
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureMarkPasswordResetCodeAsUsed(string spName, SqlConnection con, string code)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@Code", code);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method revokes all user refresh tokens
    //--------------------------------------------------------------------------------------------------
    public int RevokeAllUserRefreshTokens(int userId, string reason)
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

        cmd = CreateCommandWithStoredProcedureRevokeAllUserRefreshTokens("SP_RevokeAllUserRefreshTokens", con, userId, reason);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["RevokedCount"]);
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
    // Create the SqlCommand using a stored procedure for revoking all user refresh tokens
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRevokeAllUserRefreshTokens(string spName, SqlConnection con, int userId, string reason)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Reason", reason);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // This method handles re-registration of unverified accounts
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message) HandleUnverifiedAccountReregistration(string email)
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

        cmd = CreateCommandWithStoredProcedureHandleUnverifiedAccountReregistration("SP_HandleUnverifiedAccountReregistration", con, email);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }
            else
            {
                return (false, "No result returned");
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
    // Create the SqlCommand using a stored procedure for handling unverified account re-registration
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureHandleUnverifiedAccountReregistration(string spName, SqlConnection con, string email)
    {
        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        cmd.Parameters.AddWithValue("@Email", email);

        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get all eligible events for a user
    //--------------------------------------------------------------------------------------------------
    public List<EventForRecommendation> GetEligibleEventsForUser(int userId)
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

        cmd = CreateCommandWithStoredProcedureGetEligibleEvents("SP_GetEligibleEventsForUser", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            List<EventForRecommendation> eligibleEventsList = new List<EventForRecommendation>();

            while (dataReader.Read())
            {
                var eventData = new EventForRecommendation
                {
                    EventId = Convert.ToInt32(dataReader["EventId"]),
                    EventName = dataReader["EventName"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    StartDatetime = Convert.ToDateTime(dataReader["StartDatetime"]),
                    EndDatetime = Convert.ToDateTime(dataReader["EndDatetime"]),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    SportId = Convert.ToInt32(dataReader["SportId"]),
                    MinAge = Convert.ToInt32(dataReader["MinAge"]),
                    Gender = dataReader["Gender"].ToString(),
                    Description = dataReader["Description"].ToString()
                };
                eligibleEventsList.Add(eventData);
            }

            return eligibleEventsList;
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
    // Create the SqlCommand for getting eligible events
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEligibleEvents(string spName, SqlConnection con, int userId)
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
    // Register or update user push notification token
    //--------------------------------------------------------------------------------------------------
    public bool RegisterOrUpdatePushToken(int userId, string pushToken, string deviceId, string platform)
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

        cmd = CreateCommandWithStoredProcedureRegisterOrUpdatePushToken("SP_RegisterOrUpdateUserPushNotificationToken", con, userId, pushToken, deviceId, platform);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["Success"]);
            }

            return false;
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
    // Create the SqlCommand for registering or updating push token
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRegisterOrUpdatePushToken(string spName, SqlConnection con, int userId, string pushToken, string deviceId, string platform)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@PushToken", pushToken);
        cmd.Parameters.AddWithValue("@DeviceId", deviceId);
        cmd.Parameters.AddWithValue("@Platform", platform);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get active push tokens for users
    //--------------------------------------------------------------------------------------------------
    public List<UserPushNotificationToken> GetActivePushTokensForUsers(List<int> userIds)
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

        cmd = CreateCommandWithStoredProcedureGetActivePushTokens("SP_GetActiveUserPushNotificationTokens", con, string.Join(",", userIds));

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            List<UserPushNotificationToken> tokens = new List<UserPushNotificationToken>();

            while (dataReader.Read())
            {
                var token = new UserPushNotificationToken
                {
                    TokenId = Convert.ToInt32(dataReader["TokenId"]),
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    PushToken = dataReader["PushToken"].ToString(),
                    DeviceId = dataReader["DeviceId"].ToString(),
                    Platform = dataReader["Platform"].ToString(),
                    FailureCount = Convert.ToInt32(dataReader["FailureCount"])
                };
                tokens.Add(token);
            }

            return tokens;
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
    // Create the SqlCommand for getting active push tokens
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetActivePushTokens(string spName, SqlConnection con, string userIds)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserIds", userIds);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get event notification recipients
    //--------------------------------------------------------------------------------------------------
    public List<int> GetEventNotificationRecipients(int eventId, string recipientType)
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

        cmd = CreateCommandWithStoredProcedureGetEventNotificationRecipients("SP_GetEventNotificationRecipients", con, eventId, recipientType);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            List<int> recipients = new List<int>();

            while (dataReader.Read())
            {
                recipients.Add(Convert.ToInt32(dataReader["UserId"]));
            }

            return recipients;
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
    // Create the SqlCommand for getting event notification recipients
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventNotificationRecipients(string spName, SqlConnection con, int eventId, string recipientType)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@EventId", eventId);
        cmd.Parameters.AddWithValue("@RecipientType", recipientType);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get group notification recipients
    //--------------------------------------------------------------------------------------------------
    public List<int> GetGroupNotificationRecipients(int groupId)
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

        cmd = CreateCommandWithStoredProcedureGetGroupNotificationRecipients("SP_GetGroupNotificationRecipients", con, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);
            List<int> recipients = new List<int>();

            while (dataReader.Read())
            {
                recipients.Add(Convert.ToInt32(dataReader["UserId"]));
            }

            return recipients;
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
    // Create the SqlCommand for getting group notification recipients
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupNotificationRecipients(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@GroupId", groupId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Save notification history
    //--------------------------------------------------------------------------------------------------
    public void SaveNotificationHistory(int userId, string title, string body, string notificationData, string notificationType, int? relatedEntityId, string relatedEntityType)
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

        cmd = CreateCommandWithStoredProcedureSaveNotificationHistory("SP_SaveNotificationHistory", con, userId, title, body, notificationData, notificationType, relatedEntityId, relatedEntityType);

        try
        {
            cmd.ExecuteNonQuery();
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
    // Create the SqlCommand for saving notification history
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSaveNotificationHistory(string spName, SqlConnection con, int userId, string title, string body, string notificationData, string notificationType, int? relatedEntityId, string relatedEntityType)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@Title", title);
        cmd.Parameters.AddWithValue("@Body", body);
        cmd.Parameters.AddWithValue("@NotificationData", notificationData ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@NotificationType", notificationType ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@RelatedEntityId", relatedEntityId ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@RelatedEntityType", relatedEntityType ?? (object)DBNull.Value);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Mark push token as invalid
    //--------------------------------------------------------------------------------------------------
    public void MarkPushTokenAsInvalid(string pushToken)
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

        cmd = CreateCommandWithStoredProcedureMarkPushTokenAsInvalid("SP_MarkPushTokenAsInvalid", con, pushToken);

        try
        {
            cmd.ExecuteNonQuery();
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
    // Create the SqlCommand for marking push token as invalid
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureMarkPushTokenAsInvalid(string spName, SqlConnection con, string pushToken)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@PushToken", pushToken);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Increment token failure count
    //--------------------------------------------------------------------------------------------------
    public void IncrementTokenFailureCount(string pushToken)
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

        cmd = CreateCommandWithStoredProcedureIncrementTokenFailureCount("SP_IncrementTokenFailureCount", con, pushToken);

        try
        {
            cmd.ExecuteNonQuery();
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
    // Create the SqlCommand for incrementing token failure count
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIncrementTokenFailureCount(string spName, SqlConnection con, string pushToken)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@PushToken", pushToken);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get user ID from group join request
    //--------------------------------------------------------------------------------------------------
    public int GetUserIdFromGroupJoinRequest(int requestId)
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

        cmd = CreateCommandWithStoredProcedureGetUserIdFromGroupJoinRequest("SP_GetUserIdFromGroupJoinRequest", con, requestId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToInt32(dataReader["RequesterUserId"]);
            }

            return 0;
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
    // Create the SqlCommand for getting user ID from group join request
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserIdFromGroupJoinRequest(string spName, SqlConnection con, int requestId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@RequestId", requestId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get user notification history with pagination
    //--------------------------------------------------------------------------------------------------
    public NotificationHistoryResult GetUserNotificationHistoryPaginated(int userId, int pageNumber, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        var result = new NotificationHistoryResult
        {
            Notifications = new List<NotificationHistoryItem>(),
            TotalCount = 0,
            HasMore = false
        };

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        try
        {
            cmd = CreateCommandWithStoredProcedureGetUserNotificationHistoryPaginated("SP_GetUserNotificationHistoryPaginated", con, userId, pageNumber, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader();

            // Read first result set (notifications)
            while (dataReader.Read())
            {
                var notification = new NotificationHistoryItem
                {
                    NotificationId = Convert.ToInt32(dataReader["NotificationId"]),
                    UserId = userId,
                    Title = dataReader["Title"].ToString(),
                    Body = dataReader["Body"].ToString(),
                    NotificationData = dataReader["NotificationData"]?.ToString() ?? "",
                    SentAt = Convert.ToDateTime(dataReader["SentAt"]),
                    IsRead = Convert.ToBoolean(dataReader["IsRead"]),
                    ReadAt = dataReader["ReadAt"] != DBNull.Value ? Convert.ToDateTime(dataReader["ReadAt"]) : (DateTime?)null,
                    NotificationType = dataReader["NotificationType"]?.ToString() ?? "",
                    RelatedEntityId = dataReader["RelatedEntityId"] != DBNull.Value ? Convert.ToInt32(dataReader["RelatedEntityId"]) : (int?)null,
                    RelatedEntityType = dataReader["RelatedEntityType"]?.ToString() ?? ""
                };
                result.Notifications.Add(notification);
            }

            // Check if we have more records than pageSize
            if (result.Notifications.Count > pageSize)
            {
                result.HasMore = true;
                result.Notifications.RemoveAt(result.Notifications.Count - 1); // Remove extra record
            }

            // Move to second result set (total count)
            if (dataReader.NextResult() && dataReader.Read())
            {
                result.TotalCount = Convert.ToInt32(dataReader["TotalCount"]);
                result.UnreadCount = Convert.ToInt32(dataReader["UnreadCount"]);
            }

            return result;
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
    // Create the SqlCommand for getting paginated notification history
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetUserNotificationHistoryPaginated(
        string spName, SqlConnection con, int userId, int pageNumber, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@PageNumber", pageNumber);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Mark notification as read
    //--------------------------------------------------------------------------------------------------
    public bool MarkNotificationAsRead(int notificationId, int userId)
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

        cmd = CreateCommandWithStoredProcedureMarkNotificationAsRead("SP_MarkNotificationAsRead", con, notificationId, userId);

        try
        {
            cmd.ExecuteNonQuery();
            return true;
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
    // Create the SqlCommand for marking notification as read
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureMarkNotificationAsRead(string spName, SqlConnection con, int notificationId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@NotificationId", notificationId);
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get event name by ID
    //--------------------------------------------------------------------------------------------------
    public string GetEventName(int eventId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureGetEventName("SP_GetEventName", con, eventId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return dataReader["EventName"].ToString();
            }

            return "Unknown Event";

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
    // Create the SqlCommand for getting event name
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetEventName(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@EventId", eventId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get group name by ID
    //--------------------------------------------------------------------------------------------------
    public string GetGroupName(int groupId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureGetGroupName("SP_GetGroupName", con, groupId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return dataReader["GroupName"].ToString();
            }

            return "Unknown Group";

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
    // Create the SqlCommand for getting group name
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupName(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@GroupId", groupId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Delete notification
    //--------------------------------------------------------------------------------------------------
    public bool DeleteNotification(int notificationId, int userId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureDeleteNotification("SP_DeleteNotification", con, notificationId, userId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                int deleted = Convert.ToInt32(dataReader["Deleted"]);
                return deleted > 0;
            }

            return false;
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
    // Create the SqlCommand for deleting notification
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureDeleteNotification(string spName, SqlConnection con, int notificationId, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@NotificationId", notificationId);
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Add new sport
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message, int SportId) AddSport(string sportName, string sportImage)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureAddSport("SP_AddSport", con, sportName, sportImage);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                int sportId = Convert.ToInt32(dataReader["SportId"]);
                return (success, message, sportId);
            }

            return (false, "Failed to add sport", 0);
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
    // Create the SqlCommand for adding sport
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureAddSport(string spName, SqlConnection con, string sportName, string sportImage)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@SportName", sportName);
        cmd.Parameters.AddWithValue("@SportImage", sportImage);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Update sport image
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message) UpdateSportImage(int sportId, string sportImage)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureUpdateSportImage("SP_UpdateSportImage", con, sportId, sportImage);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Failed to update sport image");
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
    // Create the SqlCommand for updating sport image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateSportImage(string spName, SqlConnection con, int sportId, string sportImage)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@SportId", sportId);
        cmd.Parameters.AddWithValue("@SportImage", sportImage);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Delete sport
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message, string SportImage) DeleteSport(int sportId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureDeleteSport("SP_DeleteSport", con, sportId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                string sportImage = dataReader["SportImage"]?.ToString();
                return (success, message, sportImage);
            }

            return (false, "Failed to delete sport", null);
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
    // Create the SqlCommand for deleting sport
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureDeleteSport(string spName, SqlConnection con, int sportId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@SportId", sportId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Get sport image
    //--------------------------------------------------------------------------------------------------
    public string GetSportImage(int sportId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureGetSportImage("SP_GetSportImage", con, sportId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return dataReader["SportImage"]?.ToString();
            }

            return null;
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
    // Create the SqlCommand for getting sport image
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetSportImage(string spName, SqlConnection con, int sportId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@SportId", sportId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Add city organizer
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message) AddCityOrganizer(int userId, int cityId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureAddCityOrganizer("SP_AddCityOrganizer", con, userId, cityId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Failed to add city organizer");
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
    // Create the SqlCommand for adding city organizer
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureAddCityOrganizer(string spName, SqlConnection con, int userId, int cityId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@CityId", cityId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Remove city organizer
    //--------------------------------------------------------------------------------------------------
    public (bool Success, string Message) RemoveCityOrganizer(int userId, int cityId)
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

        try
        {
            cmd = CreateCommandWithStoredProcedureRemoveCityOrganizer("SP_RemoveCityOrganizer", con, userId, cityId);

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                bool success = Convert.ToBoolean(dataReader["Success"]);
                string message = dataReader["Message"].ToString();
                return (success, message);
            }

            return (false, "Failed to remove city organizer");
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
    // Create the SqlCommand for removing city organizer
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureRemoveCityOrganizer(string spName, SqlConnection con, int userId, int cityId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@CityId", cityId);
        return cmd;
    }

    //--------------------------------------------------------------------------------------------------
    // Search city organizers with filters and pagination
    //--------------------------------------------------------------------------------------------------
    public CityOrganizerSearchResult SearchCityOrganizers(string query, int? cityId, int pageNumber, int pageSize)
    {
        SqlConnection con;
        SqlCommand cmd;
        var result = new CityOrganizerSearchResult
        {
            Organizers = new List<CityOrganizerDetails>(),
            TotalCount = 0,
            HasMore = false
        };

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw (ex);
        }

        try
        {
            cmd = CreateCommandWithStoredProcedureSearchCityOrganizers("SP_SearchCityOrganizers", con, query, cityId, pageNumber, pageSize);

            SqlDataReader dataReader = cmd.ExecuteReader();

            // Read first result set (organizers)
            while (dataReader.Read())
            {
                result.Organizers.Add(new CityOrganizerDetails
                {
                    UserId = Convert.ToInt32(dataReader["UserId"]),
                    FirstName = dataReader["FirstName"].ToString(),
                    LastName = dataReader["LastName"].ToString(),
                    Email = dataReader["Email"].ToString(),
                    ProfileImage = dataReader["ProfileImage"].ToString(),
                    CityId = Convert.ToInt32(dataReader["CityId"]),
                    IsSuperAdmin = Convert.ToBoolean(dataReader["IsSuperAdmin"])
                });
            }

            // Check if we have more records than pageSize (for hasMore flag)
            if (result.Organizers.Count > pageSize)
            {
                result.HasMore = true;
                result.Organizers.RemoveAt(result.Organizers.Count - 1); // Remove the extra record
            }

            // Move to second result set (total count)
            if (dataReader.NextResult() && dataReader.Read())
            {
                result.TotalCount = Convert.ToInt32(dataReader["TotalCount"]);
            }

            return result;
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
    // Create the SqlCommand for searching city organizers
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureSearchCityOrganizers(string spName, SqlConnection con, string query, int? cityId, int pageNumber, int pageSize)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@Query", (object)query ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CityId", (object)cityId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@PageNumber", pageNumber);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Increment refresh token use count
    //---------------------------------------------------------------------------------
    public bool IncrementRefreshTokenUseCount(string token)
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

        cmd = CreateCommandWithStoredProcedureIncrementUseCount("SP_IncrementRefreshTokenUseCount", con, token);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                int updatedRows = Convert.ToInt32(dataReader["UpdatedRows"]);
                return updatedRows > 0;
            }

            return false;
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
    // Create the SqlCommand for incrementing use count
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureIncrementUseCount(string spName, SqlConnection con, string token)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Token", token);
        return cmd;
    }

    //---------------------------------------------------------------------------------
    // Check if user is eligible for authentication operations
    //---------------------------------------------------------------------------------
    public bool IsUserEligibleForAuth(int userId)
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

        cmd = CreateCommandWithStoredProcedureCheckEligibility("SP_IsUserEligibleForAuth", con, userId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                return Convert.ToBoolean(dataReader["IsEligible"]);
            }

            return false;
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
    // Create the SqlCommand for checking eligibility
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureCheckEligibility(string spName, SqlConnection con, int userId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@UserId", userId);
        return cmd;
    }

}