import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  avatar: { type: String, maxlength: 10000000 },
  followers: [{ type: String }],
  following: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);