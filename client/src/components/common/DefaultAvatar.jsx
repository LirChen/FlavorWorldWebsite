import React from 'react';
import './DefaultAvatar.css';

const DefaultAvatar = ({
  size = 40,
  name = 'Anonymous',
  onClick = null,
  className = '',
}) => {
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'A';

  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    fontSize: size * 0.4,
  };

  return (
    <div
      style={style}
      onClick={onClick}
      className={`default-avatar ${onClick ? 'clickable' : ''} ${className}`}
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