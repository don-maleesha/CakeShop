const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are provided
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  
  if (!hasEmailConfig) {
    console.log('⚠️  No email credentials provided. Using mock email service...');
    console.log('To enable real email sending:');
    console.log('1. Add EMAIL_USER=your-gmail@gmail.com to .env');
    console.log('2. Add EMAIL_PASS=your-16-character-app-password to .env');
    console.log('3. Generate App Password: https://myaccount.google.com/apppasswords');
    return null; // Return null to use mock service
  }

  // Validate that EMAIL_PASS is not the placeholder
  if (process.env.EMAIL_PASS === 'your-16-character-app-password') {
    console.log('⚠️  Please replace EMAIL_PASS with your actual Gmail App Password');
    console.log('📧 How to generate Gmail App Password:');
    console.log('1. Go to https://myaccount.google.com/apppasswords');
    console.log('2. Sign in to your Google Account');
    console.log('3. Select "Mail" and your device');
    console.log('4. Generate a 16-character app password');
    console.log('5. Replace EMAIL_PASS in .env with this password');
    return null; // Return null to use mock service
  }
  
  // Production SMTP configuration (for services like SendGrid, Mailgun, etc.)
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    console.log('📧 Using production SMTP server:', process.env.SMTP_HOST);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Gmail configuration for development/testing
  console.log('📧 Configuring Gmail SMTP with credentials...');
  console.log('📧 Email User:', process.env.EMAIL_USER);
  // Remove accidental spaces from app password
  const sanitizedPass = process.env.EMAIL_PASS.replace(/\s+/g,'');
  if (sanitizedPass !== process.env.EMAIL_PASS) {
    console.log('� Sanitized EMAIL_PASS by removing spaces.');
  }
  console.log('�📧 Using Gmail service for email sending');
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: sanitizedPass
    }
  });
};

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  try {
    const transporter = createTransporter();
    
    // If no real transporter (no credentials), use mock service
    if (!transporter) {
      console.log('\n=== MOCK EMAIL SERVICE ===');
      console.log('📧 Email would be sent with:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML Content Preview:', htmlContent.substring(0, 200) + '...');
      console.log('=========================\n');
      
      return {
        success: true,
        messageId: 'mock-' + Date.now(),
        message: 'Email processed by mock service (no real email sent)',
        isMock: true
      };
    }

    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Gmail SMTP server connection verified');
    } catch (verifyError) {
      console.error('❌ Gmail SMTP verification failed:', verifyError.message);
      
      // Check for common Gmail authentication errors
      if (verifyError.message.includes('Invalid login')) {
        console.log('💡 Gmail Authentication Tips:');
        console.log('1. Enable 2-Step Verification on your Google Account');
        console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
        console.log('3. Use the 16-character app password (not your regular password)');
        console.log('4. Make sure "Less secure app access" is not needed for app passwords');
      }
      
      return {
        success: false,
        error: 'Email service verification failed: ' + verifyError.message,
        details: verifyError
      };
    }

    // Email options
    const mailOptions = {
      from: {
        name: 'CakeShop Support',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    console.log('📧 Sending email...');
    console.log('From:', process.env.EMAIL_USER);
    console.log('To:', to);
    console.log('Subject:', subject);
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      message: 'Email sent successfully'
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Handle specific Gmail errors
    if (error.code === 'EAUTH') {
      console.log('💡 Authentication Error - Check your Gmail credentials:');
      console.log('1. Verify EMAIL_USER is correct');
      console.log('2. Verify EMAIL_PASS is a valid app password');
      console.log('3. Generate new app password if needed');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 Connection Error - Check your internet connection');
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error
    };
  }
};

