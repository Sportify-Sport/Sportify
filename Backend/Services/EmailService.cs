using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace Backend.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendWelcomeEmailWithVerificationAsync(string toEmail, string firstName, string verificationCode)
        {
            var subject = "Welcome to Sportify! Please verify your email";
            var body = GetWelcomeEmailTemplate(firstName, verificationCode);
            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendEmailVerificationAsync(string toEmail, string firstName, string verificationCode)
        {
            var subject = "Verify your Sportify email address";
            var body = GetVerificationEmailTemplate(firstName, verificationCode);
            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetCodeAsync(string toEmail, string firstName, string resetCode)
        {
            var subject = "Your Sportify password reset code";
            var body = GetPasswordResetTemplate(firstName, resetCode);
            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendPasswordChangedNotificationAsync(string toEmail, string firstName)
        {
            var subject = "Your Sportify password has been changed";
            var body = GetPasswordChangedTemplate(firstName);
            await SendEmailAsync(toEmail, subject, body);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_configuration["Email:FromName"], _configuration["Email:FromAddress"]));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                message.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

                using var client = new SmtpClient();
                await client.ConnectAsync(_configuration["Email:SmtpHost"], int.Parse(_configuration["Email:SmtpPort"]), SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_configuration["Email:SmtpUser"], _configuration["Email:SmtpPassword"]);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                throw;
            }
        }

        private string GetEmailLayout(string content, string preheader = "")
        {
            return $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <meta http-equiv='X-UA-Compatible' content='IE=edge'>
    <title>Sportify</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @media screen and (max-width: 600px) {{
            .container {{ width: 100% !important; }}
            .content {{ padding: 20px !important; }}
            h1 {{ font-size: 24px !important; }}
            .code-box {{ padding: 15px !important; }}
            .code {{ font-size: 28px !important; }}
        }}
    </style>
</head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f7fa;'>
    <div style='display: none; max-height: 0; overflow: hidden;'>{preheader}</div>
    <table role='presentation' cellspacing='0' cellpadding='0' border='0' width='100%'>
        <tr>
            <td align='center' style='padding: 40px 0;'>
                <table class='container' role='presentation' cellspacing='0' cellpadding='0' border='0' width='600' style='background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
                    {content}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string GetWelcomeEmailTemplate(string firstName, string verificationCode)
        {
            var content = $@"
                <tr>
                    <td style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;'>Welcome to Sportify! 🏃‍♂️</h1>
                    </td>
                </tr>
                <tr>
                    <td class='content' style='padding: 40px;'>
                        <p style='margin: 0 0 20px 0; font-size: 18px; color: #333333;'>Hi {firstName},</p>
                        <p style='margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            Welcome to Sportify! We're excited to have you join our sports community. 
                            To get started, please verify your email address using the code below:
                        </p>
                        <div class='code-box' style='background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;'>
                            <p style='margin: 0 0 10px 0; font-size: 14px; color: #666666;'>Your verification code:</p>
                            <div class='code' style='font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;'>{verificationCode}</div>
                            <p style='margin: 10px 0 0 0; font-size: 14px; color: #999999;'>This code expires in 15 minutes</p>
                        </div>
                        <p style='margin: 30px 0 0 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            Once verified, you'll be able to:
                        </p>
                        <ul style='margin: 10px 0 30px 0; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #555555;'>
                            <li>Join sports groups in your area</li>
                            <li>Participate in events</li>
                            <li>Connect with other sports enthusiasts</li>
                            <li>Track your sports activities</li>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <td style='background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;'>
                        <p style='margin: 0; font-size: 14px; color: #999999;'>
                            If you didn't create this account, please ignore this email.
                        </p>
                    </td>
                </tr>";

            return GetEmailLayout(content, "Welcome to Sportify! Verify your email to get started.");
        }

        private string GetVerificationEmailTemplate(string firstName, string verificationCode)
        {
            var content = $@"
                <tr>
                    <td style='background-color: #667eea; padding: 40px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px;'>Verify Your Email</h1>
                    </td>
                </tr>
                <tr>
                    <td class='content' style='padding: 40px;'>
                        <p style='margin: 0 0 20px 0; font-size: 18px; color: #333333;'>Hi {firstName},</p>
                        <p style='margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            Please use the code below to verify your email address:
                        </p>
                        <div class='code-box' style='background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;'>
                            <div class='code' style='font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;'>{verificationCode}</div>
                            <p style='margin: 10px 0 0 0; font-size: 14px; color: #999999;'>This code expires in 15 minutes</p>
                        </div>
                    </td>
                </tr>";

            return GetEmailLayout(content, "Verify your Sportify email address");
        }

        private string GetPasswordResetTemplate(string firstName, string resetCode)
        {
            var content = $@"
                <tr>
                    <td style='background-color: #f39c12; padding: 40px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px;'>Password Reset Request</h1>
                    </td>
                </tr>
                <tr>
                    <td class='content' style='padding: 40px;'>
                        <p style='margin: 0 0 20px 0; font-size: 18px; color: #333333;'>Hi {firstName},</p>
                        <p style='margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            We received a request to reset your password. Use the code below to complete the process:
                        </p>
                        <div class='code-box' style='background-color: #fff3cd; border: 2px dashed #f39c12; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;'>
                            <div class='code' style='font-size: 36px; font-weight: bold; color: #f39c12; letter-spacing: 8px;'>{resetCode}</div>
                            <p style='margin: 10px 0 0 0; font-size: 14px; color: #856404;'>This code expires in 10 minutes</p>
                        </div>
                        <p style='margin: 30px 0 0 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                    </td>
                </tr>";

            return GetEmailLayout(content, "Reset your Sportify password");
        }

        private string GetPasswordChangedTemplate(string firstName)
        {
            var content = $@"
                <tr>
                    <td style='background-color: #28a745; padding: 40px; text-align: center;'>
                        <h1 style='margin: 0; color: #ffffff; font-size: 28px;'>Password Changed Successfully</h1>
                    </td>
                </tr>
                <tr>
                    <td class='content' style='padding: 40px;'>
                        <p style='margin: 0 0 20px 0; font-size: 18px; color: #333333;'>Hi {firstName},</p>
                        <p style='margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555555;'>
                            Your password has been successfully changed. For security reasons, all your other devices have been logged out.
                        </p>
                        <div style='background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 20px; margin: 20px 0;'>
                            <p style='margin: 0; font-size: 16px; color: #155724;'>
                                <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
                            </p>
                        </div>
                    </td>
                </tr>";

            return GetEmailLayout(content, "Your Sportify password has been changed");
        }
    }
}
