import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Key
} from 'lucide-react';
import { authService } from '../../../services/authService';

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

const NewPasswordScreen = ({ route, navigation }) => {
  const { email, resetCode, verificationToken } = route?.params || {};
  
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
          if (navigation) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } else {
            // Fallback for web routing
            window.location.href = '/login';
          }
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
    <div className="flex items-center mb-1">
      {met ? (
        <CheckCircle className="w-4 h-4 mr-2" style={{ color: FLAVORWORLD_COLORS.success }} />
      ) : (
        <XCircle className="w-4 h-4 mr-2" style={{ color: FLAVORWORLD_COLORS.danger }} />
      )}
      <span 
        className="text-sm"
        style={{ color: met ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.danger }}
      >
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: FLAVORWORLD_COLORS.background }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-9">
          <div className="mb-9">
            <div 
              className="w-25 h-25 mx-auto rounded-3xl flex items-center justify-center shadow-lg border-4"
              style={{ 
                backgroundColor: FLAVORWORLD_COLORS.white,
                borderColor: FLAVORWORLD_COLORS.secondary,
                width: '100px',
                height: '100px'
              }}
            >
              <Key className="w-10 h-10" style={{ color: FLAVORWORLD_COLORS.secondary }} />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4" style={{ color: FLAVORWORLD_COLORS.accent }}>
            Create New Password
          </h1>
          
          <p className="text-base font-medium mb-2" style={{ color: FLAVORWORLD_COLORS.textLight }}>
            Create a strong password for your account
          </p>
          <p className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.accent }}>
            {email}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* New Password Input */}
          <div>
            <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                style={{ 
                  borderColor: FLAVORWORLD_COLORS.border,
                  backgroundColor: FLAVORWORLD_COLORS.white,
                  color: FLAVORWORLD_COLORS.text
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                ) : (
                  <Eye className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                )}
              </button>
            </div>
          </div>

          {/* Password Requirements */}
          {password.length > 0 && (
            <div 
              className="p-4 rounded-xl border"
              style={{ 
                backgroundColor: FLAVORWORLD_COLORS.white,
                borderColor: FLAVORWORLD_COLORS.border
              }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                Password Requirements:
              </h3>
              {renderPasswordRequirement(passwordValidation.minLength, 'At least 8 characters')}
              {renderPasswordRequirement(passwordValidation.hasUpperCase, 'One uppercase letter')}
              {renderPasswordRequirement(passwordValidation.hasLowerCase, 'One lowercase letter')}
              {renderPasswordRequirement(passwordValidation.hasNumbers, 'One number')}
              {renderPasswordRequirement(passwordValidation.hasSpecialChar, 'One special character')}
            </div>
          )}

          {/* Confirm Password Input */}
          <div>
            <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 ${
                  confirmPassword.length > 0 && !passwordsMatch ? 'bg-red-50' :
                  confirmPassword.length > 0 && passwordsMatch ? 'bg-green-50' : ''
                }`}
                style={{ 
                  borderColor: FLAVORWORLD_COLORS.border,
                  backgroundColor: confirmPassword.length > 0 && !passwordsMatch ? '#FFF5F5' :
                                 confirmPassword.length > 0 && passwordsMatch ? '#F0FFF4' : 
                                 FLAVORWORLD_COLORS.white,
                  color: FLAVORWORLD_COLORS.text
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                ) : (
                  <Eye className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                )}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center mt-2">
                {passwordsMatch ? (
                  <CheckCircle className="w-4 h-4 mr-2" style={{ color: FLAVORWORLD_COLORS.success }} />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" style={{ color: FLAVORWORLD_COLORS.danger }} />
                )}
                <span 
                  className="text-sm font-medium"
                  style={{ color: passwordsMatch ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.danger }}
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6 pb-4">
            <button
              onClick={handleResetPassword}
              disabled={!isFormValid || isLoading}
              className={`w-full flex items-center justify-center px-5 py-3 rounded-full text-lg font-semibold transition-all ${
                (!isFormValid || isLoading) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:opacity-90 transform hover:scale-[1.02] shadow-lg'
              }`}
              style={{ 
                backgroundColor: (!isFormValid || isLoading) ? FLAVORWORLD_COLORS.textLight : FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white 
              }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => navigation?.goBack()}
              className="inline-flex items-center px-4 py-2 font-semibold hover:opacity-80 transition-opacity"
              style={{ color: FLAVORWORLD_COLORS.textLight }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPasswordScreen;