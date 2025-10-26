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
- **Join Requests**: Admin approval system for private groups
- **Group Settings**: Control post permissions and approval requirements

### 💬 Real-time Chat
- **Private Messaging**: One-on-one conversations with Socket.IO
- **Group Chat**: Community discussions within groups
- **Live Updates**: Real-time message delivery and notifications
- **Read Receipts**: Track message status
- **Chat History**: Persistent message storage

### 🔔 Notifications System
- **Real-time Alerts**: Instant notifications for likes, comments, and follows
- **Group Notifications**: Updates for group activities and admin requests
- **In-app Badges**: Unread notification counters
- **Notification Center**: View and manage all notifications

### 🔍 Search & Discovery
- **User Search**: Find other chefs by name
- **Recipe Search**: Browse recipes by category, cuisine, or dietary preference
- **Group Discovery**: Find and join cooking communities
- **Suggested Content**: Algorithm-based chef recommendations

### 📱 Social Features
- **Like System**: Show appreciation for recipes
- **Comments**: Engage with recipe creators
- **Share Posts**: Re-share recipes to your feed
- **Feed Algorithm**: Personalized home feed with recipes from followed users and joined groups
- **Saved Recipes**: Bookmark your favorite recipes for later

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach, works on all devices
- **Modern Gradients**: Beautiful glass-morphism effects and shadows
- **Smooth Animations**: Polished transitions and hover effects
- **Intuitive Navigation**: Tab-based navigation with sidebar access
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
   git clone https://github.com/moriyash/FlavorWorldWebsite.git
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
- `POST /` - Create group
- `GET /:id` - Get group details
- `PUT /:id` - Update group
- `DELETE /:id` - Delete group
- `POST /:id/join` - Request to join
- `POST /:id/leave` - Leave group
- `GET /:id/members` - Get members
- `POST /:id/members/:userId/role` - Update member role
- `DELETE /:id/members/:userId` - Remove member

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
- `GET /:id` - Get user profile
- `PUT /:id` - Update profile
- `POST /:id/follow` - Follow user
- `DELETE /:id/follow` - Unfollow user
- `GET /:id/followers` - Get followers
- `GET /:id/following` - Get following
- `GET /:id/recipes` - Get user's recipes

### Chats (`/api/chats`)
- `GET /` - Get all chats
- `POST /` - Create/get private chat
- `GET /:chatId/messages` - Get messages
- `POST /:chatId/messages` - Send message

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

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: MIME type validation and size limits
- **CORS Protection**: Configured CORS policy
- **MongoDB Injection**: Mongoose sanitization
- **XSS Protection**: Input sanitization

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

- **Development Team**: Full-stack development with React & Node.js
- **Repository**: [moriyash/FlavorWorldWebsite](https://github.com/moriyash/FlavorWorldWebsite)

## 🎯 Roadmap

### ✅ Completed
- Full authentication system with password reset
- Recipe creation with image/video upload
- Community groups with admin controls
- Real-time chat (private and group)
- Notifications system
- Follow/unfollow functionality
- Like and comment system
- Search and discovery
- Responsive modern UI
- Video upload with validation

### 🚧 In Progress
- Enhanced UI polish and animations
- Performance optimizations
- Advanced search filters

### 📋 Planned
- Recipe recommendations algorithm
- Cooking timers and shopping lists
- Meal planning features
- Mobile PWA implementation
- Recipe ratings and reviews
- Advanced analytics dashboard

---

**Made with ❤️ for food lovers around the world** 🌍🍽️