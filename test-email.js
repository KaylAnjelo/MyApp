const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('\nPossible issues:');
    console.log('1. You need to use an App Password, not your regular Gmail password');
    console.log('2. Go to: https://myaccount.google.com/apppasswords');
    console.log('3. Generate a new app password and use that instead');
    console.log('4. Make sure 2-Step Verification is enabled on your Google account');
  } else {
    console.log('✅ Server is ready to send emails!');
    
    // Try sending a test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Suki App',
      html: '<h1>Test successful!</h1><p>Your email configuration is working correctly.</p>',
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Failed to send test email:', err);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
      }
    });
  }
});
