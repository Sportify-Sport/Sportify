﻿namespace Backend.Models
{
    public class AuthResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        // public bool IsEmailVerified { get; set; }
    }
}
