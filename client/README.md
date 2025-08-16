# 🍲 FlavorWorld - Recipe Social Network

A modern full-stack social platform for food enthusiasts to share recipes, join cooking communities, and connect with fellow chefs around the world.

## 📱➡️💻 Project Migration

This project is currently being migrated from **React Native** to **React Web** to expand our reach and provide a seamless web experience for our users.

## 🏗️ Architecture

### Current Stack
- **Frontend**: React Web (Vite)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Styling**: CSS Modules

### Project Structure
```
flavorworld/
├── server/                 # Backend API (Node.js + Express)
│   ├── models/            # MongoDB models
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   └── index.js           # Server entry point
│
└── client/                # Frontend Web App (React + Vite)
    ├── src/
    │   ├── components/    # Reusable UI components
    │   │   ├── common/    # Shared components (UserAvatar, etc.)
    │   │   ├── auth/      # Authentication components
    │   │   ├── chat/      # Real-time chat components
    │   │   ├── groups/    # Community group components
    │   │   └── posts/     # Recipe/post components
    │   ├── pages/         # Main application pages
    │   │   ├── Home.jsx   # Landing page
    │   │   └── Auth/      # Authentication pages
    │   ├── services/      # API calls and utilities
    │   │   ├── authService.js    # Authentication API
    │   │   ├── AuthContext.jsx   # Auth state management
    │   │   └── chatServices.js   # Real-time chat API
    │   └── hooks/         # Custom React hooks
    └── public/
```

## ✨ Features

### 🔐 Authentication System
- **User Registration/Login**: Secure authentication with JWT tokens
- **Password Reset**: Email-based password recovery with verification codes
- **Profile Management**: Update user information and avatars
- **Persistent Sessions**: localStorage-based session management

### 🏠 Landing Page
- **Modern Hero Section**: Engaging welcome with call-to-action buttons
- **Feature Showcase**: Highlighting platform capabilities
- **Statistics Display**: User engagement metrics
- **Responsive Design**: Mobile-first approach with desktop optimization

### 🎨 UI/UX Components
- **UserAvatar**: Dynamic avatar component with fallback support
- **FlavorWorld Design System**: Consistent color palette and typography
- **Interactive Elements**: Hover effects and smooth transitions
- **Form Validation**: Real-time input validation with error states

### 🔄 Real-time Features (In Progress)
- **Socket.IO Integration**: Real-time chat and notifications
- **Group Messaging**: Community-based discussions
- **Live Recipe Sharing**: Instant recipe updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flavorworld.git
   cd flavorworld
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   echo "PORT=3000" > .env
   echo "MONGODB_URI=mongodb://localhost:27017/flavorworld" >> .env
   echo "JWT_SECRET=your_jwt_secret_here" >> .env
   
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
}
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800, 900

## 🔄 Migration Progress

### ✅ Completed
- [x] Project setup with Vite
- [x] Authentication system (login/register)
- [x] UserAvatar component migration
- [x] AuthContext state management
- [x] Landing page design
- [x] Responsive CSS implementation
- [x] API service layer
- [x] Routing setup with React Router

### 🚧 In Progress
- [ ] Recipe components migration
- [ ] Group/community features
- [ ] Chat system integration
- [ ] Profile management pages
- [ ] Search functionality

### 📋 Planned
- [ ] Recipe creation/editing
- [ ] Image upload system
- [ ] Advanced search filters
- [ ] User dashboard
- [ ] Mobile PWA features
- [ ] Performance optimization

## 🛠️ Development

### Available Scripts

#### Frontend (client/)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend (server/)
```bash
npm start            # Start production server
npm run dev          # Start with nodemon (development)
npm test             # Run tests
```

### Code Style
- **Frontend**: ESLint + Prettier
- **Backend**: Node.js best practices
- **CSS**: BEM methodology with CSS custom properties
- **Naming**: camelCase for JavaScript, kebab-case for CSS classes

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgotpassword` - Password reset request
- `POST /api/auth/check-email` - Check email availability
- `POST /api/auth/send-reset-code` - Send reset verification code
- `POST /api/auth/verify-reset-code` - Verify reset code
- `POST /api/auth/reset-password` - Reset password with code

### Future Endpoints (Planned)
- `/api/recipes` - Recipe CRUD operations
- `/api/groups` - Community group management
- `/api/chat` - Real-time messaging
- `/api/users` - User profile management

## 📱 Responsive Design

The application is built with a mobile-first approach:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: 1024px+

Key responsive features:
- Flexible grid layouts
- Scalable typography
- Touch-friendly interface
- Optimized images

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting (planned)
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development**: Full-stack React & Node.js development
- **Design**: Modern UI/UX with emphasis on food community features
- **Migration**: React Native to React Web conversion

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/flavorworld/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

## 🎯 Roadmap

### Phase 1: Core Migration (Current)
- Complete React Native to React Web migration
- Implement core authentication and user management
- Set up responsive design system

### Phase 2: Feature Expansion
- Recipe creation and sharing system
- Community groups and discussions
- Real-time chat integration

### Phase 3: Advanced Features
- Advanced search and filtering
- Recipe recommendations
- Social features (likes, comments, follows)
- Mobile PWA implementation

---

**Made with ❤️ for food lovers around the world** 🌍🍽️