import mongoose from 'mongoose';

const GroupChatMessageSchema = new mongoose.Schema({
  groupChatId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String },
  content: { type: String, required: true },
  messageType: { type: String, default: 'text' },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  isSystemMessage: { type: Boolean, default: false },
  systemMessageType: { type: String }
}, { timestamps: true });

export default mongoose.models.GroupChatMessage || mongoose.model('GroupChatMessage', GroupChatMessageSchema);