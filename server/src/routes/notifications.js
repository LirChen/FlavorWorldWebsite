const express = require('express');
const router = express.Router();
const { isMongoConnected } = require('../config/database');
const Notification = require('../models/Notification');

// GET ALL NOTIFICATIONS
router.get('/', async (req, res) => {
  try {
    console.log('Fetching notifications');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    console.log('Getting notifications for user:', userId);

    const notifications = await Notification.find({ 
      toUserId: userId 
    }).sort({ createdAt: -1 }).limit(50);

    console.log(`Found ${notifications.length} notifications`);
    
    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// MARK NOTIFICATION AS READ
router.put('/:notificationId/read', async (req, res) => {
  try {
    console.log('Marking notification as read:', req.params.notificationId);
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    console.log('Notification marked as read');
    res.json({ 
      success: true,
      data: notification 
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.put('/mark-all-read', async (req, res) => {
  try {
    console.log('Marking all notifications as read');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    await Notification.updateMany(
      { toUserId: userId, read: false },
      { read: true }
    );

    console.log('All notifications marked as read');
    res.json({ 
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// GET UNREAD COUNT
router.get('/unread-count', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const count = await Notification.countDocuments({ 
      toUserId: userId, 
      read: false 
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      count: 0
    });
  }
});

module.exports = router;