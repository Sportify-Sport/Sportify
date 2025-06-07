namespace Backend.Services
{
    public interface IEmailService
    {
        Task SendWelcomeEmailWithVerificationAsync(string toEmail, string firstName, string verificationCode);
        Task SendEmailVerificationAsync(string toEmail, string firstName, string verificationCode);
        Task SendPasswordResetCodeAsync(string toEmail, string firstName, string resetCode);
        Task SendPasswordChangedNotificationAsync(string toEmail, string firstName);
    }
}
