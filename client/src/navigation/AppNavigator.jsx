import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import AuthNavigator from './AuthNavigator';
import HomeNavigator from './HomeNavigator';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, #FFF8F0 0%, #F7F0E6 100%)',
    gap: '24px'
  }}>
    <div style={{
      fontSize: '48px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #F5A623 0%, #4ECDC4 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '20px'
    }}>
      FlavorWorld
    </div>
    
    <Loader2 
      size={48} 
      style={{ 
        color: '#F5A623',
        animation: 'spin 1s linear infinite'
      }} 
    />
    
    <p style={{
      fontSize: '16px',
      color: '#7F8C8D',
      animation: 'pulse 2s ease-in-out infinite'
    }}>
      Loading delicious recipes...
    </p>
    
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
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