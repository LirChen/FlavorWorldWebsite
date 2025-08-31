import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Circle,
  Users,
  Clock,
  ChefHat,
  Play,
  Loader2,
  Send
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { chatService } from '../../services/chatServices';
import { userService } from '../../services/UserService';

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

const SharePostComponent = ({ 
  visible, 
  onClose, 
  post, 
  onShare, 
  currentUserId,
  navigation
}) => {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!visible) return;
      
      setLoading(true);
      try {
        console.log('Loading contacts for sharing...');
        
        const currentUserId = currentUser?.id || currentUser?._id;
        if (currentUserId) {
          try {
            await chatService.initializeSocket(currentUserId);
            console.log('Socket initialized successfully');
          } catch (socketError) {
            console.warn('Socket initialization failed, continuing without real-time features:', socketError);
          }
        }

        const chatsResult = await chatService.getAllChats();
        let chatContacts = [];
        
        if (chatsResult.success && chatsResult.data) {
          chatContacts = chatsResult.data
            .filter(chat => chat.chatType === 'private' && chat.participants?.length >= 2)
            .map(chat => {
              const otherUser = chat.participants.find(p => 
                p.userId !== currentUserId
              );
              
              if (otherUser) {
                return {
                  id: otherUser.userId,
                  name: otherUser.userName || 'Unknown',
                  avatar: otherUser.userAvatar || '',
                  source: 'chat',
                  isOnline: true,
                  chatId: chat._id,
                  lastActive: chat.updatedAt
                };
              }
              return null;
            })
            .filter(contact => contact !== null);
        }

        let followingContacts = [];
        try {
          const followingResult = await userService.getFollowingList(currentUserId);
          
          if (followingResult.success && followingResult.data) {
            followingContacts = followingResult.data.map(user => ({
              id: user.id || user._id,
              name: user.fullName || user.name || 'Unknown',
              avatar: user.avatar || user.userAvatar || '',
              source: 'following',
              isOnline: true,
              chatId: null,
              lastActive: user.lastActive
            }));
          }
        } catch (followingError) {
          console.log('Could not load following list:', followingError);
        }

        const allContacts = [...chatContacts];
        
        followingContacts.forEach(followingContact => {
          const existsInChats = chatContacts.some(chatContact => 
            chatContact.id === followingContact.id
          );
          
          if (!existsInChats) {
            allContacts.push(followingContact);
          } else {
            const existingIndex = allContacts.findIndex(contact => contact.id === followingContact.id);
            if (existingIndex !== -1) {
              allContacts[existingIndex] = {
                ...allContacts[existingIndex],
                source: 'both'
              };
            }
          }
        });

        const sortedContacts = allContacts.sort((a, b) => {
          const aTime = new Date(a.lastActive || '2000-01-01');
          const bTime = new Date(b.lastActive || '2000-01-01');
          return bTime - aTime;
        });

        console.log(`Loaded ${sortedContacts.length} contacts for sharing`);
        
        setContacts(sortedContacts);
        setFilteredContacts(sortedContacts);
        
      } catch (error) {
        console.error('Error loading contacts:', error);
        alert('Failed to load contacts for sharing');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [visible, currentUser]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const toggleContactSelection = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleShare = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one person to share this delicious recipe with!');
      return;
    }

    if (post?.privacy === 'private' && post?.userId !== currentUserId) {
      alert('This recipe is private and cannot be shared.');
      return;
    }

    console.log('Starting share process...');
    setIsSharing(true);
    
    try {
      const selectedContactsData = contacts.filter(contact => 
        selectedContacts.includes(contact.id)
      );

      let successCount = 0;
      let failCount = 0;
      const currentUserId = currentUser?.id || currentUser?._id;

      for (const contact of selectedContactsData) {
        try {
          console.log(`Sharing with ${contact.name}...`);
          let chatId = contact.chatId;
          
          if (!chatId) {
            console.log(`Creating new chat with ${contact.name}`);
            const createChatResult = await chatService.getOrCreatePrivateChat(contact.id);
            
            if (createChatResult.success) {
              chatId = createChatResult.data._id;
              console.log(`Chat created successfully: ${chatId}`);
            } else {
              console.error(`Failed to create chat with ${contact.name}:`, createChatResult.message);
              failCount++;
              continue;
            }
          }

          const personalMessage = message && message.trim() ? message.trim() : '';
          
          const recipeMessageData = {
            chatId: chatId,
            content: personalMessage || `${currentUser?.fullName || currentUser?.name || 'Someone'} shared a recipe with you!`,
            messageType: 'shared_recipe', 
            senderId: currentUserId,
            senderName: currentUser?.fullName || currentUser?.name || 'Unknown User',
            recipeData: {
              id: post?.id || post?._id,
              title: post?.title || 'Untitled Recipe',
              description: post?.description || post?.text || '',
              ingredients: post?.ingredients || '',
              instructions: post?.instructions || '',
              image: (post?.image && post.image.trim() !== '') ? post.image : '',
              video: (post?.video && post.video.trim() !== '') ? post.video : '',
              mediaType: post?.mediaType || 'none',
              category: post?.category || 'General',
              meatType: post?.meatType || 'Mixed',
              prepTime: post?.prepTime || 0,
              servings: post?.servings || 0,
              authorName: post?.user?.fullName || post?.user?.name || post?.userName || 'Unknown Chef',
              authorAvatar: (post?.user?.avatar && post.user.avatar.trim() !== '') ? post.user.avatar : 
                           (post?.userAvatar && post.userAvatar.trim() !== '') ? post.userAvatar : '',
              authorId: post?.userId || post?.user?.id || post?.user?._id,
              likes: post?.likes || [],
              comments: post?.comments || [],
              createdAt: post?.createdAt || new Date().toISOString(),
              personalMessage: personalMessage
            }
          };

          console.log('Sending recipe message...');
          
          const sendResult = await chatService.sendMessage(
            chatId,
            JSON.stringify(recipeMessageData), 
            'shared_recipe',
            'private'
          );
          
          if (sendResult.success) {
            console.log(`Successfully shared with ${contact.name}`);
            successCount++;
          } else {
            console.error(`Failed to share with ${contact.name}:`, sendResult.message);
            failCount++;
          }
          
        } catch (contactError) {
          console.error(`Error sharing with ${contact.name}:`, contactError);
          failCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (onShare && typeof onShare === 'function') {
        const shareData = {
          postId: post?.id || post?._id,
          recipients: selectedContacts,
          message: message,
          sharedAt: new Date().toISOString(),
          sharedBy: currentUserId,
          shareMethod: 'direct_message'
        };
        
        try {
          onShare(shareData);
        } catch (onShareError) {
          console.warn('Error in onShare callback:', onShareError);
        }
      }

      setSelectedContacts([]);
      setMessage('');
      
      if (onClose && typeof onClose === 'function') {
        onClose();
      }

      if (successCount > 0 && failCount === 0) {
        alert(`Recipe Shared! Your delicious recipe has been shared with ${successCount} ${successCount === 1 ? 'person' : 'people'}!`);
        
        if (navigation && successCount === 1) {
          const sharedContact = selectedContactsData[0];
          if (sharedContact) {
            setTimeout(() => {
              navigation.navigate('ChatConversation', {
                chatId: sharedContact.chatId,
                otherUser: {
                  userId: sharedContact.id,
                  userName: sharedContact.name,
                  userAvatar: sharedContact.avatar
                }
              });
            }, 1000);
          }
        }
        
      } else if (successCount > 0 && failCount > 0) {
        alert(`Recipe shared with ${successCount} contacts, but failed to send to ${failCount} contacts.`);
      } else {
        if (window.confirm('Failed to share recipe with selected contacts. Would you like to retry?')) {
          handleShare();
        }
      }
      
    } catch (error) {
      console.error('Error sharing recipe:', error);
      if (window.confirm('Failed to share recipe. Please check your internet connection. Would you like to retry?')) {
        handleShare();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const renderContactItem = (contact) => {
    if (!contact || !contact.id) {
      return null;
    }

    const hasAvatar = contact.avatar && contact.avatar.trim() !== '';
    const isSelected = selectedContacts.includes(contact.id);

    return (
      <div
        key={contact.id}
        onClick={() => !isSharing && toggleContactSelection(contact.id)}
        className={`flex items-center justify-between p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-orange-50 border-orange-200' : ''
        } ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ borderColor: isSelected ? FLAVORWORLD_COLORS.primary + '40' : FLAVORWORLD_COLORS.border }}
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative">
            {hasAvatar ? (
              <img 
                src={contact.avatar} 
                alt={contact.name}
                className="w-11 h-11 rounded-full border-2"
                style={{ borderColor: FLAVORWORLD_COLORS.primary }}
              />
            ) : (
              <div 
                className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                style={{ 
                  borderColor: FLAVORWORLD_COLORS.primary,
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  color: FLAVORWORLD_COLORS.primary
                }}
              >
                {(contact.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
              {contact.name || 'Unknown'}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              {contact.source === 'chat' && (
                <span 
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: FLAVORWORLD_COLORS.background,
                    color: FLAVORWORLD_COLORS.textLight 
                  }}
                >
                  💬 Chat
                </span>
              )}
              {contact.source === 'following' && (
                <span 
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: FLAVORWORLD_COLORS.background,
                    color: FLAVORWORLD_COLORS.textLight 
                  }}
                >
                  Following
                </span>
              )}
              {contact.source === 'both' && (
                <span 
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ 
                    backgroundColor: FLAVORWORLD_COLORS.background,
                    color: FLAVORWORLD_COLORS.textLight 
                  }}
                >
                  💬 Chat & Following
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="ml-3">
          {isSelected ? (
            <Check className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.primary }} />
          ) : (
            <Circle className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.border }} />
          )}
        </div>
      </div>
    );
  };

  const renderPostPreview = () => {
    if (!post) {
      return (
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
            No Recipe Selected
          </h3>
        </div>
      );
    }

    const hasImage = post.image && post.image.trim() !== '';
    const hasVideo = post.video && post.video.trim() !== '';
    const mediaType = post.mediaType || (hasImage ? 'image' : hasVideo ? 'video' : 'none');

    return (
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="mb-3">
          <h3 className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
            🍽️ Recipe Preview
          </h3>
        </div>
        <div className="flex space-x-3">
          {(mediaType === 'image' || hasImage) && hasImage && (
            <img 
              src={post.image} 
              alt="Recipe"
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
          
          {(mediaType === 'video' || hasVideo) && hasVideo && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-900">
              <video
                src={post.video}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-1" style={{ color: FLAVORWORLD_COLORS.text }}>
              {post.title || 'Untitled Recipe'}
            </h4>
            <p className="text-sm mb-2 line-clamp-2" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              {post.description || post.text || 'No description available'}
            </p>
            <div className="space-y-1">
              <div className="flex items-center space-x-4 text-xs" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {post.prepTime || 0}min
                </span>
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {post.servings || 0} servings
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                <span>🍽️ {post.category || 'General'}</span>
                <span>•</span>
                <span>🥘 {post.meatType || 'Mixed'}</span>
              </div>
            </div>
          </div>
          
          {!hasImage && !hasVideo && (
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center border"
              style={{ 
                backgroundColor: FLAVORWORLD_COLORS.background,
                borderColor: FLAVORWORLD_COLORS.border 
              }}
            >
              <ChefHat className="w-8 h-8" style={{ color: FLAVORWORLD_COLORS.textLight }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button 
            onClick={onClose}
            disabled={isSharing}
            className={`p-2 rounded-full transition-colors ${
              isSharing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
            style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
          >
            <X className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
          </button>
          <h2 className="text-xl font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
            Share Recipe
          </h2>
          <button 
            onClick={handleShare}
            disabled={selectedContacts.length === 0 || isSharing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors min-w-[70px] flex items-center justify-center ${
              selectedContacts.length === 0 || isSharing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            }`}
            style={{ 
              backgroundColor: selectedContacts.length === 0 || isSharing 
                ? FLAVORWORLD_COLORS.border 
                : FLAVORWORLD_COLORS.primary,
              color: selectedContacts.length === 0 || isSharing 
                ? FLAVORWORLD_COLORS.textLight 
                : FLAVORWORLD_COLORS.white
            }}
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Share'
            )}
          </button>
        </div>

        {/* Post Preview */}
        {renderPostPreview()}

        {/* Message Input */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message with this recipe..."
            disabled={isSharing}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
            style={{ 
              backgroundColor: FLAVORWORLD_COLORS.background,
              color: FLAVORWORLD_COLORS.text
            }}
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Contacts Section */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
              Share with Contacts ({contacts.length})
            </h3>
            <button 
              onClick={selectAllContacts}
              disabled={loading || isSharing}
              className={`text-sm font-medium transition-colors ${
                loading || isSharing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              }`}
              style={{ color: FLAVORWORLD_COLORS.secondary }}
            >
              {selectedContacts.length === filteredContacts.length 
                ? "Deselect All" 
                : "Select All"}
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                disabled={loading || isSharing}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                style={{ 
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  color: FLAVORWORLD_COLORS.text
                }}
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: FLAVORWORLD_COLORS.primary }} />
                <p className="text-lg" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                  Loading your contacts...
                </p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="text-6xl mb-4 opacity-50">👥</div>
                <p className="text-lg font-medium mb-2" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                  {searchQuery 
                    ? "No contacts match your search" 
                    : "No contacts available"}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-center max-w-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Start chatting with people or follow users to share recipes with them!
                  </p>
                )}
              </div>
            ) : (
              <div>
                {filteredContacts.map(contact => renderContactItem(contact))}
              </div>
            )}
          </div>
        </div>

        {/* Selection Counter */}
        {selectedContacts.length > 0 && !loading && (
          <div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-full shadow-lg"
            style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
          >
            <p className="text-white font-medium text-sm">
              {isSharing 
                ? `Sharing with ${selectedContacts.length} ${selectedContacts.length === 1 ? 'contact' : 'contacts'}...`
                : `${selectedContacts.length} ${selectedContacts.length === 1 ? 'contact' : 'contacts'} selected`
              }
            </p>
          </div>
        )}

        {/* Sharing Overlay */}
        {isSharing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-xl">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center shadow-2xl">
              <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: FLAVORWORLD_COLORS.primary }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                Sharing your delicious recipe...
              </h3>
              <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                Please wait
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePostComponent;