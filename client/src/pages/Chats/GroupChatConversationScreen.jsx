import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  joinChat: () => {},
  leaveChat: () => {},
  onMessage: () => () => {},
  onTyping: () => () => {},
  getSocket: () => null,
  loadGroupChatInfo: () => {},
  getGroupChat: () => ({
    success: true,
    data: {
      _id: '1',
      name: 'Team Chat',
      participantsCount: 5,
      image: null
    }
  }),
  loadChatMessages: () => {},
  getGroupChatMessages: () => ({
    success: true,
    data: [
      {
        _id: '1',
        content: 'Hello everyone!',
        senderId: '456',
        senderName: 'John Doe',
        senderAvatar: null,
        messageType: 'text',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        readBy: ['123']
      },
      {
        _id: '2',
        content: 'Hi John! How are you?',
        senderId: '123',
        senderName: 'TestUser',
        senderAvatar: null,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        readBy: ['123', '456']
      }
    ]
  }),
  markAsRead: () => {},
  sendMessage: () => ({ success: true }),
  startTyping: () => {},
  stopTyping: () => {}
};

const GroupChatConversationScreen = ({ 
  route = { params: { chatId: '1', groupChat: { _id: '1', name: 'Team Chat' } } }, 
  navigation = { goBack: () => console.log('Go back'), navigate: (route, params) => console.log('Navigate to:', route, params) } 
}) => {
  const { currentUser } = useAuth();
  const { chatId, groupChat } = route.params;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInfo, setChatInfo] = useState(groupChat);
  const [typingUsers, setTypingUsers] = useState([]); 
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    chatService.joinChat(chatId, 'group');
    
    const unsubscribeMessage = chatService.onMessage((newMessage) => {
      if (newMessage.chatId === chatId) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });

    const unsubscribeTyping = chatService.onTyping((data) => {
      if (data.chatId === chatId && data.userId !== (currentUser?.id || currentUser?._id)) {
        if (data.type === 'start') {
          setTypingUsers(prev => {
            if (!prev.find(user => user.userId === data.userId)) {
              return [...prev, { userId: data.userId, userName: data.userName }];
            }
            return prev;
          });
        } else if (data.type === 'stop') {
          setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
        }
      }
    });

    loadMessages();
    loadChatInfo();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.leaveChat(chatId, 'group');
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [chatId, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatInfo = async () => {
    try {
      chatService.loadGroupChatInfo(chatId);
      
      const result = await chatService.getGroupChat(chatId);
      if (result.success) {
        setChatInfo(result.data);
      }
    } catch (error) {
      console.error('Load chat info error:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      chatService.loadChatMessages(chatId, 'group');
      
      const result = await chatService.getGroupChatMessages(chatId);
      if (result.success) {
        setMessages(result.data || []);
        await chatService.markAsRead(chatId, 'group');
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('Load messages error:', error);
      alert('Problem loading messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageType = 'text', content = null) => {
    const messageContent = content || inputText.trim();
    if (!messageContent || sending) return;

    setInputText('');
    setSending(true);
    setSelectedImage(null);
    setShowAttachments(false);

    try {
      const result = await chatService.sendMessage(chatId, messageContent, messageType, 'group');
      
      if (!result.success) {
        alert(result.message || 'Failed to send message');
        if (messageType === 'text') {
          setInputText(messageContent);
        }
      }

      stopTyping();
    } catch (error) {
      console.error('Send message error:', error);
      alert('Problem sending message');
      if (messageType === 'text') {
        setInputText(messageContent);
      }
    } finally {
      setSending(false);
    }
  };

  const startTyping = () => {
    chatService.startTyping(chatId, 'group');
  };

  const stopTyping = () => {
    chatService.stopTyping(chatId, 'group');
  };

  const handleImagePick = async (source) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (source === 'camera') {
        input.capture = 'environment';
      }
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageUri = event.target.result;
            setSelectedImage(imageUri);
            
            if (window.confirm('Send this image?')) {
              handleSendMessage('image', imageUri);
            } else {
              setSelectedImage(null);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Problem selecting image');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const document = {
            name: file.name,
            size: file.size,
            type: file.type
          };
          
          if (window.confirm(`Send ${document.name}?`)) {
            handleSendMessage('document', JSON.stringify(document));
          }
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Document picker error:', error);
      alert('Problem selecting file');
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
    
    if (!isTyping) {
      setIsTyping(true);
      startTyping();
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 3000);
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const isMyMessage = (message) => {
    return message.senderId === (currentUser?.id || currentUser?._id);
  };

  const openImageModal = (imageUri) => {
    setModalImage(imageUri);
    setShowImageModal(true);
  };

  const navigateToSettings = () => {
    navigation.navigate('GroupChatSettings', {
      chatId,
      groupChat: chatInfo,
    });
  };

  const renderSystemMessage = (item) => (
    <div key={item._id} style={{
      alignSelf: 'center',
      backgroundColor: FLAVORWORLD_COLORS.border,
      borderRadius: 12,
      padding: '6px 12px',
      margin: '8px 0'
    }}>
      <span style={{
        fontSize: 12,
        color: FLAVORWORLD_COLORS.textLight,
        textAlign: 'center'
      }}>
        {item.content}
      </span>
    </div>
  );

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0].userName} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
      : `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`;
    
    return (
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'flex-start'
      }}>
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderRadius: 20,
          padding: '8px 16px',
          border: `1px solid ${FLAVORWORLD_COLORS.border}`
        }}>
          <span style={{
            fontSize: 14,
            color: FLAVORWORLD_COLORS.textLight,
            fontStyle: 'italic'
          }}>
            {typingText}
          </span>
        </div>
      </div>
    );
  };

  const renderMessageContent = (item) => {
    const isMine = isMyMessage(item);
    
    if (item.isSystemMessage) {
      return renderSystemMessage(item);
    }
    
    switch (item.messageType) {
      case 'image':
        return (
          <div style={{
            ...messageBubbleStyle(isMine),
            padding: 4
          }}>
            <div 
              style={{ cursor: 'pointer' }}
              onClick={() => openImageModal(item.content)}
            >
              <img 
                src={item.content}
                alt="Message attachment"
                style={{
                  width: 200,
                  height: 150,
                  borderRadius: 16,
                  marginBottom: 4,
                  objectFit: 'cover'
                }}
              />
              <div style={{
                fontSize: 11,
                marginTop: 4,
                color: isMine ? 'rgba(255, 255, 255, 0.8)' : FLAVORWORLD_COLORS.textLight,
                textAlign: isMine ? 'right' : 'left'
              }}>
                {formatMessageTime(item.createdAt)}
              </div>
            </div>
          </div>
        );
      
      case 'document':
        try {
          const docData = JSON.parse(item.content);
          return (
            <div style={messageBubbleStyle(isMine)}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <span style={{
                  fontSize: 24,
                  marginRight: 12,
                  color: isMine ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.primary
                }}>
                  📄
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: isMine ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.text
                  }}>
                    {docData.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    marginTop: 2,
                    color: isMine ? 'rgba(255, 255, 255, 0.8)' : FLAVORWORLD_COLORS.textLight
                  }}>
                    {(docData.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 11,
                marginTop: 4,
                color: isMine ? 'rgba(255, 255, 255, 0.8)' : FLAVORWORLD_COLORS.textLight,
                textAlign: isMine ? 'right' : 'left'
              }}>
                {formatMessageTime(item.createdAt)}
              </div>
            </div>
          );
        } catch (e) {
          return (
            <div style={messageBubbleStyle(isMine)}>
              <span style={{
                fontSize: 16,
                lineHeight: 1.25,
                color: isMine ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.text
              }}>
                📎 File
              </span>
            </div>
          );
        }
      
      default:
        return (
          <div style={messageBubbleStyle(isMine)}>
            <div style={{
              fontSize: 16,
              lineHeight: 1.25,
              color: isMine ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.text
            }}>
              {item.content}
            </div>
            
            <div style={{
              fontSize: 11,
              marginTop: 4,
              color: isMine ? 'rgba(255, 255, 255, 0.8)' : FLAVORWORLD_COLORS.textLight,
              textAlign: isMine ? 'right' : 'left'
            }}>
              {formatMessageTime(item.createdAt)}
            </div>
          </div>
        );
    }
  };

  const messageBubbleStyle = (isMine) => ({
    padding: '10px 16px',
    borderRadius: 20,
    maxWidth: '100%',
    position: 'relative',
    backgroundColor: isMine ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.white,
    borderBottomRightRadius: isMine ? 4 : 20,
    borderBottomLeftRadius: isMine ? 20 : 4,
    ...(isMine ? {} : {
      border: `1px solid ${FLAVORWORLD_COLORS.border}`
    })
  });

  const renderMessage = (item, index) => {
    if (item.isSystemMessage) {
      return renderSystemMessage(item);
    }
    
    const isMine = isMyMessage(item);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    const showAvatar = !isMine && (!nextMessage || isMyMessage(nextMessage) || nextMessage.isSystemMessage);
    const showSenderName = !isMine && (!prevMessage || isMyMessage(prevMessage) || prevMessage.isSystemMessage || prevMessage.senderId !== item.senderId);
    const isConsecutive = prevMessage && 
      isMyMessage(prevMessage) === isMine && 
      prevMessage.senderId === item.senderId &&
      !prevMessage.isSystemMessage &&
      new Date(item.createdAt) - new Date(prevMessage.createdAt) < 2 * 60 * 1000;

    return (
      <div 
        key={item._id}
        style={{
          margin: isConsecutive ? '1px 0' : '2px 0',
          maxWidth: '85%',
          display: 'flex',
          alignItems: 'flex-end',
          alignSelf: isMine ? 'flex-end' : 'flex-start',
          flexDirection: isMine ? 'row-reverse' : 'row'
        }}
      >
        {!isMine && showAvatar && (
          <UserAvatar
            uri={item.senderAvatar}
            name={item.senderName}
            size={28}
            style={{ marginRight: 8, marginBottom: 2 }}
          />
        )}
        
        <div style={{ position: 'relative' }}>
          {!isMine && showSenderName && (
            <div style={{
              fontSize: 12,
              color: FLAVORWORLD_COLORS.primary,
              fontWeight: '500',
              marginBottom: 2,
              marginLeft: 4
            }}>
              {item.senderName}
            </div>
          )}
          
          {renderMessageContent(item)}
          
          {isMine && (
            <div style={{
              position: 'absolute',
              bottom: 4,
              right: 8
            }}>
              <span style={{
                fontSize: 12,
                color: item.readBy?.length > 1 ? FLAVORWORLD_COLORS.secondary : 'rgba(255,255,255,0.6)'
              }}>
                ✓✓
              </span>
            </div>
          )}
        </div>
        
        {!isMine && !showAvatar && <div style={{ width: 36 }} />}
      </div>
    );
  };

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
          borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
          
          <div style={{ flex: 1, marginLeft: 12 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              margin: 0
            }}>
              {chatInfo?.name || 'Group Chat'}
            </h3>
          </div>
          
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
            Loading messages...
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
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
        
        <div 
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            marginLeft: 12,
            cursor: 'pointer'
          }}
          onClick={navigateToSettings}
        >
          <div style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden' }}>
            {chatInfo?.image ? (
              <UserAvatar
                uri={chatInfo.image}
                name={chatInfo.name}
                size={32}
                showOnlineStatus={false}
              />
            ) : (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: FLAVORWORLD_COLORS.secondary,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                👥
              </div>
            )}
          </div>
          <div style={{ marginLeft: 12 }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              margin: 0
            }}>
              {chatInfo?.name || 'Group Chat'}
            </h3>
            <p style={{
              fontSize: 12,
              color: FLAVORWORLD_COLORS.textLight,
              margin: '2px 0 0 0'
            }}>
              {typingUsers.length > 0 
                ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
                : `${chatInfo?.participantsCount || chatInfo?.participants?.length || 0} members`
              }
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            style={{
              padding: 8,
              backgroundColor: FLAVORWORLD_COLORS.background,
              border: 'none',
              borderRadius: 20,
              marginLeft: 8,
              cursor: 'pointer'
            }}
            onClick={navigateToSettings}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: FLAVORWORLD_COLORS.background,
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 0'
              }}>
                <div style={{ fontSize: 60, color: FLAVORWORLD_COLORS.textLight }}>👥</div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: FLAVORWORLD_COLORS.text,
                  marginTop: 16,
                  marginBottom: 8
                }}>
                  Welcome to the group!
                </h3>
                <p style={{
                  fontSize: 14,
                  color: FLAVORWORLD_COLORS.textLight,
                  textAlign: 'center'
                }}>
                  Say hello to start the conversation
                </p>
              </div>
            ) : (
              messages.map((message, index) => renderMessage(message, index))
            )}
            
            {renderTypingIndicator()}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Attachment Options */}
        {showAttachments && (
          <div style={{
            display: 'flex',
            backgroundColor: FLAVORWORLD_COLORS.white,
            padding: '12px 16px',
            borderTop: `1px solid ${FLAVORWORLD_COLORS.border}`,
            justifyContent: 'space-around',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <button 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 12,
                minWidth: 70,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              onClick={() => handleImagePick('camera')}
            >
              📷
              <span style={{
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4
              }}>
                Camera
              </span>
            </button>
            
            <button 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 12,
                minWidth: 70,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              onClick={() => handleImagePick('gallery')}
            >
              🖼️
              <span style={{
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4
              }}>
                Gallery
              </span>
            </button>
            
            <button 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 12,
                minWidth: 70,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              onClick={handleDocumentPick}
            >
              📄
              <span style={{
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4
              }}>
                File
              </span>
            </button>
            
            <button 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 12,
                minWidth: 70,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
              onClick={() => {
                setShowAttachments(false);
                alert('Coming Soon: Location sharing will be added soon');
              }}
            >
              📍
              <span style={{
                fontSize: 12,
                fontWeight: '500',
                marginTop: 4
              }}>
                Location
              </span>
            </button>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div style={{
            position: 'relative',
            backgroundColor: FLAVORWORLD_COLORS.white,
            padding: '8px 16px',
            borderTop: `1px solid ${FLAVORWORLD_COLORS.border}`
          }}>
            <img 
              src={selectedImage} 
              alt="Selected"
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                objectFit: 'cover'
              }}
            />
            <button 
              style={{
                position: 'absolute',
                top: 4,
                right: 12,
                backgroundColor: FLAVORWORLD_COLORS.danger,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                borderRadius: 12,
                width: 24,
                height: 24,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Input Container */}
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderTop: `1px solid ${FLAVORWORLD_COLORS.border}`,
          padding: '12px 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8
          }}>
            <button
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: showAttachments ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.background,
                color: showAttachments ? FLAVORWORLD_COLORS.white : FLAVORWORLD_COLORS.primary,
                border: 'none',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: 24
              }}
              onClick={() => setShowAttachments(!showAttachments)}
            >
              {showAttachments ? "×" : "+"}
            </button>
            
            <textarea
              style={{
                flex: 1,
                border: `1px solid ${FLAVORWORLD_COLORS.border}`,
                borderRadius: 20,
                padding: '12px 16px',
                fontSize: 16,
                color: FLAVORWORLD_COLORS.text,
                backgroundColor: FLAVORWORLD_COLORS.background,
                maxHeight: 100,
                minHeight: 40,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            <button
              style={{
                backgroundColor: (!inputText.trim() && !selectedImage || sending) 
                  ? FLAVORWORLD_COLORS.textLight 
                  : FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                borderRadius: 20,
                width: 40,
                height: 40,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: (!inputText.trim() && !selectedImage || sending) ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                fontSize: 20
              }}
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !selectedImage || sending}
            >
              {sending ? (
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                "➤"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              cursor: 'pointer'
            }}
            onClick={() => setShowImageModal(false)}
          />
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <button 
              style={{
                position: 'absolute',
                top: 50,
                right: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: FLAVORWORLD_COLORS.white,
                border: 'none',
                borderRadius: 20,
                padding: 8,
                zIndex: 1,
                cursor: 'pointer',
                fontSize: 24
              }}
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
            
            {modalImage && (
              <img 
                src={modalImage}
                alt="Full screen view"
                style={{
                  maxWidth: '90%',
                  maxHeight: '80%',
                  objectFit: 'contain'
                }}
              />
            )}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideUp {
            0% { transform: translateY(100px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default GroupChatConversationScreen;