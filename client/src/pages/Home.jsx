import React from 'react';
import { useAuth } from '../services/AuthContext';
import './Home.css';

function Home() {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🍲</div>
            <h1 className="logo-title">FlavorWorld</h1>
          </div>
          
          <nav className="nav-menu">
            <a href="/recipes" className="nav-link">Recipes</a>
            <a href="/groups" className="nav-link">Groups</a>
            <a href="/chat" className="nav-link">Chat</a>
            <a href="/profile" className="nav-link">Profile</a>
          </nav>

          <div className="user-section">
            {currentUser ? (
              <div className="user-info">
                <span className="welcome-text">Welcome, {currentUser.fullName}!</span>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <a href="/login" className="login-link">Login</a>
                <a href="/register" className="register-link">Join FlavorWorld</a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Share Your <span className="highlight">Culinary</span> Journey
          </h1>
          <p className="hero-subtitle">
            Join thousands of food lovers sharing recipes, creating communities, 
            and discovering amazing flavors from around the world.
          </p>
          
          <div className="hero-buttons">
            <a href="/recipes" className="cta-primary">Explore Recipes</a>
            <a href="/groups" className="cta-secondary">Join Groups</a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Recipes</span>
            </div>
            <div className="stat">
              <span className="stat-number">5K+</span>
              <span className="stat-label">Members</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Groups</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <h2 className="section-title">What Makes FlavorWorld Special</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍳</div>
              <h3 className="feature-title">Share Recipes</h3>
              <p className="feature-description">
                Upload your favorite recipes with photos and step-by-step instructions
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3 className="feature-title">Join Communities</h3>
              <p className="feature-description">
                Connect with like-minded food lovers in specialized cooking groups
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Real-time Chat</h3>
              <p className="feature-description">
                Chat with fellow chefs and share cooking tips in real-time
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Track Progress</h3>
              <p className="feature-description">
                Monitor your cooking journey with detailed analytics and insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-icon">🍲</div>
            <span>FlavorWorld</span>
          </div>
          
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          
          <div className="footer-copyright">
            <p>&copy; 2024 FlavorWorld. Made with ❤️ for food lovers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;