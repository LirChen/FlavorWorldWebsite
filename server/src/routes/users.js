import express from 'express';
import mongoose from 'mongoose';
import upload from '../middleware/upload.js';
import { isMongoConnected } from '../config/database.js';
import { createNotification } from '../utils/helpers.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET USER PROFILE
router.get('/profile/:userId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        bio: user.bio,
        avatar: user.avatar 
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// UPDATE PROFILE (handler function)
const updateUserProfile = async (req, res) => {
  try {
    console.log('=== Profile Update Debug ===');
    console.log('Request body:', req.body);
    console.log('MongoDB connected:', isMongoConnected());
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId, id, fullName, email, avatar, bio } = req.body;
    const userIdToUse = userId || id; 
    
    if (!userIdToUse) {
      console.log('ERROR: No user ID provided');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userIdToUse)) {
      console.log('ERROR: Invalid user ID:', userIdToUse);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userIdToUse);
    if (!user) {
      console.log('ERROR: User not found:', userIdToUse);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', user.email);

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar; 

    console.log('Updating user profile:', {
      userId: userIdToUse,
      fullName,
      email,
      bio,
      hasAvatar: !!avatar,
      avatarLength: avatar ? avatar.length : 0
    });

    await user.save();
    
    console.log('Profile updated successfully');

    res.json({
      message: 'Profile updated successfully',
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        bio: user.bio,
        avatar: user.avatar 
      }
    });
    
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: 'Validation error', errors: validationErrors });
    } else {
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }
};

// UPDATE PROFILE routes
router.put('/profile', updateUserProfile);
router.patch('/profile', updateUserProfile);

// CHANGE PASSWORD - Replace BOTH old routes with this single one
router.put('/change-password', async (req, res) => {
  try {
    console.log('=== Change Password Debug ===');
    console.log('Request body:', req.body);
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not available' 
      });
    }

    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID, current password and new password are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('User found:', user.email);
    console.log('Verifying current password...');

    // Use the comparePassword method from the User model
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      console.log('Current password is incorrect');
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must contain at least 8 characters, including uppercase and lowercase letters, a number and a special character' 
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be different from current password' 
      });
    }

    console.log('Setting new password...');
    // Just set the password - the pre('save') hook will hash it automatically
    user.password = newPassword;
    await user.save();

    console.log('Password changed successfully for:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password' 
    });
  }
});

// Also add PATCH method for compatibility
router.patch('/change-password', async (req, res) => {
  try {
    console.log('Change password via PATCH');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ 
        success: false,
        message: 'Database not available' 
      });
    }

    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID, current password and new password are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Use comparePassword method
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must contain at least 8 characters, including uppercase and lowercase letters, a number and a special character' 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'New password must be different from current password' 
      });
    }

    // Set password - pre('save') hook will hash it
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password' 
    });
  }
});

// UPLOAD AVATAR
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    console.log('Avatar upload request received (user endpoint)');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large - maximum 5MB allowed' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const imageData = `data:${req.file.mimetype};base64,${base64Image}`;
    
    res.json({
      success: true,
      url: imageData,
      filename: req.file.originalname
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// FOLLOW USER
router.post('/:userId/follow', async (req, res) => {
  try {
    console.log('Following user...');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.params;
    const { followerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !followerId) {
      return res.status(400).json({ message: 'Invalid user ID or follower ID' });
    }

    if (userId === followerId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const [userToFollow, follower] = await Promise.all([
      User.findById(userId),
      User.findById(followerId)
    ]);

    if (!userToFollow || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!userToFollow.followers) userToFollow.followers = [];
    if (!follower.following) follower.following = [];

    if (userToFollow.followers.includes(followerId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    userToFollow.followers.push(followerId);
    follower.following.push(userId);

    await Promise.all([
      userToFollow.save(),
      follower.save()
    ]);

    await createNotification({
      type: 'follow',
      fromUserId: followerId,
      toUserId: userId,
      message: `${follower.fullName || 'Someone'} started following you`,
      fromUser: {
        name: follower.fullName || 'Unknown User',
        avatar: follower.avatar || null
      }
    });

    console.log('User followed successfully');
    res.json({ 
      message: 'User followed successfully',
      followersCount: userToFollow.followers.length,
      followingCount: follower.following.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to follow user' });
  }
});

// UNFOLLOW USER
router.delete('/:userId/follow', async (req, res) => {
  try {
    console.log(' Unfollowing user...');
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId } = req.params; 
    const { followerId } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(userId) || !followerId) {
      return res.status(400).json({ message: 'Invalid user ID or follower ID' });
    }

    const [userToUnfollow, follower] = await Promise.all([
      User.findById(userId),
      User.findById(followerId)
    ]);

    if (!userToUnfollow || !follower) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!userToUnfollow.followers || !userToUnfollow.followers.includes(followerId)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(id => id !== followerId);
    follower.following = follower.following ? follower.following.filter(id => id !== userId) : [];

    await Promise.all([
      userToUnfollow.save(),
      follower.save()
    ]);

    console.log('User unfollowed successfully');
    res.json({ 
      message: 'User unfollowed successfully',
      followersCount: userToUnfollow.followers.length,
      followingCount: follower.following.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
});

// GET FOLLOW STATUS
router.get('/:userId/follow-status/:viewerId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { userId, viewerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followersCount = user.followers ? user.followers.length : 0;
    const followingCount = user.following ? user.following.length : 0;
    const isFollowing = viewerId && user.followers ? user.followers.includes(viewerId) : false;

    res.json({
      followersCount,
      followingCount,
      isFollowing
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to get follow status' });
  }
});

// SEARCH USERS
router.get('/search', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { q } = req.query;
    const currentUserId = req.headers['x-user-id'] || 'temp-user-id';

    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log(`Searching users with query: ${q}`);

    const users = await User.find({
      _id: { $ne: currentUserId }, 
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).limit(20).select('_id fullName email avatar bio');

    const searchResults = users.map(user => ({
      userId: user._id,
      userName: user.fullName,
      userEmail: user.email,
      userAvatar: user.avatar,
      userBio: user.bio
    }));

    console.log(`Found ${searchResults.length} users`);
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// DELETE USER
router.delete('/delete', async (req, res) => {
  console.log('User delete endpoint called - redirecting to main endpoint');
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: { deleted: true, userId }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Delete failed: ' + error.message
    });
  }
});

export default router;
