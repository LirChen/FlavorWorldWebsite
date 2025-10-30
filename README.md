# 🍲 FlavorWorld - Recipe Social Network

A modern full-stack social platform for food enthusiasts to share recipes, join cooking communities, and connect with fellow chefs around the world.

## ✨ Features

### � Authentication & User Management
- **Secure Authentication**: JWT-based login/register with bcrypt password hashing
- **Password Recovery**: Email-based password reset with verification codes
- **Profile Management**: Customizable profiles with avatar uploads and bio
- **Follow System**: Follow other users and build your culinary network
- **User Discovery**: Suggested chefs feature to discover new content creators

### 📝 Recipe Sharing
- **Rich Recipe Creation**: Share recipes with images or videos (up to 1 minute, 10MB)
- **Video Support**: Upload cooking videos with duration validation
- **Recipe Categories**: 16 cuisine types (Asian, Italian, Mexican, etc.)
- **Dietary Tags**: 10 meat types including Vegetarian and Vegan options
- **Detailed Recipes**: Title, description, ingredients, instructions, prep time, and servings
- **Recipe Editing**: Full edit functionality for your recipes
- **Media Management**: Switch between images and videos when editing

### 👥 Community Groups
- **Create & Join Groups**: Build cooking communities around specific cuisines or interests
- **Group Posts**: Share recipes within groups with approval workflows
- **Admin Controls**: Manage members, approve posts, and configure group settings
- **Member Roles**: Owner, Admin, and Member roles with different permissions
- **Role Management**: Promote members to admin or demote them
- **Remove Members**: Admins can remove members from groups
- **Join Requests**: Admin approval system for private groups
- **Pending Requests**: View and manage join requests with user details
- **Group Settings**: Control post permissions and approval requirements
- **Leave Group**: Members can leave groups, with admin transfer on admin departure

### 💬 Real-time Chat
- **Private Messaging**: One-on-one conversations with Socket.IO and HTTP fallback
- **Group Chat**: Community discussions within groups
- **Create Group Chats**: Build chat groups with multiple participants
- **Add/Remove Participants**: Manage chat membership (admin only)
- **Admin Transfer**: Automatic admin transfer when admin leaves
- **Live Updates**: Real-time message delivery and notifications
- **Read Receipts**: Track message status and unread counts
- **Chat History**: Persistent message storage with pagination
- **Typing Indicators**: See when others are typing
- **Recipe Sharing**: Share recipes directly to chats with rich previews

### 🔔 Notifications System
- **Real-time Alerts**: Instant notifications for likes, comments, and follows
- **Group Notifications**: Updates for group activities and admin requests
- **In-app Badges**: Unread notification counters
- **Notification Center**: View and manage all notifications

### 🔍 Search & Discovery
- **User Search**: Find other chefs by name or email
- **Recipe Search**: Browse recipes by category, cuisine, or dietary preference
- **Group Discovery**: Find and join cooking communities
- **Suggested Content**: Algorithm-based chef recommendations
- **Following Users in Chat**: Quick access to people you follow when starting new chats
- **Chat User Discovery**: See following users by default in chat search

### 📱 Social Features
- **Like System**: Show appreciation for recipes with optimistic updates for instant feedback
- **Comments**: Engage with recipe creators
- **Share Posts**: Share recipes to private chats and group chats
- **Recipe Share Previews**: Shared recipes display with rich formatting
- **Feed Algorithm**: Personalized home feed with recipes from followed users and joined groups
- **Saved Recipes**: Bookmark your favorite recipes with optimized state management
- **Follow System**: Build your network and see follower/following lists
- **Remove Followers**: Manage your followers list
- **Performance Optimizations**: Saved posts state loads once and passes to components for instant display
- **Optimistic UI Updates**: Like buttons respond instantly without waiting for server

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach, works on all devices
- **Modern Gradients**: Beautiful glass-morphism effects and shadows
- **Smooth Animations**: Polished transitions and hover effects
- **Intuitive Navigation**: Tab-based navigation with sidebar access
- **Optimized Login Screen**: Wider hero section with adjustable spacing
- **Consistent Chat UI**: Unified styling across private and group chat creation
- **Clean Badges**: Single, combined badges for user relationships (Following • Chatted)
- **Professional Buttons**: Subtle, modern button designs throughout
- **Dark Mode Ready**: CSS custom properties for easy theming

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live updates
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer with base64 encoding
- **Styling**: Modern CSS with custom properties

