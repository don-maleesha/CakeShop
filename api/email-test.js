// Quick Email Configuration Test
require('dotenv').config();
const { sendEmail, createContactReplyTemplate } = require('./services/emailService');

async function testEmailConfiguration() {
  console.log('🧪 Testing CakeShop Email Configuration...\n');
  
  // Check environment variables
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  console.log('📋 Configuration Status:');
  console.log('EMAIL_USER:', emailUser ? `✅ ${emailUser}` : '❌ Not set');
  console.log('EMAIL_PASS:', emailPass ? 
    (emailPass.length === 16 && !emailPass.includes('your-') ? '✅ Configured (16 chars)' : '⚠️  Needs real app password') 
    : '❌ Not set');
  
  console.log('\n🧪 Testing Email Service...');
  
  // Create test email content
  const { html, text } = createContactReplyTemplate(
    'Test Customer',
    'This is a test email to verify the CakeShop email system is working correctly. If you receive this email, the integration is successful!',
    'Email System Test',
    'TEST' + Date.now().toString().slice(-6)
  );
  
  // Test email sending
  const result = await sendEmail(
    emailUser, // Send test email to yourself
    '🧁 CakeShop Email System Test',
    html,
    text
  );
  
  console.log('\n📊 Test Results:');
  console.log('Success:', result.success ? '✅' : '❌');
  
  if (result.success) {
    if (result.isMock) {
      console.log('📧 Mock Email Service Active');
      console.log('   - Email content logged above');
      console.log('   - No real email sent');
      console.log('   - Ready for development testing');
    } else {
      console.log('📧 Real Email Sent Successfully!');
      console.log('   - Message ID:', result.messageId);
      console.log('   - Check your inbox:', emailUser);
      console.log('   - Gmail SMTP working correctly');
    }
  } else {
    console.log('❌ Email Error:', result.error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Ensure 2-Step Verification is enabled on your Google account');
    console.log('2. Copy the 16-character app password from Google App Passwords');
    console.log('3. Replace EMAIL_PASS in .env file with the actual app password');
    console.log('4. Restart the server after updating .env');
  }
  
  console.log('\n🎯 Next Steps:');
  if (result.success && !result.isMock) {
    console.log('✅ Email system ready! You can now:');
    console.log('   - Send replies from Contact Management');
    console.log('   - Customers will receive professional emails');
    console.log('   - All email features are operational');
  } else {
    console.log('🔧 Complete email setup by:');
    console.log('   - Adding your real Gmail App Password to .env');
    console.log('   - Restarting the server');
    console.log('   - Running this test again');
  }
}

// Run the test
testEmailConfiguration().catch(console.error);
