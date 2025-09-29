import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import AuthNavigator from './AuthNavigator';
import HomeNavigator from './HomeNavigator';

const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #075eec',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter> 
      <Routes>
        {isLoggedIn ? (
          <Route path="/*" element={<HomeNavigator />} />
        ) : (
          <Route path="/*" element={<AuthNavigator />} />
        )}
        
      </Routes>
    </BrowserRouter>
  );
};

export default AppNavigator;