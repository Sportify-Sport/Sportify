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

    //---------------------------------------------------------------------------------
    // This method updates a user's profile information 
    //---------------------------------------------------------------------------------
    public object UpdateUserProfile(int userId, UserUpdateModel model, string imageFileName)
    {
        SqlConnection con = null;

        try
        {
            con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureUpdateUserProfile("SP_UpdateUserProfile", con, userId, model, imageFileName);

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
                    Bio = dataReader["Bio"] == DBNull.Value ? "" : dataReader["Bio"].ToString(),
                    Gender = dataReader["Gender"].ToString(),
                    ProfileImage = dataReader["ProfileImage"] == DBNull.Value ? "" : dataReader["ProfileImage"].ToString()
                };
            }

            return null;
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
    // Create the SqlCommand for updating user profile data
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureUpdateUserProfile(string spName, SqlConnection con, int userId, UserUpdateModel model, string imageFileName)
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
}