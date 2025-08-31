import React from 'react';
import { Loader2 } from 'lucide-react';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
};

const LoadingScreen = () => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
    >
      {/* Logo Container */}
      <div className="text-center mb-15">
        <div 
          className="w-30 h-30 mx-auto rounded-3xl flex items-center justify-center shadow-2xl border-4 mb-5 animate-pulse"
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderColor: FLAVORWORLD_COLORS.primary,
            width: '120px',
            height: '120px',
            animation: 'float 3s ease-in-out infinite'
          }}
        >
          <span className="text-5xl">🍳</span>
        </div>
        <h1 
          className="text-4xl font-bold tracking-wider"
          style={{ 
            color: FLAVORWORLD_COLORS.accent,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          FlavorWorld
        </h1>
      </div>
      
      {/* Loading Container */}
      <div className="text-center mb-10">
        <div className="mb-4 flex justify-center">
          <Loader2 
            className="w-8 h-8 animate-spin" 
            style={{ color: FLAVORWORLD_COLORS.primary }}
          />
        </div>
        <p 
          className="text-lg font-medium"
          style={{ color: FLAVORWORLD_COLORS.text }}
        >
          Loading delicious recipes...
        </p>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-15 text-center">
        <p 
          className="text-sm font-medium"
          style={{ color: FLAVORWORLD_COLORS.textLight }}
        >
          Welcome to the recipe community
        </p>
      </div>

      {/* Custom CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        /* Pulsing effect for logo */
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(245, 166, 35, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(245, 166, 35, 0.6);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;