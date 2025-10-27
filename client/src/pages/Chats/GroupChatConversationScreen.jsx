import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Plus,
  X,
  Camera,
  Image as ImageIcon,
  FileText,
  MapPin,
  Loader2,
  Settings,
  Users
} from 'lucide-react';
import './GroupChatConversationScreen.css';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { chatService } from '../../services/chatServices';

const GroupChatConversationScreen = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { groupChat } = location.state || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [chatInfo, setChatInfo] = useState(groupChat);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    chatService.joinChat(chatId, 'group');
    
    const unsubscribeMessage = chatService.onMessage((newMessage) => {
      if (newMessage.chatId === chatId || newMessage.groupChatId === chatId) {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
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

    const socket = chatService.getSocket();
    if (socket) {
      socket.on('group_messages_loaded', (messagesData) => {
        if (messagesData.chatId === chatId) {
          setMessages(messagesData.messages || []);
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      });

      socket.on('group_chat_info_loaded', (chatInfo) => {
        if (chatInfo._id === chatId) {
          setChatInfo(chatInfo);
        }
      });

      socket.on('group_message_received', (newMessage) => {
        if (newMessage.groupChatId === chatId) {
          setMessages(prev => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        }
      });
    }

    loadMessages();
    loadChatInfo();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.leaveChat(chatId, 'group');
      unsubscribeMessage();
      unsubscribeTyping();
      
      if (socket) {
        socket.off('group_messages_loaded');
        socket.off('group_chat_info_loaded');
        socket.off('group_message_received');
      }
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
        setTimeout(scrollToBottom, 100);
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (window.confirm('Send this image?')) {
          handleSendMessage('image', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startTyping = () => {
    chatService.startTyping(chatId, 'group');
  };

  const stopTyping = () => {
    chatService.stopTyping(chatId, 'group');
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      startTyping();
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
      typingTimeoutRef.current = null;
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

  const isRecipeShare = (content) => {
    return content && content.startsWith('[RECIPE_SHARE]');
  };

  const parseRecipeShare = (content) => {
    if (!content || !content.startsWith('[RECIPE_SHARE]')) {
      return null;
    }

    const lines = content.split('\n');
    if (lines.length < 5) return null;

    const url = lines[1]?.trim() || '';
    const mediaUrl = lines[2]?.trim() === 'NO_MEDIA' ? null : lines[2]?.trim();
    const mediaType = lines[3]?.trim() === 'NO_MEDIA' ? null : lines[3]?.trim();
    const title = lines[4]?.trim() || '';
    const description = lines[5]?.trim() || '';
    const prepTime = lines[6]?.trim() || '';
    const servings = lines[7]?.trim() || '';
    const category = lines[8]?.trim() || '';

    return {
      url,
      mediaUrl,
      mediaType,
      title,
      description,
      prepTime,
      servings,
      category
    };
  };

  const handleRecipeClick = (url) => {
    if (url) {
      // Extract post ID from URL
      const postIdMatch = url.match(/\/post\/([^/?]+)/);
      if (postIdMatch) {
        const postId = postIdMatch[1];
        navigate(`/post/${postId}`);
      }
    }
  };

  const isMyMessage = (message) => {
    return message.senderId === (currentUser?.id || currentUser?._id);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const navigateToSettings = () => {
    navigate(`/group-chat/${chatId}/settings`, {
      state: { groupChat: chatInfo }
    });
  };

  if (loading) {
    return (
      <div className="group-chat-screen">
        <header className="chat-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          
          <div className="group-info">
            <h3>{chatInfo?.name || 'Group Chat'}</h3>
          </div>
          
          <div className="header-actions" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  const typingText = typingUsers.length === 1 
    ? `${typingUsers[0].userName} is typing...`
    : typingUsers.length === 2
    ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
    : typingUsers.length > 2
    ? `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`
    : null;

  return (
    <div className="group-chat-screen">
      {/* Header */}
      <header className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="group-info" onClick={navigateToSettings}>
          <div className="group-avatar">
            {chatInfo?.image ? (
              <img src={chatInfo.image} alt={chatInfo.name} />
            ) : (
              <div className="default-group-avatar">
                <Users size={18} />
              </div>
            )}
          </div>
          <div className="group-details">
            <h3>{chatInfo?.name || 'Group Chat'}</h3>
            <span className="group-members">
              {typingText || `${chatInfo?.participantsCount || 0} members`}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="header-action-btn" onClick={navigateToSettings}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-messages">
            <Users size={60} />
            <h2>Welcome to the group!</h2>
            <p>Say hello to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              if (message.isSystemMessage) {
                return (
                  <div key={message._id} className="system-message">
                    <span>{message.content}</span>
                  </div>
                );
              }

              const isMine = isMyMessage(message);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showSenderName = !isMine && 
                (!prevMessage || prevMessage.senderId !== message.senderId || prevMessage.isSystemMessage);

              return (
                <div
                  key={message._id}
                  className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}
                >
                  <div className={`message-bubble ${isMine ? 'my-message' : 'other-message'}`}>
                    {!isMine && showSenderName && (
                      <span className="sender-name">{message.senderName}</span>
                    )}
                    {message.messageType === 'image' ? (
                      <img src={message.content} alt="Shared" className="message-image" />
                    ) : isRecipeShare(message.content) ? (
                      (() => {
                        const recipeData = parseRecipeShare(message.content);
                        if (!recipeData) {
                          return <p className="message-text">{message.content}</p>;
                        }

                        return (
                          <div 
                            className="recipe-share-card"
                            onClick={() => handleRecipeClick(recipeData.url)}
                            style={{ cursor: 'pointer' }}
                          >
                            {recipeData.mediaUrl && (
                              <div className="recipe-media">
                                {recipeData.mediaType === 'video' ? (
                                  <video 
                                    src={recipeData.mediaUrl} 
                                    className="recipe-image"
                                    controls={false}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    style={{ pointerEvents: 'none' }}
                                  />
                                ) : (
                                  <img 
                                    src={recipeData.mediaUrl} 
                                    alt={recipeData.title}
                                    className="recipe-image"
                                  />
                                )}
                              </div>
                            )}
                            <div className="recipe-share-content">
                              <h4 className="recipe-title">{recipeData.title}</h4>
                              <p className="recipe-description">{recipeData.description}</p>
                              <div className="recipe-meta">
                                {recipeData.prepTime && (
                                  <span>⏱️ {recipeData.prepTime}</span>
                                )}
                                {recipeData.servings && (
                                  <span>👥 {recipeData.servings}</span>
                                )}
                                {recipeData.category && (
                                  <span>📂 {recipeData.category}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="message-text">{message.content}</p>
                    )}
                    <span className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <div className="typing-bubble">
                  <span>{typingText}</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Attachments Menu */}
      {showAttachments && (
        <div className="attachments-menu">
          <label className="attachment-option">
            <Camera size={24} />
            <span>Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>
          
          <label className="attachment-option">
            <ImageIcon size={24} />
            <span>Gallery</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>
          
          <button className="attachment-option" onClick={() => alert('Coming soon')}>
            <FileText size={24} />
            <span>File</span>
          </button>
          
          <button className="attachment-option" onClick={() => alert('Coming soon')}>
            <MapPin size={24} />
            <span>Location</span>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="input-container">
        <button
          className={`attach-btn ${showAttachments ? 'active' : ''}`}
          onClick={() => setShowAttachments(!showAttachments)}
        >
          {showAttachments ? <X size={24} /> : <Plus size={24} />}
        </button>
        
        <textarea
          className="message-input"
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          disabled={sending}
        />
        
        <button
          className="send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || sending}
        >
          {sending ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default GroupChatConversationScreen;