### Project Structure
```
FlavorWorldWebsite/
├── server/                 # Backend API
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Recipe.js
│   │   │   ├── Group.js
│   │   │   ├── GroupPost.js
│   │   │   ├── Message.js
│   │   │   └── Notification.js
│   │   ├── routes/        # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── recipes.js
│   │   │   ├── groups.js
│   │   │   ├── groupPosts.js
│   │   │   ├── chats.js
│   │   │   ├── notifications.js
│   │   │   └── users.js
│   │   ├── middleware/    # Express middleware
│   │   │   └── upload.js
│   │   ├── socket/        # Socket.IO handlers
│   │   │   └── socketHandlers.js
│   │   ├── config/        # Configuration
│   │   │   └── database.js
│   │   └── utils/         # Helper functions
│   ├── server.js          # Server entry point
│   └── package.json
│
└── client/                # Frontend Web App
    ├── src/
    │   ├── components/    # Reusable components
    │   │   ├── common/
    │   │   │   ├── PostComponent.jsx
    │   │   │   ├── CreatePostComponent.jsx
    │   │   │   ├── SharePostComponent.jsx
    │   │   │   ├── UserAvatar.jsx
    │   │   │   └── DefaultAvatar.jsx
    │   │   └── groups/
    │   ├── pages/         # Main pages
    │   │   ├── Auth/
    │   │   ├── Home/
    │   │   ├── Profile/
    │   │   ├── Groups/
    │   │   ├── Chats/
    │   │   ├── Notifications/
    │   │   ├── Search/
    │   │   └── posts/
    │   ├── services/      # API services
    │   │   ├── AuthContext.jsx
    │   │   ├── authService.js
    │   │   ├── recipeService.js
    │   │   ├── groupService.js
    │   │   ├── chatServices.js
    │   │   ├── userService.js
    │   │   └── notificationService.js
    │   ├── contexts/      # React contexts
    │   │   ├── ChatSocketProvider.jsx
    │   │   └── NotificationContext.jsx
    │   ├── navigation/    # Routing
    │   │   ├── AppNavigator.jsx
    │   │   ├── AuthNavigator.jsx
    │   │   └── HomeNavigator.jsx
    │   └── main.jsx       # App entry point
    ├── public/
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js v16 or higher
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LirChen/FlavorWorldWebsite.git
   cd FlavorWorldWebsite
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/flavorworld
   JWT_SECRET=your_jwt_secret_here_change_this
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Start the server
   npm start
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   
   # Start the development server
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🎨 Design System

### Color Palette
```css
:root {
  --primary: #F5A623;     /* FlavorWorld Orange */
  --secondary: #4ECDC4;   /* Mint Green */
  --accent: #1F3A93;      /* Deep Blue */
  --background: #FFF8F0;  /* Warm Cream */
  --white: #FFFFFF;
  --text: #2C3E50;        /* Dark Gray */
  --text-light: #7F8C8D;  /* Light Gray */
  --success: #27AE60;     /* Green */
  --danger: #E74C3C;      /* Red */
  --warning: #F39C12;     /* Yellow */
}
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

