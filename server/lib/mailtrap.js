import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_API_TOKEN;
const clientURL = process.env.NODE_ENV === 'production' ? 
    process.env.CLIENT_URL :
    process.env.CLIENT_URL_DEVELOPMENT

const client = new MailtrapClient({
    token: TOKEN,
    testInboxId: 4416679,
    sandbox: true,
});

const sender = {
    email: "finwise@support.com",
    name: "Finwise",
};

export const sendVerificationEmail = (email, token) => {
    const recipients = [{ email }]
    const verificationLink = `${clientURL}/verifying-email?token=${token}`

    client.send({
        from: sender,
        to: recipients,
        subject: "Verify your email",
        html: VERIFICATION_EMAIL_TEMPLATE.replace(
            '{verificationLink}',
            verificationLink
        ),
        category: "Email verification",
    }).then(console.log, console.error);
}

const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your FinWise Account</title>
    <style>
        /* Mobile Responsive Styles */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; padding: 20px !important; }
            .button { width: 100% !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b121e; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b121e;">
        <tr>
            <td align="center" style="padding: 40px 0 20px 0;">
                <!-- Logo -->
                <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
                    <span style="color: #ffffff;">Fin</span><span style="color: rgb(16, 185, 129);">Wise</span>
                </h1>
                <!-- Canadian Badge -->
                <p style="color: #4b5563; font-size: 12px; margin-top: 10px;">
                    📍 Proudly serving Canadian investors
                </p>
            </td>
        </tr>
        <tr>
            <td align="center">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #111827; border-radius: 12px; border: 1px solid #1f2937;">
                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">Verify your email</h2>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #9ca3af;">
                                Welcome to FinWise. You're one step away from smarter, AI-powered investment insights. Please confirm your email address to secure your account.
                                This link will expire in 1 hour.
                            </p>
                            
                            <!-- Gradient Button -->
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="border-radius: 8px;" bgcolor="#00d1d1">
                                        <a href="{verificationLink}" target="_blank" style="font-size: 16px; font-weight: bold; color: #0b121e; text-decoration: none; padding: 15px 35px; border-radius: 8px; display: inline-block; background: linear-gradient(90deg, #22d3ee 0%, #10b981 100%);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280;">
                                If you didn't create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td align="center" style="padding: 40px 0;">
                <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.5;">
                    &copy; 2026 FinWise Canada. All rights reserved.<br>
                    Smart insights for Mutual Funds & ETFs.<br>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`
