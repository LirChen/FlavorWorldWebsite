import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';
import { authService } from '../../services/authService';
import { chatService } from '../../services/chatServices';
import { useAuth } from '../../services/AuthContext';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Login form state
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || email.trim() === '') {
      setEmailError('Please enter an email address');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };
  
  const validatePassword = (password) => {
    if (!password || password.trim() === '') {
      setPasswordError('Please enter a password');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const validateForm = () => {
    const isEmailValid = validateEmail(form.email);
    const isPasswordValid = validatePassword(form.password);
    return isEmailValid && isPasswordValid;
  };
  
  const handleEmailChange = (text) => {
    setForm({ ...form, email: text });
    const isEmailValid = validateEmail(text);
    const isPasswordValid = form.password.length > 0 && !passwordError;
    setIsFormValid(isEmailValid && isPasswordValid);
  };
  
  const handlePasswordChange = (text) => {
    setForm({ ...form, password: text });
    const isPasswordValid = validatePassword(text);
    const isEmailValid = form.email.length > 0 && !emailError;
    setIsFormValid(isEmailValid && isPasswordValid);
  };
  
  const handleLogin = async () => {
    console.log('🔐 Login button pressed!');
    console.log('📝 Form data:', form);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔄 Calling authService.login...');
      const result = await authService.login({ 
        email: form.email, 
        password: form.password 
      });
      
      console.log('📊 AuthService result:', result);
      
      if (result.success) {
        console.log('✅ Login successful, processing data...');
        
        const { token, user } = result.data;
        console.log('🎫 Token:', token);
        console.log('👤 User:', user);
        
        if (token && user) {
          console.log('🔗 Calling context login...');
          await login(token, user);
          console.log('✅ Context login completed');
          
          // Initialize chat service
          await chatService.initializeSocket(user);
          console.log('💬 Chat service initialized');

          alert(`Welcome! Hello ${user.fullName || user.name || 'Chef'}!`);
          navigate('/home'); 
        } else {
          console.log('❌ Missing token or user data');
          alert('Error: Invalid response from server');
        }
      } else {
        console.log('❌ Login failed:', result.message);
        alert(`Login Failed: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      alert('Error: Login failed. Please try again.');
    } finally {
      console.log('🏁 Setting loading to false');
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="combined-landing-page">
      
      {/* Background decorative elements */}
      <div className="background-decorations" />

      {/* Main Content Container */}
      <div className="main-content-grid">
        
        {/* Left Side - Hero Content */}
        <div className="hero-side">
          
          {/* Hero Title */}
          <h1 className="hero-main-title">
            Share Your{' '}
            <span className="title-highlight">Culinary</span>{' '}
            Journey
          </h1>

          {/* Hero Subtitle */}
          <p className="hero-main-subtitle">
            Join thousands of food lovers sharing recipes, creating communities, 
            and discovering amazing flavors from around the world.
          </p>

          {/* Features List */}
          <div className="features-showcase">
            <div className="feature-item">
              <div className="feature-icon">🍳</div>
              <div className="feature-content">
                <h3 className="feature-title">Share Recipes</h3>
                <p className="feature-description">Upload your favorite recipes with photos</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-content">
                <h3 className="feature-title">Join Communities</h3>
                <p className="feature-description">Connect with like-minded food lovers</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <div className="feature-content">
                <h3 className="feature-title">Real-time Chat</h3>
                <p className="feature-description">Chat with fellow chefs instantly</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h3 className="feature-title">Track Progress</h3>
                <p className="feature-description">Monitor your cooking journey</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-side">
          
          {/* Login Card */}
          <div className="login-card">
            
            {/* Login Header */}
            <div className="login-header">
              <div className="login-logo">🍳</div>
              
              <h2 className="login-title">Welcome Back</h2>
              
              <p className="login-subtitle">
                Sign in to continue your culinary journey
              </p>
            </div>

            {/* Login Form */}
            <div className="login-form">
              
              {/* Email Field */}
              <div className="input-group">
                <label className="input-label">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="example@flavorworld.com"
                  className={`input-field ${emailError ? 'input-error' : ''}`}
                />
                {emailError && <span className="error-message">{emailError}</span>}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="password-container">
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    className={`input-field password-input ${passwordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle"
                  >
                    {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {passwordError && <span className="error-message">{passwordError}</span>}
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`login-button ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  'Sign in'
                )}
              </button>

              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Register Link */}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="register-link-container"
          >
            <p className="register-text">
              Don't have an account?{' '}
              <span className="register-link">Join FlavorWorld</span>
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}