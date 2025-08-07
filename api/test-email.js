// Quick test script for email service
const { sendEmail, createContactReplyTemplate } = require('./services/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');
  
  // Create a test email template
  const { html, text } = createContactReplyTemplate(
    'Test Customer',
    'This is a test reply message to verify the email system is working correctly.',
    'Test Subject',
    'TEST123'
  );
  
  // Test sending email
  const result = await sendEmail(
    'test@example.com',
    'Test Email from CakeShop',
    html,
    text
  );
  
  console.log('\n📋 Email Test Results:');
  console.log('Success:', result.success);
  console.log('Message ID:', result.messageId);
  console.log('Is Mock:', result.isMock || false);
  
  if (result.success) {
    console.log('✅ Email service is working correctly!');
    if (result.isMock) {
      console.log('📧 Currently using mock email service');
      console.log('💡 To enable real email sending, configure Gmail credentials in .env file');
    } else {
      console.log('📧 Real email sent successfully!');
    }
  } else {
    console.log('❌ Email service error:', result.error);
  }
}

// Run the test
testEmailService().catch(console.error);
