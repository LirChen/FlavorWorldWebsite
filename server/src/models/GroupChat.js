const mongoose = require('mongoose');

const GroupChatSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  image: { type: String, maxlength: 10000000 }, 
  adminId: { type: String, required: true }, 
  participants: [{
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now }
  }],
  lastMessage: {
    senderId: String,
    senderName: String,
    content: String,
    messageType: { type: String, default: 'text' },
    createdAt: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  settings: {
    allowMemberInvites: { type: Boolean, default: false }, 
    allowNameChange: { type: Boolean, default: true }, 
    allowMemberLeave: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('GroupChat', GroupChatSchema);