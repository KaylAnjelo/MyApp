const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Check which email service is configured
    this.useResend = !!process.env.RESEND_API_KEY;
    this.useBrevoAPI = !!process.env.BREVO_API_KEY;
    
    if (this.useResend) {
      console.log('✅ Using Resend API for emails');
    } else if (this.useBrevoAPI) {
      console.log('✅ Using Brevo API for emails');
    } else {
      console.log('⚠️ No API key configured - email service will not work');
    }
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  async sendOTP(email, otp) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7D0006;">Email Verification</h2>
        <p>Thank you for signing up with Suki App!</p>
        <p>Your verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #7D0006; border-radius: 8px;">
          ${otp}
        </div>
        <p style="margin-top: 20px;">This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    try {
      console.log('Sending email to:', email);
      
      if (this.useResend) {
        // Use Resend API
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Your Verification Code - Suki App',
            html: htmlContent
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Resend API error: ${error}`);
        }
        
        console.log('✅ Email sent via Resend to:', email);
      } else if (this.useBrevoAPI) {
        // Use Brevo API (v3)
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: 'Suki App',
              email: process.env.EMAIL_FROM || 'sukikalmario828@gmail.com'
            },
            to: [{ email: email }],
            subject: 'Your Verification Code - Suki App',
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Brevo API error: ${error}`);
        }
        
        console.log('✅ Email sent via Brevo to:', email);
      } else {
        throw new Error('No email service configured');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
