import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { sendEmail } from '@/lib/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === 'POST') {
    try {
      const { name, email, subject, message } = req.body;

      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      // Create contact submission
      const contact = await Contact.create({
        name,
        email,
        subject,
        message,
        status: 'new',
      });

      // Send thank you email to user
      try {
        await sendEmail({
          to: email,
          subject: 'Thank you for contacting Umbrella Stock',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Thank You for Contacting Us!</h1>
                </div>
                <div class="content">
                  <p>Dear ${name},</p>
                  <p>Thank you for reaching out to Umbrella Stock. We have received your message and our team will review it shortly.</p>

                  <p><strong>Your Message Details:</strong></p>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>

                  <p>We aim to respond to all inquiries within 24-48 hours. If your matter is urgent, please feel free to call us at +91 123 456 7890.</p>

                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="button">Visit Our Website</a>

                  <p style="margin-top: 30px;">Best regards,<br><strong>Umbrella Stock Team</strong></p>
                </div>
                <div class="footer">
                  <p>This is an automated message, please do not reply to this email.</p>
                  <p>&copy; ${new Date().getFullYear()} Umbrella Stock. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send thank you email:', emailError);
        // Don't fail the request if email fails
      }

      // Send notification email to admin (optional)
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@umbrellastock.com',
          subject: `New Contact Form Submission: ${subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError);
      }

      return res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!',
        contact: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          subject: contact.subject,
        },
      });
    } catch (error: any) {
      console.error('Contact form submission error:', error);

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map((err: any) => err.message),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to submit contact form. Please try again later.',
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }
}
