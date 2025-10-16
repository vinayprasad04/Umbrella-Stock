import nodemailer from 'nodemailer';
import EmailTemplate from './models/EmailTemplate';
import connectDB from './mongodb';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Validate email credentials
function validateEmailConfig(): { valid: boolean; error?: string } {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
    return {
      valid: false,
      error: 'Email credentials not configured. Please set EMAIL_USER in your .env.local file with your Gmail address.'
    };
  }

  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-specific-password') {
    return {
      valid: false,
      error: 'Email password not configured. Please set EMAIL_PASS in your .env.local file with your Gmail App Password. Visit https://support.google.com/accounts/answer/185833 to generate one.'
    };
  }

  return { valid: true };
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // First, validate credentials are configured
    const validation = validateEmailConfig();
    if (!validation.valid) {
      console.error('❌ Email configuration error:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    console.log('📧 Sending email to:', options.to);

    const info = await transporter.sendMail({
      from: `"Umbrella Stock" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);

    // Parse specific error messages from nodemailer/Gmail
    let errorMessage = 'Failed to send email. Please try again later.';

    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please verify your EMAIL_USER and EMAIL_PASS are correct. Make sure you\'re using a Gmail App Password, not your regular password.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Failed to connect to Gmail servers. Please check your internet connection.';
    } else if (error.responseCode === 535) {
      errorMessage = 'Invalid Gmail credentials. Please check your App Password and ensure 2-Step Verification is enabled on your Google account.';
    } else if (error.message) {
      errorMessage = `Email error: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

export async function generateVerificationEmail(email: string, verificationUrl: string): Promise<string> {
  try {
    // Try to fetch custom template from database
    await connectDB();
    const template = await EmailTemplate.findOne({ name: 'verification', isActive: true });

    if (template) {
      // Use custom template
      const gradientEnd = adjustColor(template.primaryColor, 20); // Lighter shade for gradient
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${template.primaryColor} 0%, ${gradientEnd} 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Umbrella Stock</h1>
                      <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Welcome to our community!</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">${template.heading}</h2>

                      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                        ${template.bodyText}
                      </p>

                      <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Click the button below to verify your email:
                      </p>

                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, ${template.primaryColor} 0%, ${gradientEnd} 100%); border-radius: 6px; padding: 16px 40px;">
                            <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                              ${template.buttonText}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        ${template.footerText}
                      </p>

                      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                        Or copy and paste this link into your browser:<br>
                        <a href="${verificationUrl}" style="color: ${template.primaryColor}; word-break: break-all;">${verificationUrl}</a>
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
  } catch (error) {
    console.log('Using default email template:', error);
  }

  // Fallback to default template
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

// Helper function to adjust color brightness
function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}
