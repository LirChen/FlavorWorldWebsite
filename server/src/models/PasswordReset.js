import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 900 },
  used: { type: Boolean, default: false }
});

export default mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);