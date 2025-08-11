// Email Configuration Checker
require('dotenv').config();

console.log('📧 CakeShop Email Configuration Status\n');

// Check environment variables
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log('🔍 Configuration Check:');
console.log('EMAIL_USER:', emailUser ? `✅ Set (${emailUser})` : '❌ Not set');
console.log('EMAIL_PASS:', emailPass ? 
  (emailPass === 'your-16-character-app-password' ? '⚠️  Set to placeholder value' : '✅ Set (configured)') 
  : '❌ Not set');

console.log('\n📋 Current Status:');
if (!emailUser || !emailPass) {
  console.log('🔄 Mock Email Service (Development Mode)');
  console.log('   - Emails are logged to console');
  console.log('   - No real emails are sent');
  console.log('   - Perfect for development and testing');
} else if (emailPass === 'your-16-character-app-password') {
  console.log('⚠️  Gmail Credentials Need Update');
  console.log('   - EMAIL_USER is set but EMAIL_PASS is placeholder');
  console.log('   - Generate Gmail App Password to enable real email sending');
} else {
  console.log('✅ Real Email Sending Enabled');
  console.log('   - Gmail SMTP configured');
  console.log('   - Ready to send real emails');
}

console.log('\n💡 To Enable Real Email Sending:');
console.log('1. Go to https://myaccount.google.com/apppasswords');
console.log('2. Enable 2-Step Verification (required)');
console.log('3. Generate App Password for "Mail"');
console.log('4. Update EMAIL_PASS in .env file');
console.log('5. Restart the server');

console.log('\n🎯 Next Steps:');
console.log('- Test email functionality in Contact Management');
console.log('- Check server console for detailed email logs');
console.log('- See EMAIL_SETUP.md for complete setup guide');
