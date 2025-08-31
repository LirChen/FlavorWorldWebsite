import React from 'react';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E8E8E8',
};

const DefaultAvatar = ({
  size = 40,
  name = 'Anonymous',
  backgroundColor = '#E8E8E8',
  textColor = '#7F8C8D',
  onClick = null,
  className = '',
}) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'A';

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: backgroundColor,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: FLAVORWORLD_COLORS.primary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: size * 0.4,
    fontWeight: 600,
    color: textColor,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    userSelect: 'none',
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

  const handleMouseEnter = (e) => {
    if (onClick) {
      e.currentTarget.style.transform = 'scale(1.05)';
      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    }
  };

  const handleMouseLeave = (e) => {
    if (onClick) {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <div
      style={avatarStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`default-avatar ${className}`}
      title={name}
      role={onClick ? 'button' : 'img'}
      aria-label={`Avatar for ${name}`}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {firstLetter}
    </div>
  );
};

export default DefaultAvatar;
