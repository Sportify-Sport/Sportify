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
                    EventImage = dataReader["ProfileImage"].ToString(), // Fixed variable name to match DB column

                    // Location information
                    LocationName = dataReader["LocationName"] == DBNull.Value ? null : dataReader["LocationName"].ToString(),
                    Latitude = dataReader["Latitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Latitude"]),
                    Longitude = dataReader["Longitude"] == DBNull.Value ? null : (double?)Convert.ToDouble(dataReader["Longitude"]),

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
        string age = null,
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
            SqlCommand cmd = CreateCommandWithStoredProcedureSearchGroups(
                "SP_SearchGroups", con, name, sportId, cityId, age, gender, page, pageSize);

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
        string age = null,
        string gender = null,
        DateTime? startDate = null,
        int page = 1,
        int pageSize = 10)
    {
        SqlConnection con = null;
        List<object> events = new List<object>();
        bool hasMore = false;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureSearchEvents(
                "SP_SearchEvents", con, name, sportId, cityId, age, gender, startDate, page, pageSize);

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
        string age,
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

        if (!string.IsNullOrEmpty(age))
            cmd.Parameters.AddWithValue("@age", age);
        else
            cmd.Parameters.AddWithValue("@age", DBNull.Value);

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
        string age,
        string gender,
        DateTime? startDate,
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

        if (!string.IsNullOrEmpty(age))
            cmd.Parameters.AddWithValue("@age", age);
        else
            cmd.Parameters.AddWithValue("@age", DBNull.Value);

        if (!string.IsNullOrEmpty(gender))
            cmd.Parameters.AddWithValue("@gender", gender);
        else
            cmd.Parameters.AddWithValue("@gender", DBNull.Value);

        if (startDate.HasValue)
            cmd.Parameters.AddWithValue("@startDate", startDate.Value);
        else
            cmd.Parameters.AddWithValue("@startDate", DBNull.Value);

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
            SqlCommand cmd = CreateCommandWithStoredProcedureGetGroupMembers(
                "SP_GetGroupMembers", con, groupId, page, pageSize);

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
                    Gender = dataReader["Gender"].ToString()
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
            SqlCommand cmd = CreateCommandWithStoredProcedureApproveJoinRequest(
                "SP_ApproveJoinRequest", con, requestId, groupId);

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
    private SqlCommand CreateCommandWithStoredProcedureApproveJoinRequest(
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
    // This method rejects a join request
    //---------------------------------------------------------------------------------
    public bool RejectJoinRequest(int requestId, int groupId)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB"); // create the connection
            SqlCommand cmd = CreateCommandWithStoredProcedureRejectJoinRequest(
                "SP_RejectJoinRequest", con, requestId, groupId);

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
                    Gender = dataReader["Gender"].ToString()
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
}