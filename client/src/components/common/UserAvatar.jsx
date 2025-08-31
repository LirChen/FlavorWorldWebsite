import React, { useState } from 'react';
import './UserAvatar.css';

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

const UserAvatar = ({ 
  uri, 
  name = 'Anonymous', 
  size = 40, 
  onClick = null,
  showOnlineStatus = false,
  isOnline = false,
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const renderAvatar = () => {
    if (uri && !imageError) {
      return (
        <img
          src={uri}
          alt={name}
          className="user-avatar-image"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          onError={handleImageError}
        />
      );
    } else {
      return (
        <div 
          className="user-avatar-default"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        >
          <div className="user-avatar-default-inner">
            <svg 
              width={size * 0.6} 
              height={size * 0.6} 
              viewBox="0 0 24 24" 
              fill={FLAVORWORLD_COLORS.textLight}
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      );
    }
  };

  if (onClick) {
    return (
      <button 
        className="user-avatar-container user-avatar-clickable" 
        style={style}
        onClick={onClick}
      >
        <div className="user-avatar-wrapper">
          {renderAvatar()}
          {showOnlineStatus && (
            <div 
              className="user-avatar-online-indicator"
              style={{ backgroundColor: isOnline ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.textLight }}
            />
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="user-avatar-container" style={style}>
      <div className="user-avatar-wrapper">
        {renderAvatar()}
        {showOnlineStatus && (
          <div 
            className="user-avatar-online-indicator"
            style={{ backgroundColor: isOnline ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.textLight }}
          />
        )}
      </div>
    </div>
  );
};

export default UserAvatar;