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

    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log('Notification created:', notification.type);
    return { success: true, data: notification };
  } catch (error) {
    return { success: false };
  }
};

export { generateResetCode, createNotification };