// Create professional contact reply email template
const createContactReplyTemplate = (customerName, replyMessage, originalSubject, ticketId) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reply from CakeShop</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .email-container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #e74c3c;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #e74c3c;
          margin-bottom: 10px;
        }
        .ticket-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          border-left: 4px solid #e74c3c;
        }
        .reply-content {
          background-color: #ffffff;
          padding: 20px;
          border-radius: 5px;
          border: 1px solid #e9ecef;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 14px;
        }
        .contact-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background-color: #e74c3c;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">🧁 CakeShop</div>
          <p style="margin: 0; color: #6c757d;">Sweet Moments, Delivered with Love</p>
        </div>
        
        <div class="greeting">
          <h2 style="color: #e74c3c; margin-bottom: 15px;">Dear ${customerName},</h2>
          <p>Thank you for contacting CakeShop! We're delighted to assist you.</p>
        </div>
        
        <div class="ticket-info">
          <strong>📋 Ticket Information:</strong><br>
          <strong>Ticket ID:</strong> #${ticketId}<br>
          <strong>Original Subject:</strong> ${originalSubject}<br>
          <strong>Reply Date:</strong> ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        
        <div class="reply-content">
          <h3 style="color: #e74c3c; margin-bottom: 15px;">📝 Our Response:</h3>
          <p style="white-space: pre-wrap; line-height: 1.8;">${replyMessage}</p>
        </div>
        
        <div class="contact-info">
          <h3 style="color: #e74c3c; margin-bottom: 15px;">📞 Need Further Assistance?</h3>
          <p><strong>Phone:</strong> (555) 123-4567</p>
          <p><strong>Email:</strong> info@cakeshop.com</p>
          <p><strong>Store Hours:</strong> Mon-Fri: 8AM-8PM, Sat: 9AM-6PM, Sun: 10AM-4PM</p>
          <p><strong>Address:</strong> 123 Baker Street, Sweet City, SC 12345</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:info@cakeshop.com?subject=Re: ${originalSubject} - Ticket #${ticketId}" class="btn">Reply to this Email</a>
        </div>
        
        <div class="footer">
          <p><strong>Thank you for choosing CakeShop!</strong></p>
          <p style="margin: 15px 0;">We appreciate your business and look forward to serving you again.</p>
          <div style="margin: 20px 0;">
            <span style="font-size: 16px;">🧁</span>
            <span style="margin: 0 10px; color: #e74c3c;">•</span>
            <span style="font-size: 16px;">🍰</span>
            <span style="margin: 0 10px; color: #e74c3c;">•</span>
            <span style="font-size: 16px;">🎂</span>
          </div>
          <p style="font-size: 12px; color: #adb5bd;">
            This email was sent from CakeShop Customer Support<br>
            If you have any concerns about this email, please contact us immediately.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${customerName},

Thank you for contacting CakeShop! We're delighted to assist you.

TICKET INFORMATION:
Ticket ID: #${ticketId}
Original Subject: ${originalSubject}
Reply Date: ${new Date().toLocaleDateString()}

OUR RESPONSE:
${replyMessage}

NEED FURTHER ASSISTANCE?
Phone: (555) 123-4567
Email: info@cakeshop.com
Store Hours: Mon-Fri: 8AM-8PM, Sat: 9AM-6PM, Sun: 10AM-4PM
Address: 123 Baker Street, Sweet City, SC 12345

Thank you for choosing CakeShop!
We appreciate your business and look forward to serving you again.

---
CakeShop Customer Support Team
Sweet Moments, Delivered with Love
  `;

  return { html, text };
};

// Create password reset code email template
const createPasswordResetCodeTemplate = (customerName, code) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset your password</title>
      <style>
        body { font-family: Arial, sans-serif; background:#f6f7fb; padding:24px; }
        .card { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.08); overflow:hidden; }
        .header { background:linear-gradient(135deg,#ff7a7a,#ffb86c); color:#fff; padding:24px; text-align:center; }
        .content { padding:24px; color:#333; }
        .code { font-size:32px; letter-spacing:8px; font-weight:800; background:#fff7ed; color:#c2410c; padding:12px 16px; border-radius:10px; text-align:center; border:1px dashed #fdba74; }
        .muted { color:#6b7280; font-size:14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">🧁 CakeShop • Password Reset</div>
        <div class="content">
          <p>Hi ${customerName || 'there'},</p>
          <p>Use the following verification code to reset your password. This code will expire in <strong>15 minutes</strong>.</p>
          <div class="code">${code}</div>
          <p class="muted">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `Hi ${customerName || 'there'},\n\nYour password reset code is: ${code}\nThis code expires in 15 minutes. If you didn't request this, ignore this email.`;
  return { html, text };
};

module.exports = {
  sendEmail,
  createContactReplyTemplate,
  createTransporter,
  createPasswordResetCodeTemplate
};
