require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');
const groupRoutes = require('./routes/groups');
const groupPostRoutes = require('./routes/groupPosts');
const chatRoutes = require('./routes/chats');
const groupChatRoutes = require('./routes/groupChats');
const notificationRoutes = require('./routes/notifications');
const feedRoutes = require('./routes/feed');
const uploadRoutes = require('./routes/upload');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups', groupPostRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/group-chats', groupChatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/following', feedRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.IO handlers
const socketHandlers = require('./socket/socketHandlers');
socketHandlers(io);

console.log('Notifications activated for all user actions');

// Basic routes
app.get('/', (req, res) => {
  res.send('Recipe Social Network API Server is running');
});

app.get('/api/health', (req, res) => {
  const { isMongoConnected } = require('./config/database');
  res.json({
    status: 'OK',
    mongoConnected: isMongoConnected(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-delete', (req, res) => {
  const User = require('./models/User');
  const Recipe = require('./models/Recipe');
  const Group = require('./models/Group');
  const GroupPost = require('./models/GroupPost');
  const PrivateChat = require('./models/PrivateChat');
  const Message = require('./models/Message');
  const GroupChat = require('./models/GroupChat');
  const GroupChatMessage = require('./models/GroupChatMessage');
  const Notification = require('./models/Notification');
  
  res.json({
    success: true,
    message: 'Delete endpoints are available',
    endpoints: [
      'DELETE /api/auth/delete-account',
      'DELETE /api/user/delete', 
      'DELETE /api/auth/delete-user'
    ],
    modelsAvailable: {
      User: !!User,
      Recipe: !!Recipe,
      Group: !!Group,
      GroupPost: !!GroupPost,
      PrivateChat: !!PrivateChat,
      Message: !!Message,
      GroupChat: !!GroupChat,
      GroupChatMessage: !!GroupChatMessage,
      Notification: !!Notification
    },
    timestamp: new Date()
  });
});

// Error handling
app.use((error, req, res, next) => {
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = { app, server, io };