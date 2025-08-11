// Test the email service with real Gmail credentials
const { sendEmail, createContactReplyTemplate } = require('./services/emailService');

async function testRealEmail() {
  console.log('🧪 Testing Real Email Service...\n');
  
  // Create a simple test email
  const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #e74c3c;">🧁 CakeShop Email Test</h2>
      <p>Hello!</p>
      <p>This is a test email to verify that the CakeShop email system is working with real Gmail SMTP.</p>
      <p><strong>If you receive this email, the setup is successful! 🎉</strong></p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>Email Service: Gmail SMTP</li>
          <li>Test Time: ${new Date().toLocaleString()}</li>
          <li>Status: Email configuration working correctly</li>
        </ul>
      </div>
      <p>Best regards,<br>CakeShop Team</p>
    </div>
  `;
  
  const testText = `
CakeShop Email Test

Hello!

This is a test email to verify that the CakeShop email system is working with real Gmail SMTP.

If you receive this email, the setup is successful!

Test Details:
- Email Service: Gmail SMTP
- Test Time: ${new Date().toLocaleString()}
- Status: Email configuration working correctly

Best regards,
CakeShop Team
  `;
  
  // Test sending email to your own email
  const result = await sendEmail(
    'navinduthilakshana9@gmail.com', // Sending to your own email for testing
    '🧁 CakeShop Email Test - Setup Successful!',
    testHtml,
    testText
  );
  
  console.log('\n📋 Email Test Results:');
  console.log('Success:', result.success);
  console.log('Message ID:', result.messageId);
  console.log('Is Mock:', result.isMock || false);
  
  if (result.success) {
    if (result.isMock) {
      console.log('\n📧 Still using mock email service');
      console.log('💡 Check that your Gmail App Password is correct');
    } else {
      console.log('\n✅ Real email sent successfully!');
      console.log('📧 Check your inbox: navinduthilakshana9@gmail.com');
      console.log('🎉 CakeShop email system is now fully operational!');
    }
  } else {
    console.log('\n❌ Email failed:', result.error);
    if (result.code) {
      console.log('Error Code:', result.code);
    }
  }
}

// Run the test
testRealEmail().catch(console.error);
