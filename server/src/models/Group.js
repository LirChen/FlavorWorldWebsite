import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  image: { type: String, maxlength: 10000000 },
  creatorId: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  category: { type: String, default: 'General' },
  members: [{
    userId: String,
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  pendingRequests: [{
    userId: String,
    requestedAt: { type: Date, default: Date.now }
  }],
  rules: { type: String, maxlength: 1000 },
  settings: {
    allowMemberPosts: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    allowInvites: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);