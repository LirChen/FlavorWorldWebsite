import Notification from '../models/Notification.js';
import { isMongoConnected } from '../config/database.js';

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createNotification = async (notificationData) => {
  try {
    if (!isMongoConnected()) {
      console.log('Database not connected, skipping notification');
      return { success: false };
    }

    const {
      type,
      fromUserId,
      toUserId,
      message,
      recipeId,
      postId,
      groupId,
      commentId,
      fromUser
    } = notificationData;

    // Don't create notification if user is notifying themselves
    if (fromUserId === toUserId || fromUserId?.toString() === toUserId?.toString()) {
      console.log('Skipping self-notification');
      return { success: false, reason: 'self-notification' };
    }

    // Check if similar notification already exists (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingNotification = await Notification.findOne({
      toUserId,
      fromUserId,
      type,
      recipeId: recipeId || null,
      postId: postId || null,
      commentId: commentId || null,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (existingNotification) {
      console.log('Similar notification already exists, skipping');
      return { success: false, reason: 'duplicate', data: existingNotification };
    }

    const notification = new Notification({
      type,
      fromUserId,
      toUserId,
      message,
      recipeId: recipeId || null,
      postId: postId || null,
      groupId: groupId || null,
      commentId: commentId || null,
      fromUser: { 
        name: fromUser?.name || fromUser?.fullName || 'Someone',
        avatar: fromUser?.avatar || null
      },
      read: false  
    });

    await notification.save();
    
    console.log('Notification created:', notification.type, 'for user:', toUserId);
    return { success: true, data: notification };

  } catch (error) {
    console.error('Create notification error:', error);
    return { success: false, error: error.message };
  }
};

export { generateResetCode, createNotification };