### Design Principles
- **Glass-morphism**: Frosted glass effects with backdrop-filter
- **Gradients**: Subtle linear gradients for depth
- **Shadows**: Layered box-shadows for elevation
- **Animations**: Smooth transitions (0.3s ease)
- **Rounded Corners**: 12-16px border radius for modern feel

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /forgotpassword` - Request password reset
- `POST /send-reset-code` - Send verification code
- `POST /verify-reset-code` - Verify code
- `POST /reset-password` - Reset password
- `GET /check-email` - Check email availability

### Recipes (`/api/recipes`)
- `GET /` - Get all recipes (feed)
- `POST /` - Create recipe (with image/video)
- `GET /:id` - Get single recipe
- `PUT /:id` - Update recipe
- `DELETE /:id` - Delete recipe
- `POST /:id/like` - Like recipe
- `DELETE /:id/like` - Unlike recipe
- `POST /:id/comments` - Add comment
- `DELETE /:id/comments/:commentId` - Delete comment
- `POST /:id/share` - Share recipe

### Groups (`/api/groups`)
- `GET /` - Get all groups
- `GET /search` - Search groups
- `POST /` - Create group
- `GET /:id` - Get group details
- `PUT /:id` - Update group
- `DELETE /:id` - Delete group
- `POST /:groupId/join` - Request to join group
- `DELETE /:groupId/join` - Cancel join request
- `DELETE /:groupId/leave/:userId` - Leave group
- `PUT /:id/requests/:userId` - Approve/reject join request
- `GET /:groupId/members` - Get members with details
- `PUT /:groupId/members/:memberUserId/role` - Update member role
- `DELETE /:groupId/members/:memberUserId` - Remove member

### Group Posts (`/api/groups/:groupId/posts`)
- `GET /` - Get group posts
- `POST /` - Create post in group
- `PUT /:postId` - Update group post
- `DELETE /:postId` - Delete group post
- `POST /:postId/like` - Like post
- `POST /:postId/comments` - Add comment

### Users (`/api/users`)
- `GET /search` - Search users
- `GET /suggested` - Get suggested chefs
- `GET /profile/:userId` - Get user profile
- `PUT /profile` - Update profile
- `PUT /change-password` - Change password
- `POST /upload-avatar` - Upload avatar
- `POST /:userId/follow` - Follow user
- `DELETE /:userId/follow` - Unfollow user
- `GET /:userId/follow-status/:viewerId` - Get follow status
- `DELETE /delete` - Delete user account (cascade deletion)

### Chats (`/api/chats`)
- `GET /my` - Get all private chats
- `POST /private` - Create/get private chat
- `GET /:chatId/messages` - Get messages
- `POST /:chatId/messages` - Send message
- `PUT /:chatId/read` - Mark messages as read
- `GET /unread-count` - Get unread message count

### Group Chats (`/api/group-chats`)
- `GET /my` - Get my group chats
- `POST /` - Create group chat
- `GET /:chatId` - Get group chat details
- `PUT /:chatId` - Update group chat
- `GET /:chatId/messages` - Get messages
- `POST /:chatId/messages` - Send message
- `POST /:chatId/participants` - Add participants
- `DELETE /:chatId/participants/:userId` - Remove participant
- `DELETE /:chatId/leave` - Leave group chat
- `PUT /:chatId/read` - Mark as read

### Notifications (`/api/notifications`)
- `GET /` - Get all notifications
- `PUT /:id/read` - Mark as read
- `PUT /read-all` - Mark all as read

## 🎥 Media Upload

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, WebM, MOV

### Limits
- **Video Duration**: Max 60 seconds
- **Video File Size**: Max 10MB (to stay under MongoDB 16MB document limit)
- **Image File Size**: Max 12MB

### Validation
- Client-side duration check using HTML5 video API
- Client-side file size validation
- Server-side MIME type validation
- Server-side base64 size check (MongoDB 16MB limit)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with 7-day expiration
- **Password Hashing**: bcrypt with sufficient salt rounds (10+)
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: MIME type validation and size limits
- **CORS Protection**: Configured CORS policy
- **MongoDB Injection**: Mongoose sanitization
- **XSS Protection**: Input sanitization and HTML escaping
- **Cascade Deletion**: Comprehensive data cleanup on account deletion
  - Removes all user notifications (sent and received)
  - Deletes private chats and all messages
  - Handles group memberships (transfers admin or removes)
  - Cleans up group chat participation
  - Removes from followers/following relationships
  - Deletes user recipes and group posts
- **Password Validation**: Strong password requirements
- **Email Verification**: Code-based password reset system

## 📱 Responsive Design

Mobile-first approach with breakpoints:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

Features:
- Touch-friendly interface
- Optimized images and videos
- Flexible grid layouts
- Responsive typography
- Mobile navigation drawer

## 🛠️ Development

### Available Scripts

#### Frontend (client/)
```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend (server/)
```bash
npm start            # Start server (localhost:3000)
npm run dev          # Start with nodemon
npm test             # Run tests with Vitest
```

### Environment Variables

#### Server (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/flavorworld
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

#### Client
API base URL configured in services (localhost:3000)

## 🧪 Testing

- **Backend**: Vitest with MongoDB Memory Server
- **Frontend**: Playwright for E2E tests
- **Coverage**: Unit and integration tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- ESLint + Prettier for JavaScript
- BEM methodology for CSS
- camelCase for JS, kebab-case for CSS classes
- Meaningful commit messages

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **[Lir Chen](https://github.com/LirChen)** - Full-stack development with React & Node.js
- **[Moriya Shalom](https://github.com/moriyash)** - Full-stack development with React & Node.js
- **Repository**: [LirChen/FlavorWorldWebsite](https://github.com/LirChen/FlavorWorldWebsite.git)

---

**Made with ❤️ for food lovers around the world** 🌍🍽️
