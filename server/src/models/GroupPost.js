import mongoose from 'mongoose';

const GroupPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  ingredients: String,
  instructions: String,
  category: { type: String, default: 'General' },
  meatType: { type: String, default: 'Mixed' },
  prepTime: { type: Number, default: 0 },
  servings: { type: Number, default: 1 },
  image: { type: String, maxlength: 10000000 },
  userId: { type: String, required: true },
  groupId: { type: String, required: true },
  likes: [{ type: String }],
  comments: [{
    userId: String,
    userName: String,
    userAvatar: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.GroupPost || mongoose.model('GroupPost', GroupPostSchema);