import React, { useState, useEffect } from 'react';

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

// Mock UserAvatar component
const UserAvatar = ({ uri, name, size = 50, showOnlineStatus, isOnline, style }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: FLAVORWORLD_COLORS.secondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: FLAVORWORLD_COLORS.white,
      fontWeight: 'bold',
      fontSize: size * 0.4,
      ...style
    }}>
      {uri ? (
        <img 
          src={uri} 
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
      {showOnlineStatus && (
        <div style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: '50%',
          backgroundColor: isOnline ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.textLight,
          border: `2px solid ${FLAVORWORLD_COLORS.white}`,
        }} />
      )}
    </div>
  );
};

// Mock hooks and services
const useAuth = () => ({
  currentUser: { id: '123', userName: 'TestUser' }
});

const chatService = {
  searchUsers: (query) => ({
    success: true,
    data: [
      {
        userId: '456',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        userAvatar: null,
        userBio: 'Software Developer at TechCorp'
      },
      {
        userId: '789',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        userAvatar: null,
        userBio: 'UX Designer passionate about user experiences'
      },
      {
        userId: '101',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        userAvatar: null,
        userBio: 'Product Manager building amazing products'
      }
    ].filter(user => 
      user.userName.toLowerCase().includes(query.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(query.toLowerCase())
    )
  }),
  getOrCreatePrivateChat: (userId) => ({
    success: true,
    data: { _id: 'chat-' + userId + '-' + Date.now() }
  })
};

const UserSearchScreen = ({ 
  route = { params: { purpose: 'chat', title: 'Search Users' } },
  navigation = { goBack: () => console.log('Go back'), navigate: (route, params) => console.log('Navigate to:', route, params) } 
}) => {
  const { currentUser } = useAuth();
  const { purpose = 'chat', title = 'Search Users' } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      const timeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
      
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const result = await chatService.searchUsers(query);
      
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        console.error('Search error:', result.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search users error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = async (user) => {
    if (purpose === 'chat') {
      await startPrivateChat(user);
    } else {
      navigation.navigate(route.params.returnScreen || 'ChatList', { selectedUser: user });
    }
  };

  const startPrivateChat = async (user) => {
    try {
      setCreating(true);
      
      const result = await chatService.getOrCreatePrivateChat(user.userId);
      
      if (result.success) {
        const otherUser = {
          userId: user.userId,
          userName: user.userName,
          userAvatar: user.userAvatar,
        };
        
        navigation.navigate('ChatConversation', {
          chatId: result.data._id,
          otherUser: otherUser,
        });
      } else {
        alert(result.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create private chat error:', error);
      alert('Problem creating chat');
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = (item) => (
    <div
      key={item.userId}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
        cursor: creating ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        opacity: creating ? 0.6 : 1
      }}
      onClick={() => !creating && handleUserPress(item)}
      onMouseEnter={(e) => !creating && (e.target.style.backgroundColor = FLAVORWORLD_COLORS.background)}
      onMouseLeave={(e) => !creating && (e.target.style.backgroundColor = FLAVORWORLD_COLORS.white)}
    >
      <UserAvatar
        uri={item.userAvatar}
        name={item.userName}
        size={50}
        showOnlineStatus={false}
      />

      <div style={{ flex: 1, marginLeft: 12 }}>
        <div style={{
          fontSize: 16,
          fontWeight: '600',
          color: FLAVORWORLD_COLORS.text,
          marginBottom: 2
        }}>
          {item.userName}
        </div>
        <div style={{
          fontSize: 14,
          color: FLAVORWORLD_COLORS.textLight,
          marginBottom: 2
        }}>
          {item.userEmail}
        </div>
        {item.userBio && (
          <div style={{
            fontSize: 14,
            color: FLAVORWORLD_COLORS.text,
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.userBio}
          </div>
        )}
      </div>

      <div style={{
        padding: 12,
        backgroundColor: FLAVORWORLD_COLORS.background,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{
          fontSize: 20,
          color: FLAVORWORLD_COLORS.primary
        }}>
          {purpose === 'chat' ? '💬' : '👤➕'}
        </span>
      </div>
    </div>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px'
        }}>
          <div style={{ fontSize: 80, color: FLAVORWORLD_COLORS.textLight }}>🔍</div>
          <h3 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: FLAVORWORLD_COLORS.text,
            marginTop: 16,
            marginBottom: 8,
            textAlign: 'center'
          }}>
            Search for Users
          </h3>
          <p style={{
            fontSize: 16,
            color: FLAVORWORLD_COLORS.textLight,
            textAlign: 'center',
            lineHeight: 1.4,
            margin: 0
          }}>
            Type at least 2 characters to start searching for users
          </p>
        </div>
      );
    }

    if (searchQuery.trim().length >= 2 && !loading && searchResults.length === 0) {
      return (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px'
        }}>
          <div style={{ fontSize: 80, color: FLAVORWORLD_COLORS.textLight }}>👤</div>
          <h3 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: FLAVORWORLD_COLORS.text,
            marginTop: 16,
            marginBottom: 8,
            textAlign: 'center'
          }}>
            No Users Found
          </h3>
          <p style={{
            fontSize: 16,
            color: FLAVORWORLD_COLORS.textLight,
            textAlign: 'center',
            lineHeight: 1.4,
            margin: 0
          }}>
            No users found matching "{searchQuery}"
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: FLAVORWORLD_COLORS.background
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: FLAVORWORLD_COLORS.white,
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
      }}>
        <button 
          style={{
            padding: 8,
            backgroundColor: FLAVORWORLD_COLORS.background,
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer'
          }}
          onClick={() => navigation.goBack()}
        >
          ←
        </button>
        <h2 style={{
          fontSize: 18,
          fontWeight: '600',
          color: FLAVORWORLD_COLORS.text,
          flex: 1,
          textAlign: 'center',
          margin: '0 16px'
        }}>
          {title}
        </h2>
        <div style={{ width: 40 }} />
      </div>

      {/* Search Container */}
      <div style={{
        backgroundColor: FLAVORWORLD_COLORS.white,
        padding: 16,
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: FLAVORWORLD_COLORS.background,
          borderRadius: 12,
          padding: '12px 16px'
        }}>
          <span style={{
            fontSize: 20,
            color: FLAVORWORLD_COLORS.textLight,
            marginRight: 8
          }}>
            🔍
          </span>
          <input
            type="text"
            style={{
              flex: 1,
              fontSize: 16,
              color: FLAVORWORLD_COLORS.text,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none'
            }}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: FLAVORWORLD_COLORS.textLight
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        backgroundColor: FLAVORWORLD_COLORS.white,
        position: 'relative'
      }}>
        {loading && (
          <div style={{
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: `4px solid ${FLAVORWORLD_COLORS.primary}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              marginTop: 16,
              fontSize: 16,
              color: FLAVORWORLD_COLORS.textLight
            }}>
              Searching users...
            </p>
          </div>
        )}

        <div style={{
          height: '100%',
          overflowY: 'auto'
        }}>
          {searchResults.length === 0 ? (
            renderEmptyState()
          ) : (
            searchResults.map(renderUserItem)
          )}
        </div>
      </div>

      {/* Creating Overlay */}
      {creating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderRadius: 20,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: `4px solid ${FLAVORWORLD_COLORS.primary}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              marginTop: 16,
              fontSize: 16,
              color: FLAVORWORLD_COLORS.text,
              fontWeight: '500'
            }}>
              Creating chat...
            </p>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default UserSearchScreen;