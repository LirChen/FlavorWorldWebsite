import React, { useState, useEffect, useCallback } from 'react';

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
const UserAvatar = ({ uri, name, size = 50, showOnlineStatus, isOnline }) => {
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
  getAllChats: async () => ({
    success: true,
    data: [
      {
        _id: '1',
        chatType: 'private',
        participants: [
          { userId: '123', userName: 'TestUser' },
          { userId: '456', userName: 'John Doe', userAvatar: null, isOnline: true }
        ],
        lastMessage: { content: 'Hey, how are you?', createdAt: new Date().toISOString() },
        unreadCount: 2,
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        chatType: 'group',
        name: 'Team Chat',
        image: null,
        participantsCount: 5,
        lastMessage: { 
          content: 'Meeting at 3 PM', 
          senderName: 'Alice',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        unreadCount: 0,
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }),
  initializeSocket: async () => {},
  onMessage: () => () => {},
  disconnect: () => {}
};

const ChatListScreen = ({ navigation = { goBack: () => console.log('Go back'), navigate: (route, params) => console.log('Navigate to:', route, params) } }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatTypeModal, setShowChatTypeModal] = useState(false);

  useEffect(() => {
    loadChats();
    initializeSocket();
    
    return () => {
      chatService.disconnect();
    };
  }, []);

  const initializeSocket = async () => {
    if (currentUser?.id || currentUser?._id) {
      await chatService.initializeSocket(currentUser.id || currentUser._id);
      
      const unsubscribe = chatService.onMessage((message) => {
        updateChatWithNewMessage(message);
      });
      
      return unsubscribe;
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const result = await chatService.getAllChats(); 
      
      if (result.success) {
        setChats(result.data || []);
      } else {
        alert(result.message || 'Failed to load chats');
      }
    } catch (error) {
      console.error('Load chats error:', error);
      alert('There was a problem loading the chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateChatWithNewMessage = (message) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.chatType === 'private' && chat._id === message.chatId) {
          return {
            ...chat,
            lastMessage: message,
            unreadCount: chat.unreadCount + 1,
            updatedAt: message.createdAt
          };
        }
        
        if (chat.chatType === 'group' && chat._id === message.groupChatId) {
          return {
            ...chat,
            lastMessage: message,
            unreadCount: chat.unreadCount + 1,
            updatedAt: message.createdAt
          };
        }
        
        return chat;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadChats();
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'yesterday';
      if (diffInDays < 7) return `${diffInDays}d`;
      return date.toLocaleDateString('en-US');
    }
  };

  const getOtherUser = (chat) => {
    if (chat.chatType !== 'private' || !chat.participants || chat.participants.length < 2) {
      return null;
    }
    
    const otherUser = chat.participants.find(p => 
      p.userId !== (currentUser?.id || currentUser?._id)
    );
    
    return otherUser || null;
  };

  const handleChatPress = (chat) => {
    if (chat.chatType === 'group') {
      navigation.navigate('GroupChatConversation', {
        chatId: chat._id,
        groupChat: chat,
      });
    } else {
      const otherUser = getOtherUser(chat);
      if (otherUser) {
        navigation.navigate('ChatConversation', {
          chatId: chat._id,
          otherUser: otherUser,
        });
      }
    }
  };

  const handleCreateChat = () => {
    setShowChatTypeModal(true);
  };

  const handleCreateGroupChat = () => {
    setShowChatTypeModal(false);
    navigation.navigate('GroupChatCreation');
  };

  const handleCreatePrivateChat = () => {
    setShowChatTypeModal(false);
    navigation.navigate('UserSearch', { 
      purpose: 'chat',
      title: 'Start Private Chat'
    });
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    if (chat.chatType === 'group') {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    const otherUser = getOtherUser(chat);
    if (!otherUser) return false;
    
    return otherUser.userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderChatItem = (item) => {
    const isGroupChat = item.chatType === 'group';
    const hasUnread = item.unreadCount > 0;
    const lastMessage = item.lastMessage;

    if (isGroupChat) {
      return (
        <div
          key={item._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={() => handleChatPress(item)}
          onMouseEnter={(e) => e.target.style.backgroundColor = FLAVORWORLD_COLORS.background}
          onMouseLeave={(e) => e.target.style.backgroundColor = FLAVORWORLD_COLORS.white}
        >
          <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden' }}>
            {item.image ? (
              <UserAvatar
                uri={item.image}
                name={item.name}
                size={50}
                showOnlineStatus={false}
              />
            ) : (
              <div style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: FLAVORWORLD_COLORS.secondary,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                👥
              </div>
            )}
          </div>

          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: hasUnread ? '600' : '500',
                  color: FLAVORWORLD_COLORS.text
                }}>
                  {item.name}
                </span>
                <span style={{
                  marginLeft: 6,
                  fontSize: 14,
                  color: FLAVORWORLD_COLORS.textLight
                }}>
                  👥
                </span>
              </div>
              <span style={{
                fontSize: 12,
                color: FLAVORWORLD_COLORS.textLight
              }}>
                {formatTime(item.updatedAt)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: hasUnread ? FLAVORWORLD_COLORS.text : FLAVORWORLD_COLORS.textLight,
                  fontWeight: hasUnread ? '500' : 'normal',
                  marginRight: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {lastMessage ? (
                  lastMessage.senderName ? 
                    `${lastMessage.senderName}: ${lastMessage.content}` : 
                    lastMessage.content
                ) : 'No messages yet...'}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontSize: 12,
                  color: FLAVORWORLD_COLORS.textLight,
                  marginRight: 8,
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  padding: '2px 6px',
                  borderRadius: 8
                }}>
                  {item.participantsCount}
                </span>
                
                {hasUnread && (
                  <div style={{
                    backgroundColor: FLAVORWORLD_COLORS.primary,
                    borderRadius: 12,
                    padding: '2px 8px',
                    minWidth: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: FLAVORWORLD_COLORS.white,
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const otherUser = getOtherUser(item);
      if (!otherUser) return null;

      return (
        <div
          key={item._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={() => handleChatPress(item)}
          onMouseEnter={(e) => e.target.style.backgroundColor = FLAVORWORLD_COLORS.background}
          onMouseLeave={(e) => e.target.style.backgroundColor = FLAVORWORLD_COLORS.white}
        >
          <UserAvatar
            uri={otherUser.userAvatar}
            name={otherUser.userName}
            size={50}
            showOnlineStatus={true}
            isOnline={otherUser.isOnline}
          />

          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{
                fontSize: 16,
                fontWeight: hasUnread ? '600' : '500',
                color: FLAVORWORLD_COLORS.text
              }}>
                {otherUser.userName}
              </span>
              <span style={{
                fontSize: 12,
                color: FLAVORWORLD_COLORS.textLight
              }}>
                {formatTime(item.updatedAt)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: hasUnread ? FLAVORWORLD_COLORS.text : FLAVORWORLD_COLORS.textLight,
                  fontWeight: hasUnread ? '500' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {lastMessage ? lastMessage.content : 'Start a conversation...'}
              </span>
              
              {hasUnread && (
                <div style={{
                  backgroundColor: FLAVORWORLD_COLORS.primary,
                  borderRadius: 12,
                  padding: '2px 8px',
                  minWidth: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{
                    color: FLAVORWORLD_COLORS.white,
                    fontSize: 12,
                    fontWeight: '600'
                  }}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderEmptyState = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 40px'
    }}>
      <div style={{ fontSize: 80, color: FLAVORWORLD_COLORS.textLight }}>💬</div>
      <h3 style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: FLAVORWORLD_COLORS.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center'
      }}>
        No Chats Yet
      </h3>
      <p style={{
        fontSize: 16,
        color: FLAVORWORLD_COLORS.textLight,
        textAlign: 'center',
        lineHeight: 1.4,
        marginBottom: 24
      }}>
        Start chatting with friends or create a group chat!
      </p>
      <button 
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: FLAVORWORLD_COLORS.primary,
          color: FLAVORWORLD_COLORS.white,
          border: 'none',
          padding: '12px 20px',
          borderRadius: 25,
          fontSize: 16,
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onClick={handleCreateChat}
        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        <span style={{ marginRight: 8 }}>+</span>
        Start Chat
      </button>
    </div>
  );

  const renderChatTypeModal = () => (
    showChatTypeModal && (
      <div style={{
        position: 'fixed',
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
          padding: 24,
          width: '85%',
          maxWidth: 350
        }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: FLAVORWORLD_COLORS.text,
            textAlign: 'center',
            marginBottom: 24
          }}>
            Create New Chat
          </h3>
          
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 12px',
              borderRadius: 12,
              backgroundColor: FLAVORWORLD_COLORS.background,
              marginBottom: 12,
              cursor: 'pointer'
            }}
            onClick={handleCreatePrivateChat}
          >
            <span style={{ fontSize: 24, color: FLAVORWORLD_COLORS.primary }}>👤</span>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{
                fontSize: 16,
                fontWeight: '600',
                color: FLAVORWORLD_COLORS.text,
                marginBottom: 2
              }}>
                Private Chat
              </div>
              <div style={{
                fontSize: 14,
                color: FLAVORWORLD_COLORS.textLight
              }}>
                Chat with one person
              </div>
            </div>
            <span style={{ fontSize: 20, color: FLAVORWORLD_COLORS.textLight }}>›</span>
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 12px',
              borderRadius: 12,
              backgroundColor: FLAVORWORLD_COLORS.background,
              marginBottom: 12,
              cursor: 'pointer'
            }}
            onClick={handleCreateGroupChat}
          >
            <span style={{ fontSize: 24, color: FLAVORWORLD_COLORS.secondary }}>👥</span>
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{
                fontSize: 16,
                fontWeight: '600',
                color: FLAVORWORLD_COLORS.text,
                marginBottom: 2
              }}>
                Group Chat
              </div>
              <div style={{
                fontSize: 14,
                color: FLAVORWORLD_COLORS.textLight
              }}>
                Chat with multiple people
              </div>
            </div>
            <span style={{ fontSize: 20, color: FLAVORWORLD_COLORS.textLight }}>›</span>
          </div>

          <button 
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '16px 0',
              marginTop: 8,
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: 16,
              color: FLAVORWORLD_COLORS.danger,
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onClick={() => setShowChatTypeModal(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  );

  if (loading && !refreshing) {
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
            margin: 0
          }}>
            Chats
          </h2>
          <div style={{ width: 36 }} />
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
            Loading chats...
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
          margin: 0
        }}>
          Chats
        </h2>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 60
        }}>
          <button 
            style={{
              padding: 8,
              backgroundColor: FLAVORWORLD_COLORS.background,
              border: 'none',
              borderRadius: 20,
              marginRight: 8,
              cursor: 'pointer'
            }}
            onClick={handleCreateChat}
          >
            +
          </button>
          <span style={{
            fontSize: 12,
            color: FLAVORWORLD_COLORS.textLight,
            fontWeight: '500'
          }}>
            {chats.length}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: FLAVORWORLD_COLORS.white,
        padding: '0 16px 16px',
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
            placeholder="Search Chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button 
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: FLAVORWORLD_COLORS.textLight
              }}
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {filteredChats.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredChats.map(renderChatItem)
        )}
      </div>

      {renderChatTypeModal()}
    </div>
  );
};

export default ChatListScreen;