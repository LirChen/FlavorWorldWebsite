import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Key
} from 'lucide-react';
import { authService } from '../../services/authService';
import './NewPasswordScreen.css';

const NewPasswordScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetCode, verificationToken } = location.state || {};
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = passwordValidation.isValid && passwordsMatch;

  const handleResetPassword = async () => {
    if (!isFormValid) {
      alert('Please ensure your password meets all requirements and passwords match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.resetPasswordWithCode(
        email, 
        resetCode, 
        password, 
        verificationToken
      );
      
      if (result.success) {
        if (window.confirm('Success! Your password has been reset successfully. You can now login with your new password. Would you like to go to login?')) {
          navigate('/login');
        }
      } else {
        alert(result.message || 'Failed to reset password');
      }
    } catch (error) {
      alert('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordRequirement = (met, text) => (
    <div className="requirement-item">
      {met ? (
        <CheckCircle className="requirement-icon" style={{ color: '#27AE60' }} />
      ) : (
        <XCircle className="requirement-icon" style={{ color: '#E74C3C' }} />
      )}
      <span className={`requirement-text ${met ? 'met' : 'unmet'}`}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="new-password-screen">
      <div className="new-password-container">
        {/* Header */}
        <div className="new-password-header">
          <div className="logo-container">
            <div className="logo-background">
              <Key size={44} style={{ color: '#4ECDC4' }} />
            </div>
          </div>

          <h1 className="title">Create New Password</h1>
          
          <p className="subtitle">
            Create a strong password for your account
          </p>
          <p className="email-text">{email}</p>
        </div>

        {/* Form */}
        <div className="new-password-form">
          {/* New Password Input */}
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
              >
                {showPassword ? (
                  <EyeOff size={20} style={{ color: '#7F8C8D' }} />
                ) : (
                  <Eye size={20} style={{ color: '#7F8C8D' }} />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="requirements-box">
              <h3 className="requirements-title">Password Requirements:</h3>
              {renderPasswordRequirement(passwordValidation.minLength, 'At least 8 characters')}
              {renderPasswordRequirement(passwordValidation.hasUpperCase, 'One uppercase letter')}
              {renderPasswordRequirement(passwordValidation.hasLowerCase, 'One lowercase letter')}
              {renderPasswordRequirement(passwordValidation.hasNumbers, 'One number')}
              {renderPasswordRequirement(passwordValidation.hasSpecialChar, 'One special character')}
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`password-input ${
                  confirmPassword.length > 0 && !passwordsMatch ? 'error' :
                  confirmPassword.length > 0 && passwordsMatch ? 'success' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="toggle-password-btn"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} style={{ color: '#7F8C8D' }} />
                ) : (
                  <Eye size={20} style={{ color: '#7F8C8D' }} />
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="match-indicator">
                {passwordsMatch ? (
                  <CheckCircle className="match-icon" style={{ color: '#27AE60' }} />
                ) : (
                  <XCircle className="match-icon" style={{ color: '#E74C3C' }} />
                )}
                <span className={`match-text ${passwordsMatch ? 'success' : 'danger'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button
              onClick={handleResetPassword}
              disabled={!isFormValid || isLoading}
              className="submit-btn"
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* Back Button */}
          <div className="back-section">
            <button
              onClick={() => navigate(-1)}
              className="back-btn"
            >
              <ArrowLeft className="back-icon" />
              Back to Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordScreen;