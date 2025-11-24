const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const { sendEmail, createPasswordResetCodeTemplate } = require('../services/emailService');

// Helper: generate 6-digit numeric code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always respond success (to avoid email enumeration)
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a code has been emailed.' });
    }

    // Rate limit: simple attempt counter
    if (user.resetAttempts && user.resetAttempts >= 5 && user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Try again later.' });
    }

    const code = generateCode();
    const codeHash = bcrypt.hashSync(code, 10);
    user.resetPasswordCodeHash = codeHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.resetAttempts = (user.resetAttempts || 0) + 1;
    await user.save();

    // Send email
    const { html, text } = createPasswordResetCodeTemplate(user.name, code);
    const emailResult = await sendEmail(user.email, 'Your CakeShop password reset code', html, text);

    if (!emailResult.success) {
      console.error('Password reset email failed:', emailResult.error || emailResult.response);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send reset code email. Check email configuration.'
      });
    }

    return res.json({ success: true, message: 'If an account exists, a code has been emailed.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process request' });
  }
});

// POST /auth/verify-reset-code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, error: 'Email and code are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+resetPasswordCodeHash +resetAttempts +resetPasswordExpires');
    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, valid: false, error: 'Invalid code' });
    }
    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, valid: false, error: 'Code expired' });
    }
    const match = bcrypt.compareSync(code, user.resetPasswordCodeHash);
    if (!match) {
      return res.status(400).json({ success: false, valid: false, error: 'Invalid code' });
    }
    return res.json({ success: true, valid: true, message: 'Code verified' });
  } catch (err) {
    console.error('Verify code error:', err);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, code and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+resetPasswordCodeHash +resetAttempts +resetPasswordExpires');
    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, error: 'Invalid code or email' });
    }
    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, error: 'Code expired' });
    }
    const match = bcrypt.compareSync(code, user.resetPasswordCodeHash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    // Update password
    const salt = bcrypt.genSaltSync(12);
    user.password = bcrypt.hashSync(newPassword, salt);
    // Clear reset fields
    user.resetPasswordCodeHash = undefined;
    user.resetPasswordExpires = undefined;
    user.resetAttempts = 0;
    await user.save();

    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
});

module.exports = router;
