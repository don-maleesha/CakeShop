# Email Setup Guide for CakeShop

## Current Status
The CakeShop application includes a comprehensive email system that can send real emails using Gmail SMTP or use a mock email service for development.

## Quick Setup for Real Email Sending

### Option 1: Gmail Setup (Recommended for Development)

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select your device or "Other"
   - Copy the 16-character password

3. **Update .env File**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

4. **Restart Server**
   ```bash
   npm start
   ```

### Option 2: Production SMTP (For Production Deployment)

For production, you can use services like SendGrid, Mailgun, or AWS SES:

```env
NODE_ENV=production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## Testing the Email System

### Mock Email Service (Default)
- No configuration needed
- Email content is logged to console
- Useful for development and testing
- No real emails are sent

### Real Email Testing
1. Set up Gmail credentials (see above)
2. Send a test email through the contact management system
3. Check server logs for success/error messages
4. Verify email delivery in recipient's inbox

## Features

### Email Templates
- Professional HTML email design
- Responsive layout for mobile devices
- Branded CakeShop styling
- Automatic text version generation

### Email Functionality
- Contact form replies from admin dashboard
- Professional email formatting
- Ticket ID tracking
- Reply threading support

### Error Handling
- Comprehensive error messages
- Authentication guidance
- Connection troubleshooting
- Fallback to mock service

## Troubleshooting

### Common Issues

**"Invalid login" Error**
- Verify 2-Step Verification is enabled
- Generate new App Password
- Use App Password, not regular Gmail password

**Connection Timeout**
- Check internet connection
- Verify firewall settings
- Try different SMTP port (465 for SSL)

**Authentication Failed**
- Double-check EMAIL_USER email address
- Verify EMAIL_PASS is the 16-character App Password
- Ensure no extra spaces in .env file

### Debug Steps
1. Check server console logs for detailed error messages
2. Verify .env file formatting (no quotes around values)
3. Restart server after changing .env
4. Test with mock service first, then real email

## Security Notes

- Never commit real email credentials to version control
- Use App Passwords, not regular passwords
- Consider using environment-specific .env files
- For production, use dedicated email service (SendGrid, etc.)

## Support

If you need help with email setup:
1. Check server console logs for specific error messages
2. Verify all setup steps are completed correctly
3. Test with a simple email first before complex templates
