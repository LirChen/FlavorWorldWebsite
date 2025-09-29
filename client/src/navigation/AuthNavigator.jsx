import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterScreen from '../pages/Auth/RegisterScreen';
import ForgotPasswordScreen from '../pages/Auth/ForgotPasswordScreen';
import PasswordResetCodeScreen from '../pages/Auth/PasswordResetCodeScreen';
import NewPasswordScreen from '../pages/Auth/NewPasswordScreen';
import LoginScreen from '../pages/Auth/LoginScreen';

const AuthNavigator = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={<Navigate to="/login" replace />} 
      />
      
      <Route 
        path="/login" 
        element={<LoginScreen />} 
      />
      
      <Route 
        path="/register" 
        element={<RegisterScreen />} 
      />
      
      <Route 
        path="/forgot-password" 
        element={<ForgotPasswordScreen />} 
      />
      
      <Route 
        path="/password-reset-code" 
        element={<PasswordResetCodeScreen />} 
      />
      
      <Route 
        path="/new-password" 
        element={<NewPasswordScreen />} 
      />

    </Routes>
  );
};

export default AuthNavigator;