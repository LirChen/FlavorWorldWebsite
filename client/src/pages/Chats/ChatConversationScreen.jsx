import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  Plus,
  X,
  Camera,
  Image as ImageIcon,
  FileText,
  MapPin,
  Phone,
  Video,
  Play,
  CheckCheck,
  Clock,
  Users,
  ChefHat,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { chatService } from '../../services/chatServices';

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

const ChatConversationScreen = ({ route, navigation }) => {
  const { currentUser } = useAuth();
  const { chatId, otherUser } = route?.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Chat service effects
  useEffect(() => {
    if (!chatId) return;

    chatService.joinChat(chatId, 'private');
    
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
          setOtherUserTyping(true);
        } else if (data.type === 'stop') {
          setOtherUserTyping(false);
        }
      }
    });

    const socket = chatService.getSocket();
    if (socket) {
      socket.on('messages_loaded', (messagesData) => {
        if (messagesData.chatId === chatId) {
          setMessages(messagesData.messages || []);
          setLoading(false);
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      });

      socket.on('messages_marked_read', (data) => {
        if (data.chatId === chatId) {
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id === data.messageId 
                ? { ...msg, readBy: data.readBy }
                : msg
            )
          );
        }
      });
     
      socket.on('message_received', (newMessage) => {
        if (newMessage.chatId === chatId) {
          setMessages(prevMessages => [...prevMessages, newMessage]);
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      });
    }

    loadMessages();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.leaveChat(chatId, 'private');
      unsubscribeMessage();
      unsubscribeTyping();
      
      if (socket) {
        socket.off('messages_loaded');
        socket.off('messages_marked_read');
        socket.off('message_received');
      }
    };
  }, [chatId, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      chatService.loadChatMessages(chatId, 'private');
      
      const result = await chatService.getChatMessages(chatId);
      if (result.success) {
        setMessages(result.data || []);
        await chatService.markAsRead(chatId, 'private');
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
    if (!messageContent || sending || !chatId) return;

    setInputText('');
    setSending(true);
    setSelectedImage(null);
    setShowAttachments(false);

    try {
      const result = await chatService.sendMessage(chatId, messageContent, messageType, 'private');
      
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
    if (chatId) chatService.startTyping(chatId, 'private');
  };

  const stopTyping = () => {
    if (chatId) chatService.stopTyping(chatId, 'private');
  };

  const handleFileSelect = async (type = 'image') => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      
      if (type === 'image') {
        input.accept = 'image/*';
      } else if (type === 'document') {
        input.accept = '*/*';
      }
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          
          if (type === 'image') {
            setSelectedImage(url);
            if (window.confirm('Send this image?')) {
              handleSendMessage('image', url);
            } else {
              setSelectedImage(null);
            }
          } else if (type === 'document') {
            const documentData = {
              name: file.name,
              size: file.size,
              type: file.type,
              uri: url
            };
            
            if (window.confirm(`Send ${file.name}?`)) {
              handleSendMessage('document', JSON.stringify(documentData));
            }
          }
        }
      };
      
      input.click();
    } catch (error) {
      console.error('File picker error:', error);
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

  const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0m';
    const numMinutes = parseInt(minutes);
    if (numMinutes < 60) {
      return `${numMinutes}m`;
    } else {
      const hours = Math.floor(numMinutes / 60);
      const remainingMinutes = numMinutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  const isMyMessage = (message) => {
    return message.senderId === (currentUser?.id || currentUser?._id);
  };

  const openImageModal = (imageUri) => {
    if (!imageUri || imageUri.trim() === '') return;
    setModalImage(imageUri);
    setShowImageModal(true);
  };

  const openRecipeModal = (recipeData) => {
    setSelectedRecipe(recipeData);
    setShowRecipeModal(true);
  };

  const renderMessageContent = (item) => {
    const isMine = isMyMessage(item);
    
    switch (item.messageType) {
      case 'image':
        if (!item.content || item.content.trim() === '') {
          return (
            <span className={`${isMine ? 'text-white' : 'text-gray-800'}`}>
              📷 Image
            </span>
          );
        }
        
        return (
          <div className="relative">
            <img 
              src={item.content} 
              alt="Shared image"
              className="w-48 h-36 object-cover rounded-lg cursor-pointer"
              onClick={() => openImageModal(item.content)}
            />
            <div className={`text-xs mt-1 ${isMine ? 'text-white/80 text-right' : 'text-gray-500'}`}>
              {formatMessageTime(item.createdAt)}
            </div>
          </div>
        );
      
      case 'document':
        try {
          const docData = JSON.parse(item.content);
          return (
            <div className="flex items-center space-x-3">
              <FileText className={`w-6 h-6 ${isMine ? 'text-white' : 'text-orange-500'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isMine ? 'text-white' : 'text-gray-800'}`}>
                  {docData.name}
                </div>
                <div className={`text-xs ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                  {(docData.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className={`text-xs ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                {formatMessageTime(item.createdAt)}
              </div>
            </div>
          );
        } catch (e) {
          return (
            <span className={`${isMine ? 'text-white' : 'text-gray-800'}`}>
              📎 File
            </span>
          );
        }
      
      case 'shared_recipe':
        try {
          const messageData = JSON.parse(item.content);
          const recipeData = messageData.recipeData;
          
          if (!recipeData) {
            return (
              <span className={`${isMine ? 'text-white' : 'text-gray-800'}`}>
                🍳 Recipe shared
              </span>
            );
          }

          const hasRecipeImage = recipeData.image && recipeData.image.trim() !== '';
          const hasRecipeVideo = recipeData.video && recipeData.video.trim() !== '';

          return (
            <div 
              className="min-w-64 max-w-80 cursor-pointer"
              onClick={() => openRecipeModal(recipeData)}
            >
              {/* Recipe Media */}
              {hasRecipeImage && (
                <img 
                  src={recipeData.image} 
                  alt="Recipe"
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              
              {hasRecipeVideo && !hasRecipeImage && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2 bg-gray-900">
                  <video
                    src={recipeData.video}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              
              {!hasRecipeImage && !hasRecipeVideo && (
                <div 
                  className="w-full h-32 rounded-lg mb-2 flex items-center justify-center border"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background, borderColor: FLAVORWORLD_COLORS.border }}
                >
                  <ChefHat className="w-10 h-10" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                </div>
              )}
              
              {/* Recipe Content */}
              <div>
                <div className="flex items-center mb-1">
                  <ChefHat className="w-4 h-4 mr-2" style={{ color: FLAVORWORLD_COLORS.primary }} />
                  <h4 className={`font-semibold ${isMine ? 'text-white' : 'text-gray-800'}`}>
                    {recipeData.title || 'Untitled Recipe'}
                  </h4>
                </div>
                
                <p className={`text-sm mb-2 line-clamp-2 ${isMine ? 'text-white/90' : 'text-gray-700'}`}>
                  {recipeData.description || 'No description available'}
                </p>
                
                {/* Meta data */}
                <div className="flex items-center flex-wrap gap-3 mb-2">
                  <div className="flex items-center">
                    <Clock className={`w-3 h-3 mr-1 ${isMine ? 'text-white/80' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                      {formatTime(recipeData.prepTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className={`w-3 h-3 mr-1 ${isMine ? 'text-white/80' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                      {recipeData.servings || 0} servings
                    </span>
                  </div>
                  
                  <span 
                    className={`text-xs px-2 py-1 rounded-lg font-semibold ${
                      isMine 
                        ? 'bg-white/20 text-white' 
                        : 'text-gray-700'
                    }`}
                    style={{ backgroundColor: !isMine ? FLAVORWORLD_COLORS.background : undefined }}
                  >
                    {recipeData.category || 'General'}
                  </span>
                </div>
                
                {/* Personal message */}
                {recipeData.personalMessage && (
                  <p className={`text-xs italic mb-2 ${isMine ? 'text-white/90' : 'text-gray-700'}`}>
                    💬 "{recipeData.personalMessage}"
                  </p>
                )}
                
                {/* Tap to view */}
                <p className={`text-xs italic text-center ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                  👆 Tap to view full recipe
                </p>
              </div>
              
              <div className={`text-xs mt-2 ${isMine ? 'text-white/80 text-right' : 'text-gray-500'}`}>
                {formatMessageTime(item.createdAt)}
              </div>
            </div>
          );
        } catch (e) {
          console.error('Error parsing shared recipe:', e);
          return (
            <span className={`${isMine ? 'text-white' : 'text-gray-800'}`}>
              🍳 Recipe shared
            </span>
          );
        }
      
      default:
        return (
          <div>
            <div className={`text-base ${isMine ? 'text-white' : 'text-gray-800'}`}>
              {item.content}
            </div>
            <div className={`text-xs mt-1 ${isMine ? 'text-white/80 text-right' : 'text-gray-500'}`}>
              {formatMessageTime(item.createdAt)}
            </div>
          </div>
        );
    }
  };

  const renderMessage = (message, index) => {
    const isMine = isMyMessage(message);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    const showAvatar = !isMine && (!nextMessage || isMyMessage(nextMessage));
    const isConsecutive = prevMessage && 
      isMyMessage(prevMessage) === isMine && 
      new Date(message.createdAt) - new Date(prevMessage.createdAt) < 2 * 60 * 1000;

    return (
      <div
        key={message._id}
        className={`flex items-end mb-1 max-w-4/5 ${
          isMine ? 'justify-end ml-auto' : 'justify-start'
        } ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}
      >
        {!isMine && showAvatar && (
          <UserAvatar
            uri={otherUser?.userAvatar}
            name={otherUser?.userName}
            size={28}
            className="mr-2 mb-0.5"
          />
        )}
        
        <div
          className={`relative px-4 py-2 rounded-2xl max-w-lg ${
            isMine
              ? 'rounded-br-sm'
              : 'rounded-bl-sm'
          } ${
            isConsecutive && isMine
              ? 'rounded-br-2xl'
              : isConsecutive && !isMine
              ? 'rounded-bl-2xl'
              : ''
          } ${
            message.messageType === 'image' || message.messageType === 'shared_recipe'
              ? 'p-1'
              : ''
          }`}
          style={{
            backgroundColor: isMine 
              ? FLAVORWORLD_COLORS.primary 
              : FLAVORWORLD_COLORS.white,
            border: !isMine ? `1px solid ${FLAVORWORLD_COLORS.border}` : 'none'
          }}
        >
          {renderMessageContent(message)}
          
          {isMine && (
            <div className="absolute bottom-1 right-2">
              <CheckCheck 
                className={`w-3 h-3 ${
                  message.readBy?.length > 1 
                    ? 'text-teal-400' 
                    : 'text-white/60'
                }`}
              />
            </div>
          )}
        </div>
        
        {!isMine && !showAvatar && <div className="w-9" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col" style={{ backgroundColor: FLAVORWORLD_COLORS.background }}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b shadow-sm"
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderColor: FLAVORWORLD_COLORS.border 
          }}
        >
          <button 
            onClick={() => navigation?.goBack()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
          >
            <ArrowLeft className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
          </button>
          
          <div className="flex items-center flex-1 ml-3">
            <UserAvatar
              uri={otherUser?.userAvatar}
              name={otherUser?.userName}
              size={32}
            />
            <div className="ml-3">
              <h2 className="font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
                {otherUser?.userName}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: FLAVORWORLD_COLORS.primary }} />
            <p className="text-lg" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              Loading messages...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: FLAVORWORLD_COLORS.background }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b shadow-sm"
        style={{ 
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderColor: FLAVORWORLD_COLORS.border 
        }}
      >
        <button 
          onClick={() => navigation?.goBack()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
        >
          <ArrowLeft className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
        </button>
        
        <button 
          className="flex items-center flex-1 ml-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          onClick={() => navigation?.navigate('Profile', { userId: otherUser?.userId })}
        >
          <UserAvatar
            uri={otherUser?.userAvatar}
            name={otherUser?.userName}
            size={32}
            showOnlineStatus={true}
            isOnline={true}
          />
          <div className="ml-3 text-left">
            <h2 className="font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
              {otherUser?.userName}
            </h2>
            <p className="text-sm" style={{ color: otherUserTyping ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.success }}>
              {otherUserTyping ? 'typing...' : 'Active now'}
            </p>
          </div>
        </button>
        
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
          >
            <Video className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.accent }} />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
          >
            <Phone className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.accent }} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 flex flex-col">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4 opacity-50">💬</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                Start a conversation!
              </h3>
              <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                This is your private chat with {otherUser?.userName}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => renderMessage(message, index))}
              
              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex items-end justify-start">
                  <div 
                    className="px-4 py-2 rounded-2xl rounded-bl-sm border"
                    style={{ 
                      backgroundColor: FLAVORWORLD_COLORS.white,
                      borderColor: FLAVORWORLD_COLORS.border
                    }}
                  >
                    <p className="text-sm italic" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                      {otherUser?.userName} is typing...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Options */}
        {showAttachments && (
          <div 
            className="flex justify-around p-3 border-t animate-slide-up"
            style={{ 
              backgroundColor: FLAVORWORLD_COLORS.white,
              borderColor: FLAVORWORLD_COLORS.border
            }}
          >
            <button
              onClick={() => handleFileSelect('image')}
              className="flex flex-col items-center p-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Camera</span>
            </button>
            
            <button
              onClick={() => handleFileSelect('image')}
              className="flex flex-col items-center p-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
            >
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Gallery</span>
            </button>
            
            <button
              onClick={() => handleFileSelect('document')}
              className="flex flex-col items-center p-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
            >
              <FileText className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">File</span>
            </button>
            
            <button
              onClick={() => {
                setShowAttachments(false);
                alert('Location sharing will be added soon');
              }}
              className="flex flex-col items-center p-3 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
            >
              <MapPin className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Location</span>
            </button>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedImage && (
          <div 
            className="relative p-2 border-t"
            style={{ 
              backgroundColor: FLAVORWORLD_COLORS.white,
              borderColor: FLAVORWORLD_COLORS.border
            }}
          >
            <img src={selectedImage} alt="Selected" className="w-20 h-20 rounded-lg object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Container */}
        <div 
          className="p-4 border-t"
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderColor: FLAVORWORLD_COLORS.border
          }}
        >
          <div className="flex items-end space-x-3">
            <button
              onClick={() => setShowAttachments(!showAttachments)}
              className={`p-2 rounded-full transition-colors ${
                showAttachments ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: showAttachments 
                  ? FLAVORWORLD_COLORS.primary 
                  : FLAVORWORLD_COLORS.background 
              }}
            >
              {showAttachments ? (
                <X className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.primary }} />
              )}
            </button>
            
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
                maxLength={1000}
                className="w-full px-4 py-3 border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                style={{ 
                  borderColor: FLAVORWORLD_COLORS.border,
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  color: FLAVORWORLD_COLORS.text,
                  maxHeight: '100px'
                }}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !selectedImage || sending}
              className={`p-3 rounded-full text-white transition-all ${
                (!inputText.trim() && !selectedImage || sending)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 hover:scale-105'
              }`}
              style={{ 
                backgroundColor: (!inputText.trim() && !selectedImage || sending) 
                  ? FLAVORWORLD_COLORS.textLight 
                  : FLAVORWORLD_COLORS.primary 
              }}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {modalImage && (
              <img 
                src={modalImage} 
                alt="Full screen view"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: FLAVORWORLD_COLORS.text }}>
                {selectedRecipe.title || 'Recipe Details'}
              </h2>
              <button 
                onClick={() => setShowRecipeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Recipe Media */}
              {selectedRecipe.image && (
                <img 
                  src={selectedRecipe.image} 
                  alt="Recipe"
                  className="w-full h-64 object-cover"
                />
              )}
              
              {selectedRecipe.video && !selectedRecipe.image && (
                <video 
                  src={selectedRecipe.video} 
                  controls 
                  className="w-full h-64 object-cover bg-gray-900"
                />
              )}

              {!selectedRecipe.image && !selectedRecipe.video && (
                <div 
                  className="w-full h-64 flex items-center justify-center"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <ChefHat className="w-20 h-20" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                </div>
              )}

              <div className="p-6">
                {/* Recipe Meta */}
                <div className="flex items-center space-x-6 mb-6 flex-wrap">
                  <div 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Clock className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.primary }} />
                    <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                      {formatTime(selectedRecipe.prepTime)}
                    </span>
                  </div>
                  <div 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Users className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.secondary }} />
                    <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                      {selectedRecipe.servings || 0} servings
                    </span>
                  </div>
                  <span 
                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ 
                      backgroundColor: FLAVORWORLD_COLORS.background,
                      color: FLAVORWORLD_COLORS.secondary 
                    }}
                  >
                    {selectedRecipe.category || 'General'}
                  </span>
                </div>

                <p className="text-lg mb-6" style={{ color: FLAVORWORLD_COLORS.text }}>
                  {selectedRecipe.description || 'No description available'}
                </p>

                {/* Ingredients */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
                    🥘 Ingredients
                  </h3>
                  <p className="whitespace-pre-wrap" style={{ color: FLAVORWORLD_COLORS.text }}>
                    {selectedRecipe.ingredients || 'No ingredients listed'}
                  </p>
                </div>

                {/* Instructions */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
                    👨‍🍳 Instructions
                  </h3>
                  <p className="whitespace-pre-wrap" style={{ color: FLAVORWORLD_COLORS.text }}>
                    {selectedRecipe.instructions || 'No instructions provided'}
                  </p>
                </div>
                
                {/* Recipe Author */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <h4 className="text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
                    👨‍🍳 Recipe by:
                  </h4>
                  <div className="flex items-center">
                    <UserAvatar
                      uri={selectedRecipe.authorAvatar}
                      name={selectedRecipe.authorName || 'Unknown Chef'}
                      size={32}
                    />
                    <span className="ml-3 font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                      {selectedRecipe.authorName || 'Unknown Chef'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ChatConversationScreen;