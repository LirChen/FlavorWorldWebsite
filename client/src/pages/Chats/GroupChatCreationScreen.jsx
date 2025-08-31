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
  getMyChats: () => ({
    success: true,
    data: [
      {
        otherUser: {
          userId: '456',
          userName: 'John Doe',
          userAvatar: null,
          userEmail: 'john@example.com',
          userBio: 'Software Developer'
        }
      },
      {
        otherUser: {
          userId: '789',
          userName: 'Jane Smith',
          userAvatar: null,
          userEmail: 'jane@example.com',
          userBio: 'Designer'
        }
      },
      {
        otherUser: {
          userId: '101',
          userName: 'Bob Wilson',
          userAvatar: null,
          userEmail: 'bob@example.com',
          userBio: 'Product Manager'
        }
      }
    ]
  }),
  createGroupChat: (name, description, participantIds) => ({
    success: true,
    data: {
      _id: 'new-group-' + Date.now(),
      name: name,
      description: description,
      participants: participantIds
    }
  })
};

const GroupChatCreationScreen = ({ 
  navigation = { goBack: () => console.log('Go back'), navigate: (route, params) => console.log('Navigate to:', route, params) } 
}) => {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const result = await getAvailableUsersForCreation();
      
      if (result.success) {
        setAvailableUsers(result.data || []);
      } else {
        alert(result.message || 'Failed to load available users');
      }
    } catch (error) {
      console.error('Load available users error:', error);
      alert('There was a problem loading available users');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableUsersForCreation = async () => {
    try {
      console.log(' Getting available users for new group creation');
      
      const chatsResult = await chatService.getMyChats();
      
      if (!chatsResult.success || !chatsResult.data || chatsResult.data.length === 0) {
        console.log(' No chats found or error occurred');
        return { 
          success: true, 
          data: [],
          message: 'No private chats found'
        };
      }
      
      const getCurrentUserId = () => {
        if (!currentUser) return null;
        
        return currentUser._id || currentUser.id || currentUser.userId || null;
      };
      
      const currentUserId = getCurrentUserId();
      console.log(' Current user ID for creation:', currentUserId);
      
      if (!currentUserId) {
        return {
          success: false,
          message: 'User ID not found',
          data: []
        };
      }
      
      const availableUsers = [];
      
      chatsResult.data.forEach((chat) => {
        if (chat.otherUser && chat.otherUser.userId !== currentUserId) {
          const user = {
            userId: chat.otherUser.userId,
            userName: chat.otherUser.userName || 'Unknown User',
            userAvatar: chat.otherUser.userAvatar,
            userEmail: chat.otherUser.userEmail || 'No email',
            userBio: chat.otherUser.userBio || '',
            hasPrivateChat: true,
            isFollowing: false
          };
          
          availableUsers.push(user);
        }
      });
      
      const uniqueUsers = availableUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.userId === user.userId)
      );
      
      console.log(' Available users for new group:', uniqueUsers.length);
      return { success: true, data: uniqueUsers };

    } catch (error) {
      console.error(' Get available users for creation error:', error);
      return { 
        success: false, 
        message: 'Failed to get available users',
        data: []
      };
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prevSelected => {
      const isSelected = prevSelected.some(u => u.userId === user.userId);
      
      if (isSelected) {
        return prevSelected.filter(u => u.userId !== user.userId);
      } else {
        return [...prevSelected, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please select at least one participant');
      return;
    }

    setCreating(true);

    try {
      const participantIds = selectedUsers.map(user => user.userId);
      
      console.log(' Creating group with participants:', participantIds);
      console.log(' Creator ID:', currentUser?._id || currentUser?.id);
      
      const result = await chatService.createGroupChat(
        groupName.trim(),
        groupDescription.trim(),
        participantIds
      );

      if (result.success) {
        if (window.confirm('Group chat created successfully!')) {
          navigation.navigate('GroupChatConversation', {
            chatId: result.data._id,
            groupChat: result.data,
          });
        }
      } else {
        alert(result.message || 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Create group chat error:', error);
      alert('There was a problem creating the group chat');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    return user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderUserItem = (item) => {
    const isSelected = selectedUsers.some(u => u.userId === item.userId);

    return (
      <div
        key={item.userId}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
          backgroundColor: isSelected ? FLAVORWORLD_COLORS.background : FLAVORWORLD_COLORS.white,
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={() => toggleUserSelection(item)}
        onMouseEnter={(e) => !isSelected && (e.target.style.backgroundColor = FLAVORWORLD_COLORS.background)}
        onMouseLeave={(e) => !isSelected && (e.target.style.backgroundColor = FLAVORWORLD_COLORS.white)}
      >
        <UserAvatar
          uri={item.userAvatar}
          name={item.userName}
          size={40}
          showOnlineStatus={false}
        />

        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{
            fontSize: 16,
            fontWeight: '500',
            color: FLAVORWORLD_COLORS.text,
            marginBottom: 4
          }}>
            {item.userName}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {item.isFollowing && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                borderRadius: 12,
                padding: '2px 8px',
                marginRight: 8
              }}>
                <span style={{ fontSize: 12, marginRight: 4 }}>👤</span>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Following
                </span>
              </div>
            )}
            {item.hasPrivateChat && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.secondary,
                borderRadius: 12,
                padding: '2px 8px',
                marginRight: 8
              }}>
                <span style={{ fontSize: 12, marginRight: 4 }}>💬</span>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Chatted
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          border: `2px solid ${isSelected ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border}`,
          backgroundColor: isSelected ? FLAVORWORLD_COLORS.primary : 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isSelected && (
            <span style={{ color: FLAVORWORLD_COLORS.white, fontSize: 16 }}>✓</span>
          )}
        </div>
      </div>
    );
  };

  const renderSelectedUser = (item) => (
    <div key={item.userId} style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: FLAVORWORLD_COLORS.primary,
      borderRadius: 20,
      padding: '8px 12px',
      marginRight: 8,
      maxWidth: 120
    }}>
      <UserAvatar
        uri={item.userAvatar}
        name={item.userName}
        size={32}
        showOnlineStatus={false}
      />
      <span style={{
        color: FLAVORWORLD_COLORS.white,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        marginRight: 4,
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {item.userName}
      </span>
      <button
        onClick={() => toggleUserSelection(item)}
        style={{
          background: 'transparent',
          border: 'none',
          color: FLAVORWORLD_COLORS.textLight,
          cursor: 'pointer',
          padding: 2,
          fontSize: 16
        }}
      >
        ×
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: FLAVORWORLD_COLORS.background
      }}>
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
            Create Group Chat
          </h2>
          <div style={{ width: 40 }} />
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
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
            Loading available users...
          </p>
        </div>
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
  }

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
          Create Group Chat
        </h2>
        <button 
          style={{
            backgroundColor: (!groupName.trim() || selectedUsers.length === 0 || creating) 
              ? FLAVORWORLD_COLORS.textLight 
              : FLAVORWORLD_COLORS.primary,
            color: FLAVORWORLD_COLORS.white,
            border: 'none',
            padding: '8px 16px',
            borderRadius: 20,
            cursor: (!groupName.trim() || selectedUsers.length === 0 || creating) ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: '600'
          }}
          onClick={handleCreateGroup}
          disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid transparent',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            'Create'
          )}
        </button>
      </div>

      {/* Group Information Section */}
      <div style={{
        backgroundColor: FLAVORWORLD_COLORS.white,
        padding: 16,
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: '600',
          color: FLAVORWORLD_COLORS.text,
          marginBottom: 16,
          margin: '0 0 16px 0'
        }}>
          Group Information
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: FLAVORWORLD_COLORS.background,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 12
        }}>
          <span style={{ fontSize: 20, color: FLAVORWORLD_COLORS.textLight, marginRight: 12 }}>👥</span>
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
            placeholder="Group Name (Required)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          backgroundColor: FLAVORWORLD_COLORS.background,
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 12
        }}>
          <span style={{ fontSize: 20, color: FLAVORWORLD_COLORS.textLight, marginRight: 12, marginTop: 2 }}>📝</span>
          <textarea
            style={{
              flex: 1,
              fontSize: 16,
              color: FLAVORWORLD_COLORS.text,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              minHeight: 40
            }}
            placeholder="Group Description (Optional)"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </div>
      </div>

      {/* Selected Users Section */}
      {selectedUsers.length > 0 && (
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          padding: 16,
          borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
          maxHeight: 120
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            marginBottom: 16,
            margin: '0 0 16px 0'
          }}>
            Selected Participants ({selectedUsers.length})
          </h3>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '0 4px'
          }}>
            {selectedUsers.map(renderSelectedUser)}
          </div>
        </div>
      )}

      {/* Users Section */}
      <div style={{
        flex: 1,
        backgroundColor: FLAVORWORLD_COLORS.white,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px 16px 8px 16px' }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            marginBottom: 16,
            margin: '0 0 16px 0'
          }}>
            Available Users
          </h3>
          
          {/* Search Container */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: FLAVORWORLD_COLORS.background,
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 8
          }}>
            <span style={{ fontSize: 20, color: FLAVORWORLD_COLORS.textLight, marginRight: 8 }}>🔍</span>
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Users List */}
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px 40px'
            }}>
              <div style={{ fontSize: 60, color: FLAVORWORLD_COLORS.textLight }}>👥</div>
              <h4 style={{
                fontSize: 16,
                fontWeight: '600',
                color: FLAVORWORLD_COLORS.text,
                marginTop: 16,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                {searchQuery ? 'No users found matching your search' : 'No available users to invite'}
              </h4>
              <p style={{
                fontSize: 14,
                color: FLAVORWORLD_COLORS.textLight,
                textAlign: 'center',
                lineHeight: 1.4,
                margin: 0
              }}>
                You can only invite people you follow or have chatted with before
              </p>
            </div>
          ) : (
            filteredUsers.map(renderUserItem)
          )}
        </div>
      </div>

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

export default GroupChatCreationScreen;