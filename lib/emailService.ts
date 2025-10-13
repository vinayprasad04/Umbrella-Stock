// Email service utility for sending verification emails
// Note: This uses console.log for development. In production, integrate with services like:
// - Nodemailer with SMTP
// - SendGrid
// - AWS SES
// - Resend
// etc.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For development: Log email details
    console.log('📧 Email would be sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html);
    console.log('---');

    // TODO: In production, replace this with actual email sending service
    // Example with Nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    */

    // Simulate successful email send
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function generateVerificationEmail(email: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #FF6B2C 0%, #FF8A50 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Umbrella Stock</h1>
                  <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Welcome to our community!</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>

                  <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Thank you for subscribing to Umbrella Stock! To complete your subscription and start receiving market insights, investment updates, and exclusive content, please verify your email address.
                  </p>

                  <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                    Click the button below to verify your email:
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #FF6B2C 0%, #FF8A50 100%); border-radius: 6px; padding: 16px 40px;">
                        <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    If you didn't subscribe to Umbrella Stock, you can safely ignore this email.
                  </p>

                  <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${verificationUrl}" style="color: #FF6B2C; word-break: break-all;">${verificationUrl}</a>
                  </p>

                  <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #4b5563; font-size: 14px; font-weight: 600;">What you'll receive:</p>
                    <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      <li>Market insights and analysis</li>
                      <li>Platform updates and new features</li>
                      <li>Exclusive tips and resources</li>
                      <li>Investment opportunities</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                  <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} Umbrella Stock. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    This email was sent to ${email}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
