import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  avatar: { type: String, maxlength: 10000000 },
  followers: [{ type: String }],
  following: [{ type: String }],
  savedRecipes: [{
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    savedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
    return next(); 
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);