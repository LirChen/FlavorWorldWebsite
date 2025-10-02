import React from 'react';
import './LoadingScreen.css';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <span className="logo-text">FlavorWorld</span>
        </div>
        
        <div className="loading-spinner-container">
          <Loader2 className="loading-spinner" size={48} />
        </div>
        
        <p className="loading-text">Loading delicious recipes...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;