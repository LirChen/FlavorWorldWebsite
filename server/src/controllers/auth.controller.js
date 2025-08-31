const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { isMongoConnected } = require('../config/db');
const { sendResetEmail } = require('../utils/email');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
const generateResetCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ success: false, message: 'Database not available' });

    const { fullName, email, password, confirmPassword } = req.body;
    if (!fullName || !email || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (!passwordRegex.test(password))
      return res.status(400).json({ success: false, message: 'Password must contain at least 8 characters, including uppercase, lowercase, number and special char' });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    await User.create({ fullName: fullName.trim(), email: email.toLowerCase().trim(), password });
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ success: false, message: 'Database not available' });

    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ uid: user._id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, fullName: user.fullName, email: user.email }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ message: 'Database not available' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    res.json({ success: true, exists: !!user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check email' });
  }
};

exports.sendResetCode = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ message: 'Database not available' });

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const resetCode = generateResetCode();
    await PasswordReset.deleteMany({ email: email.toLowerCase().trim() });
    const passwordReset = new PasswordReset({ email: email.toLowerCase().trim(), code: resetCode });
    await passwordReset.save();

    const result = await sendResetEmail(email, resetCode);
    if (!result.success)
      return res.status(500).json({ message: 'Failed to send reset email' });

    res.json({ success: true, message: 'Reset code sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset code' });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ message: 'Database not available' });

    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: 'Email and code are required' });

    const record = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code: code.toString(),
      used: false
    });
    if (!record)
      return res.status(400).json({ message: 'Invalid or expired reset code' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    record.verificationToken = verificationToken;
    await record.save();

    res.json({ success: true, message: 'Code verified successfully', verificationToken });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify reset code' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!isMongoConnected())
      return res.status(503).json({ message: 'Database not available' });

    const { email, code, newPassword, verificationToken } = req.body;
    if (!email || !code || !newPassword || !verificationToken)
      return res.status(400).json({ message: 'All fields are required' });

    if (!passwordRegex.test(newPassword))
      return res.status(400).json({ message: 'Password must meet complexity requirements' });

    const record = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      code: code.toString(),
      verificationToken,
      used: false
    });
    if (!record)
      return res.status(400).json({ message: 'Invalid or expired reset code' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    record.used = true;
    await record.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};
