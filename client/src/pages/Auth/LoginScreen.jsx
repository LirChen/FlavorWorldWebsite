import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../services/AuthContext';
import { chatService } from '../../services/chatServices';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E8E8E8',
  success: '#27AE60',
  danger: '#E74C3C',
};

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  
  const [isFormValid, setIsFormValid] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
    console.log(' Login button pressed!');
    console.log(' Form data:', form);
    
    if (!validateForm()) {
      console.log(' Form validation failed');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(' Calling authService.login...');
      const result = await authService.login({ 
        email: form.email, 
        password: form.password 
      });
      
      console.log(' AuthService result:', result);
      
      if (result.success) {
        console.log(' Login successful, processing data...');
        
        const { token, user } = result.data;
        console.log(' Token:', token);
        console.log(' User:', user);
        
        if (token && user) {
          console.log(' Calling context login...');
          await login(token, user);
          console.log(' Context login completed');
          await chatService.initializeSocket(user);

          alert(`Welcome! Hello ${user.fullName || user.name || 'Chef'}!`);
        } else {
          console.log(' Missing token or user data');
          alert('Error: Invalid response from server');
        }
      } else {
        console.log(' Login failed:', result.message);
        alert(`Login Failed: ${result.message}`);
      }
    } catch (error) {
      console.error(' Login error:', error);
      alert('Error: Login failed. Please try again.');
    } finally {
      console.log(' Setting loading to false');
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="login-screen">
        <div className="container">
        <div className="header">
            <div className="logo-container">
            <div className="logo-background">
                <span className="logo-text">🍳</span>
            </div>
            </div>

            <h1 className="title">
            Welcome to <span className="title-highlight">FlavorWorld</span>
            </h1>

            <p className="subtitle">
            Join the delicious recipe community
            </p>
        </div>

        <div className="form">
            <div className="input-group">
            <label className="input-label">Email address</label>
            <div>
                <input
                type="email"
                autoComplete="email"
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="example@FlavorWorld.com"
                className={`input-control ${emailError ? 'input-error' : ''}`}
                value={form.email}
                />
                {emailError && <span className="error-text">{emailError}</span>}
            </div>
            </div>

            <div className="input-group">
            <label className="input-label">Password</label>
            <div>
                <div className="password-container">
                <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    className={`input-control password-input ${passwordError ? 'input-error' : ''}`}
                    value={form.password}
                />
                <button 
                    type="button"
                    className="visibility-icon" 
                    onClick={togglePasswordVisibility}
                >
                    <span className="eye-icon">
                    {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                    </span>
                </button>
                </div>
                {passwordError && <span className="error-text">{passwordError}</span>}
            </div>
            </div>

            <div className="form-action">
            <button 
                onClick={handleLogin}
                disabled={isLoading}
                className={`btn ${isLoading ? 'btn-disabled' : ''}`}
            >
                {isLoading ? (
                <div className="spinner">Loading...</div>
                ) : (
                'Sign in'
                )}
            </button>
            </div>

            <button
                type="button"
                className="form-link-button"
                onClick={() => navigate('/forgot-password')}
            >
                <span className="form-link">Forgot password?</span>
            </button>
        </div>
        </div>

        <button
            type="button"
            className="form-footer-button"
            onClick={() => navigate('/register')}
        >
            <p className="form-footer">
                Don't have an account?{' '}
                <span className="form-footer-link">Join FlavorWorld</span>
            </p>
        </button>
    </div>
    );
};

