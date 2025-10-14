import mongoose from 'mongoose';

const PrivateChatSchema = new mongoose.Schema({
  participants: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    joinedAt: { type: Date, default: Date.now }
  }],
  lastMessage: {
    senderId: String,
    content: String,
    createdAt: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

export default mongoose.models.PrivateChat || mongoose.model('PrivateChat', PrivateChatSchema);