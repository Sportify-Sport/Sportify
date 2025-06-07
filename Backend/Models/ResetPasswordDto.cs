namespace Backend.Models
{
    public class ResetPasswordDto
    {
        public string Code { get; set; }
        public string NewPassword { get; set; }

    }
}
