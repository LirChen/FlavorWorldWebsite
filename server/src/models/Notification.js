import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow', 'group_post', 'group_join_request', 'group_request_approved']
  },
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  message: { type: String, required: true },
  recipeId: { type: String },
  commentId: { type: String },
  postId: { type: String },
  postTitle: { type: String },
  postImage: { type: String },
  groupId: { type: String },
  groupName: { type: String },
  read: { type: Boolean, default: false },
  fromUser: {
    name: String,
    avatar: String
  }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);