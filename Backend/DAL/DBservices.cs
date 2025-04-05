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
                        IsGroupAdmin = false,
                        IsCityOrganizer = false,
                        AdminForGroups = new List<int>(),
                        OrganizerForCities = new List<int>()
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
        GetUserAdminGroups(user);

        // Check if user is city organizer and get organizer cities
        GetUserOrganizerCities(user);

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
    // This method retrieves 3 Groups that the user joined to
    //--------------------------------------------------------------------------------------------------
    public List<object> GetTop3UserGroups(int userId)
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

        cmd = CreateCommandWithStoredProcedureGetTop3UserGroups("SP_GetTop3UserGroups", con, userId);

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
    // Create the SqlCommand for getting 3 groups for the user
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetTop3UserGroups(string spName, SqlConnection con, int userId)
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









    //--------------------------------------------------------------------------------------------------
    // This method retrieves complete information for a specific group
    //--------------------------------------------------------------------------------------------------
    public Group GetGroupDetails(int groupId)
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

        cmd = CreateCommandWithStoredProcedureGetGroupDetails("SP_GetGroupDetails", con, groupId);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                string groupImage = dataReader["GroupImage"] == DBNull.Value || string.IsNullOrEmpty(dataReader["GroupImage"].ToString())
                ? "default_group.png"
                : dataReader["GroupImage"].ToString();

                Group group = new Group(
                    Convert.ToInt32(dataReader["GroupId"]),
                    dataReader["GroupName"].ToString(),
                    dataReader["Description"].ToString(),
                    Convert.ToInt32(dataReader["SportId"]),
                    groupImage,
                    Convert.ToInt32(dataReader["CityId"]),
                    Convert.ToDateTime(dataReader["FoundedAt"]),
                    Convert.ToInt32(dataReader["MaxMemNum"]),
                    Convert.ToInt32(dataReader["TotalMembers"]),
                    Convert.ToInt32(dataReader["MinAge"]),
                    dataReader["Gender"].ToString(),
                    Convert.ToInt32(dataReader["Matches"]),
                    Convert.ToInt32(dataReader["Wins"]),
                    Convert.ToInt32(dataReader["Loses"])
                );

                return group;
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
    // Create the SqlCommand for retrieving group details
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGetGroupDetails(string spName, SqlConnection con, int groupId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@groupId", groupId);
        return cmd;
    }

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
    public Event GetEventDetails(int eventId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureEventDetails("SP_GetEventDetails", con, eventId);

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
                eventDetails.WaxParticipants = dataReader["MaxParticipants"] == DBNull.Value ? null : (int?)Convert.ToInt32(dataReader["MaxParticipants"]);
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
    private SqlCommand CreateCommandWithStoredProcedureEventDetails(string spName, SqlConnection con, int eventId)
    {
        SqlCommand cmd = new SqlCommand();
        cmd.Connection = con;
        cmd.CommandText = spName;
        cmd.CommandTimeout = 10;
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@eventId", eventId);
        return cmd;
    }
}