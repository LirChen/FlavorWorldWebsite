import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  messageType: { type: String, default: 'text' },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);