namespace Backend.Models
{
    public class RefreshToken
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime Created { get; set; }
        public DateTime? Revoked { get; set; }
        public string ReplacedByToken { get; set; }
        public string ReasonRevoked { get; set; }
        public int UseCount { get; set; }


        // Computed properties
        public bool IsExpired => DateTime.UtcNow >= ExpiryDate;
        public bool IsActive => Revoked == null && !IsExpired;
    }
}
