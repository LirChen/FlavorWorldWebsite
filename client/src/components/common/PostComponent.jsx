import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Play,
  Clock,
  Users,
  X,
  Trash,
  Edit,
  Camera,
  Video,
  ChevronDown,
  Send,
  Loader2,
  Plus,
  ChefHat
} from 'lucide-react';
import { recipeService } from '../../services/recipeService';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from './UserAvatar';
import { groupService } from '../../services/groupService';

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

const RECIPE_CATEGORIES = [
  'Asian', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 
  'American', 'French', 'Chinese', 'Japanese', 'Thai', 
  'Middle Eastern', 'Greek', 'Spanish', 'Korean', 'Vietnamese', 'Dessert'
];

const MEAT_TYPES = [
  'Vegetarian', 'Vegan', 'Chicken', 'Beef', 'Pork', 
  'Fish', 'Seafood', 'Lamb', 'Turkey', 'Mixed'
];

const PostComponent = ({ 
  post = {}, 
  onUpdate, 
  onDelete, 
  onShare,
  onShareCustom,
  onRefreshData, 
  navigation,
  isGroupPost = false,
  groupId = null 
}) => {
  const safePost = post || {};
  const { currentUser, isLoading } = useAuth();
  
  const [localLikes, setLocalLikes] = useState(safePost.likes || []);
  const [localComments, setLocalComments] = useState(safePost.comments || []);
  
  const [showComments, setShowComments] = useState(false);
  const [showFullRecipe, setShowFullRecipe] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  const [showEditMeatTypeDropdown, setShowEditMeatTypeDropdown] = useState(false);
  
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    category: '',
    meatType: '',
    prepTime: 0,
    servings: 0,
    image: '',
    video: '',
    mediaType: 'none'
  });
  const [editMediaType, setEditMediaType] = useState('none');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setLocalLikes(safePost.likes || []);
    setLocalComments(safePost.comments || []);
  }, [safePost.likes, safePost.comments]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-3" style={{ color: FLAVORWORLD_COLORS.primary }} />
        <span style={{ color: FLAVORWORLD_COLORS.textLight }}>Loading...</span>
      </div>
    );
  }

  const likesCount = localLikes.length;
  const comments = localComments;
  
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId;
  const currentUserName = currentUser?.fullName || currentUser?.name || currentUser?.displayName || currentUser?.username || 'Anonymous';
  
  const isLiked = currentUserId ? localLikes.some(likeUserId => 
    likeUserId === currentUserId || 
    likeUserId === currentUser?.id || 
    likeUserId === currentUser?._id
  ) : false;
  
  const postId = safePost._id || safePost.id;
  const isActualGroupPost = (isGroupPost && groupId) || safePost.groupId || safePost.postSource === 'group';
  const effectiveGroupId = groupId || safePost.groupId;

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';

    try {
      const date = new Date(dateString);
      const now = new Date();

      if (isNaN(date.getTime())) {
        return 'Just now';
      }

      const diffInMs = now - date;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return 'Just now';
    }
  };

  const renderMedia = () => {
    const hasImage = safePost.image;
    const hasVideo = safePost.video;
    const mediaType = safePost.mediaType || (hasImage ? 'image' : hasVideo ? 'video' : 'none');

    if (mediaType === 'none' && !hasImage && !hasVideo) {
      return null;
    }

    return (
      <div className="mt-4 rounded-xl overflow-hidden cursor-pointer" onClick={() => setShowFullRecipe(true)}>
        {(mediaType === 'image' || (hasImage && !hasVideo)) && (
          <img 
            src={safePost.image} 
            alt="Recipe"
            className="w-full h-48 object-cover"
            onError={(e) => console.log('Image load error:', e)}
            onLoad={() => console.log('Image loaded successfully')}
          />
        )}
        
        {(mediaType === 'video' || (hasVideo && !hasImage)) && (
          <div className="relative w-full h-48 bg-gray-900">
            <video
              src={safePost.video}
              className="w-full h-full object-cover"
              controls={false}
              muted
              onError={(e) => console.log('Video load error:', e)}
              onLoad={() => console.log('Video loaded successfully')}
            />
            
            <div className="absolute top-3 right-3 bg-black bg-opacity-70 flex items-center px-2 py-1 rounded-lg">
              <Play className="w-4 h-4 text-white mr-1" />
              <span className="text-white text-xs font-semibold">Video Recipe</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const refreshNotificationsIfNeeded = useCallback(async (targetUserId) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    if (targetUserId && targetUserId !== currentUserId) {
      console.log('Action may trigger notification for user:', targetUserId);
    }
  }, [currentUser]);

  const handleLike = async () => {
    if (!postId || !currentUserId || isSubmittingLike) return;

    setIsSubmittingLike(true);

    const newLikes = isLiked 
      ? localLikes.filter(id => id !== currentUserId && id !== currentUser?.id && id !== currentUser?._id)
      : [...localLikes, currentUserId];
    
    setLocalLikes(newLikes);

    try {
      let result;
      
      if (isActualGroupPost && effectiveGroupId) {
        if (isLiked) {
          result = await groupService.unlikeGroupPost(effectiveGroupId, postId, currentUserId);
        } else {
          result = await groupService.likeGroupPost(effectiveGroupId, postId, currentUserId);
          if (!isLiked) {
            await refreshNotificationsIfNeeded(safePost.userId);
          }
        }
      } else {
        if (isLiked) {
          result = await recipeService.unlikeRecipe(postId, currentUserId);
        } else {
          result = await recipeService.likeRecipe(postId, currentUserId);
          if (!isLiked) {
            await refreshNotificationsIfNeeded(safePost.userId);
          }
        }
      }

      if (result.success) {
        if (result.data && result.data.likes) {
          setLocalLikes(result.data.likes);
        }
        
        setTimeout(() => {
          if (onRefreshData) {
            onRefreshData();
          }
        }, 500);
      } else {
        setLocalLikes(safePost.likes || []);
        alert(result.message || 'Failed to update like');
      }
    } catch (error) {
      setLocalLikes(safePost.likes || []);
      console.error('Like error:', error);
      alert('Failed to update like status');
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId || isSubmittingComment || !currentUserId) return;

    setIsSubmittingComment(true);

    try {
      let result;
      
      if (isActualGroupPost && effectiveGroupId) {
        result = await groupService.addCommentToGroupPost(effectiveGroupId, postId, {
          text: newComment.trim(),
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUser?.avatar || currentUser?.userAvatar || ''
        });
      } else {
        result = await recipeService.addComment(postId, {
          text: newComment.trim(),
          userId: currentUserId,
          userName: currentUserName,
          userAvatar: currentUser?.avatar || currentUser?.userAvatar || ''
        });
      }

      if (result.success) {
        setNewComment('');
        
        if (result.data && result.data.comments) {
          setLocalComments(result.data.comments);
        }
        
        await refreshNotificationsIfNeeded(safePost.userId);
        
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        alert(result.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      let result;
      
      if (isActualGroupPost && effectiveGroupId) {
        result = await groupService.deleteCommentFromGroupPost(effectiveGroupId, postId, commentId, currentUserId);
      } else {
        result = await recipeService.deleteComment(postId, commentId);
      }
      
      if (result.success) {
        setLocalComments(prev => prev.filter(comment => comment._id !== commentId));
        
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        alert(result.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Failed to delete comment');
    }
  };

  const handleEdit = () => {
    setShowOptionsModal(false);
    
    const hasImage = safePost.image && safePost.image.trim() !== '';
    const hasVideo = safePost.video && safePost.video.trim() !== '';
    const currentMediaType = safePost.mediaType || (hasImage ? 'image' : hasVideo ? 'video' : 'none');
    
    setEditData({
      title: safePost.title || '',
      description: safePost.description || '',
      ingredients: safePost.ingredients || '',
      instructions: safePost.instructions || '',
      category: safePost.category || '',
      meatType: safePost.meatType || '',
      prepTime: safePost.prepTime || 0,
      servings: safePost.servings || 0,
      image: hasImage ? safePost.image : '',
      video: hasVideo ? safePost.video : '',
      mediaType: currentMediaType
    });
    
    setEditMediaType(currentMediaType);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowOptionsModal(false);
    
    if (!currentUserId || !safePost.userId) {
      alert('Cannot determine ownership');
      return;
    }

    const postOwnerId = safePost.userId || safePost.user?.id || safePost.user?._id;
    if (postOwnerId !== currentUserId && postOwnerId !== currentUser?.id && postOwnerId !== currentUser?._id) {
      alert('You can only delete your own recipes');
      return;
    }

    if (!postId) {
      alert('Invalid post ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this delicious recipe?')) {
      if (onDelete) {
        onDelete(postId);
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleInternalShare = () => {
    setShowShareModal(false);
    if (onShareCustom) {
      onShareCustom(safePost);
    }
  };

  const handleExternalShare = async () => {
    setShowShareModal(false);

    try {
      const shareContent = `Check out this amazing recipe: ${safePost.title || 'Delicious Recipe'}\n\n${safePost.description || ''}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `${safePost.title || 'Recipe'} - Recipe from FlavorWorld`,
          text: shareContent,
          url: `https://flavorworld.com/recipe/${safePost.id}`,
        });
      } else {
        await navigator.clipboard.writeText(shareContent);
        alert('Recipe link copied to clipboard!');
      }

      if (onShare) {
        onShare({
          ...safePost,
          shareType: 'external',
          sharedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Could not share recipe. Please try again.');
    }
  };

  const handleProfilePress = () => {
    if (navigation) {
      navigation.navigate('Profile', { 
        userId: safePost.userId || safePost.user?.id || safePost.user?._id 
      });
    }
  };

  const handleFileSelect = async (type = 'image') => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'video' ? 'video/*' : 'image/*';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setEditData(prev => ({
            ...prev,
            [type]: url,
            [type === 'image' ? 'video' : 'image']: '',
            mediaType: type
          }));
          setEditMediaType(type);
        }
      };
      
      input.click();
    } catch (error) {
      alert(`Failed to pick ${type}`);
      console.error(`${type} picker error:`, error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) {
      alert('Please enter a recipe title');
      return;
    }

    setIsUpdating(true);
    
    try {
      let result;
      let mediaUri = null;
      let mediaType = editData.mediaType;

      if (editData.image && editData.image.startsWith('blob:')) {
        mediaUri = editData.image;
        mediaType = 'image';
      } else if (editData.video && editData.video.startsWith('blob:')) {
        mediaUri = editData.video;
        mediaType = 'video';
      }

      const updateData = {
        ...editData,
        userId: currentUserId
      };
      
      if (isActualGroupPost && effectiveGroupId) {
        result = await groupService.updateGroupPost(effectiveGroupId, postId, updateData, mediaUri, mediaType);
      } else {
        result = await recipeService.updateRecipe(postId, updateData, mediaUri, mediaType);
      }

      if (result.success) {
        setShowEditModal(false);
        alert('Recipe updated successfully!');
        
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        alert(result.message || 'Failed to update recipe');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update recipe');
    } finally {
      setIsUpdating(false);
    }
  };

  const CustomDropdown = ({ 
    value, 
    placeholder, 
    options, 
    onChange, 
    isOpen, 
    setIsOpen 
  }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
        style={{ 
          color: value ? FLAVORWORLD_COLORS.text : FLAVORWORLD_COLORS.textLight 
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                value === option ? 'font-semibold' : ''
              }`}
              style={{ 
                backgroundColor: value === option ? `${FLAVORWORLD_COLORS.primary}20` : 'transparent',
                color: value === option ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.text
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderComment = (comment) => {
    if (!comment || !comment._id) return null;

    return (
      <div key={comment._id} className="flex space-x-3 py-3 border-b border-gray-100">
        <UserAvatar
          uri={comment.userAvatar || ''}
          name={comment.userName || 'Anonymous'}
          size={32}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm" style={{ color: FLAVORWORLD_COLORS.text }}>
                {comment.userName || 'Anonymous'}
              </span>
              <span className="text-xs" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                {formatDate(comment.createdAt)}
              </span>
            </div>
            {(comment.userId === currentUserId || comment.userId === currentUser?.id || comment.userId === currentUser?._id) && (
              <button 
                onClick={() => handleDeleteComment(comment._id)}
                className="p-1 hover:bg-red-50 rounded"
              >
                <Trash className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.danger }} />
              </button>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: FLAVORWORLD_COLORS.text }}>
            {comment.text || ''}
          </p>
        </div>
      </div>
    );
  };

  const isOwner = currentUserId && (
    safePost.userId === currentUserId || 
    safePost.userId === currentUser?.id || 
    safePost.userId === currentUser?._id
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={handleProfilePress}
        >
          <UserAvatar
            uri={safePost.userAvatar || ''}
            name={safePost.userName || 'Anonymous Chef'}
            size={40}
          />
          <div>
            <h3 className="font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
              {safePost.userName || 'Anonymous Chef'}
            </h3>
            <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              {formatDate(safePost.createdAt)}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowOptionsModal(!showOptionsModal)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
            </button>

            {showOptionsModal && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Edit className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.accent }} />
                  <span style={{ color: FLAVORWORLD_COLORS.text }}>Edit Recipe</span>
                </button>
                <hr className="border-gray-100" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Trash className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.danger }} />
                  <span style={{ color: FLAVORWORLD_COLORS.danger }}>Delete Recipe</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipe Content */}
      <div className="px-4 cursor-pointer" onClick={() => setShowFullRecipe(true)}>
        <h2 className="text-xl font-bold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
          {safePost.title || 'Untitled Recipe'}
        </h2>
        <p className="mb-3 line-clamp-2" style={{ color: FLAVORWORLD_COLORS.textLight }}>
          {safePost.description || 'No description available'}
        </p>

        <div className="flex items-center space-x-4 mb-3 flex-wrap">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.primary }} />
            <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              {formatTime(safePost.prepTime)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.secondary }} />
            <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              {safePost.servings || 0} servings
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ 
                backgroundColor: FLAVORWORLD_COLORS.background,
                color: FLAVORWORLD_COLORS.secondary 
              }}
            >
              {safePost.category || 'General'}
            </span>
            <span 
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ 
                backgroundColor: FLAVORWORLD_COLORS.background,
                color: FLAVORWORLD_COLORS.accent 
              }}
            >
              {safePost.meatType || 'Mixed'}
            </span>
          </div>
        </div>

        {renderMedia()}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-around p-4 border-t border-gray-100 mt-4">
        <button 
          onClick={handleLike}
          disabled={isSubmittingLike}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
            isSubmittingLike ? 'opacity-50' : 'hover:bg-gray-50'
          }`}
          style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
        >
          {isSubmittingLike ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: FLAVORWORLD_COLORS.primary }} />
          ) : (
            <Heart 
              className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`}
              style={{ color: isLiked ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.textLight }}
            />
          )}
          <span 
            className="text-sm font-medium"
            style={{ color: isLiked ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.textLight }}
          >
            {likesCount}
          </span>
        </button>

        <button
          onClick={() => setShowComments(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
        >
          <MessageCircle className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
          <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.textLight }}>
            {comments.length}
          </span>
        </button>

        <button 
          onClick={handleShare}
          className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
        >
          <Share className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
          <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.textLight }}>Share</span>
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6 text-center" style={{ color: FLAVORWORLD_COLORS.text }}>
                Share Recipe
              </h3>
              
              <div className="space-y-4">
                <button
                    onClick={handleInternalShare}
                    className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Users className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.primary }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
                      Share with FlavorWorld Friends
                    </h4>
                    <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                      Send directly to friends and contacts
                    </p>
                  </div>
                </button>
                
                <button 
                  onClick={handleExternalShare}
                  className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Share className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.secondary }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
                      Share to Other Apps
                    </h4>
                    <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                      WhatsApp, Instagram, Twitter, etc.
                    </p>
                  </div>
                </button>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-6 px-4 py-2 text-center hover:bg-gray-50 rounded-lg transition-colors"
                style={{ color: FLAVORWORLD_COLORS.textLight }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
                Comments ({comments.length})
              </h3>
              <button 
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.accent }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg font-medium mb-2" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    No comments yet
                  </p>
                  <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {comments.map(comment => renderComment(comment))}
                </div>
              )}
            </div>

            <div className="flex items-end space-x-3 p-4 border-t border-gray-200">
              <UserAvatar
                uri={currentUser?.avatar || currentUser?.userAvatar || ''}
                name={currentUserName}
                size={32}
              />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this recipe..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  style={{ color: FLAVORWORLD_COLORS.text }}
                  rows={2}
                  maxLength={500}
                />
              </div>
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className={`p-2 rounded-full transition-colors ${
                  (!newComment.trim() || isSubmittingComment) 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: FLAVORWORLD_COLORS.primary }} />
                ) : (
                  <Send className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.primary }} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Recipe Modal */}
      {showFullRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: FLAVORWORLD_COLORS.text }}>
                {safePost.title || 'Untitled Recipe'}
              </h2>
              <button 
                onClick={() => setShowFullRecipe(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Media */}
              {(safePost.image || safePost.video) && (
                <div className="w-full">
                  {safePost.image && (
                    <img 
                      src={safePost.image} 
                      alt="Recipe"
                      className="w-full h-64 object-cover"
                    />
                  )}
                  {safePost.video && !safePost.image && (
                    <video 
                      src={safePost.video} 
                      controls 
                      className="w-full h-64 object-cover bg-gray-900"
                    />
                  )}
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
                      {formatTime(safePost.prepTime)}
                    </span>
                  </div>
                  <div 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                    style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Users className="w-4 h-4" style={{ color: FLAVORWORLD_COLORS.secondary }} />
                    <span className="text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                      {safePost.servings || 0} servings
                    </span>
                  </div>
                  <span 
                    className="px-3 py-2 rounded-lg text-sm font-semibold"
                    style={{ 
                      backgroundColor: FLAVORWORLD_COLORS.background,
                      color: FLAVORWORLD_COLORS.secondary 
                    }}
                  >
                    {safePost.category || 'General'}
                  </span>
                </div>

                <p className="text-lg mb-6" style={{ color: FLAVORWORLD_COLORS.text }}>
                  {safePost.description || 'No description available'}
                </p>

                {/* Ingredients */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Ingredients
                  </h3>
                  <p className="whitespace-pre-wrap" style={{ color: FLAVORWORLD_COLORS.text }}>
                    {safePost.ingredients || 'No ingredients listed'}
                  </p>
                </div>

                {/* Instructions */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
                >
                  <h3 className="text-xl font-bold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Instructions
                  </h3>
                  <p className="whitespace-pre-wrap" style={{ color: FLAVORWORLD_COLORS.text }}>
                    {safePost.instructions || 'No instructions provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: FLAVORWORLD_COLORS.text }}>
                Edit Recipe
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                    isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
                >
                  {isUpdating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                  placeholder="What's cooking? Give your recipe a delicious name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  style={{ color: FLAVORWORLD_COLORS.text }}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Description *
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Tell us about your recipe... What makes it special?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 resize-none"
                  style={{ color: FLAVORWORLD_COLORS.text }}
                  maxLength={500}
                />
              </div>

              {/* Category and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Category *
                  </label>
                  <CustomDropdown
                    value={editData.category}
                    placeholder="Select cuisine"
                    options={RECIPE_CATEGORIES}
                    onChange={(value) => setEditData(prev => ({...prev, category: value}))}
                    isOpen={showEditCategoryDropdown}
                    setIsOpen={setShowEditCategoryDropdown}
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Type *
                  </label>
                  <CustomDropdown
                    value={editData.meatType}
                    placeholder="Select type"
                    options={MEAT_TYPES}
                    onChange={(value) => setEditData(prev => ({...prev, meatType: value}))}
                    isOpen={showEditMeatTypeDropdown}
                    setIsOpen={setShowEditMeatTypeDropdown}
                  />
                </div>
              </div>

              {/* Time and Servings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Prep Time *
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={Math.floor((editData.prepTime || 0) / 60)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        const minutes = (editData.prepTime || 0) % 60;
                        setEditData(prev => ({...prev, prepTime: hours * 60 + minutes}));
                      }}
                      placeholder="0"
                      min="0"
                      max="24"
                      className="w-20 px-3 py-3 border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                      style={{ color: FLAVORWORLD_COLORS.text }}
                    />
                    <span className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>h</span>
                    <input
                      type="number"
                      value={(editData.prepTime || 0) % 60}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0;
                        const hours = Math.floor((editData.prepTime || 0) / 60);
                        setEditData(prev => ({...prev, prepTime: hours * 60 + minutes}));
                      }}
                      placeholder="30"
                      min="0"
                      max="59"
                      className="w-20 px-3 py-3 border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                      style={{ color: FLAVORWORLD_COLORS.text }}
                    />
                    <span className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>m</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Servings *
                  </label>
                  <input
                    type="number"
                    value={editData.servings}
                    onChange={(e) => setEditData(prev => ({...prev, servings: parseInt(e.target.value) || 0}))}
                    placeholder="4"
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                    style={{ color: FLAVORWORLD_COLORS.text }}
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Ingredients *
                </label>
                <textarea
                  value={editData.ingredients}
                  onChange={(e) => setEditData(prev => ({...prev, ingredients: e.target.value}))}
                  placeholder="List all ingredients and quantities..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 resize-none"
                  style={{ color: FLAVORWORLD_COLORS.text }}
                  maxLength={1000}
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Instructions *
                </label>
                <textarea
                  value={editData.instructions}
                  onChange={(e) => setEditData(prev => ({...prev, instructions: e.target.value}))}
                  placeholder="Share your cooking secrets... Step by step instructions"
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 resize-none"
                  style={{ color: FLAVORWORLD_COLORS.text }}
                  maxLength={1000}
                />
              </div>

              {/* Media */}
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Recipe Media
                </label>
                
                <div className="flex space-x-4 mb-4">
                  <button
                    type="button"
                    onClick={() => handleFileSelect('image')}
                    className={`flex-1 flex items-center justify-center px-6 py-3 border-2 rounded-xl transition-colors ${
                      editMediaType === 'image' 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Camera className="w-5 h-5 mr-2" style={{ color: FLAVORWORLD_COLORS.primary }} />
                    <span className="font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>Photo</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleFileSelect('video')}
                    className={`flex-1 flex items-center justify-center px-6 py-3 border-2 rounded-xl transition-colors ${
                      editMediaType === 'video' 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <Video className="w-5 h-5 mr-2" style={{ color: FLAVORWORLD_COLORS.secondary }} />
                    <span className="font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>Video</span>
                  </button>
                </div>
                    {/* Media Preview */}
                {editData.image && editMediaType === 'image' && (
                  <div className="relative inline-block">
                    <img 
                      src={editData.image} 
                      alt="Recipe preview" 
                      className="w-64 h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setEditData(prev => ({...prev, image: '', mediaType: 'none'}))}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
                    >
                      <X className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.danger }} />
                    </button>
                  </div>
                )}

                {editData.video && editMediaType === 'video' && (
                  <div className="relative inline-block">
                    <video 
                      src={editData.video} 
                      controls 
                      className="w-64 h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setEditData(prev => ({...prev, video: '', mediaType: 'none'}))}
                      className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
                    >
                      <X className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.danger }} />
                    </button>
                  </div>
                )}

                {!editData.image && !editData.video && (
                  <div 
                    className="border-2 border-dashed rounded-xl p-8 text-center"
                    style={{ borderColor: FLAVORWORLD_COLORS.border, backgroundColor: FLAVORWORLD_COLORS.background }}
                  >
                    <Plus className="w-12 h-12 mx-auto mb-3" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                    <p className="text-lg font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                      Add a photo or video
                    </p>
                    <p className="text-sm mt-1" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                      Make your recipe come alive!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop click handler for modals */}
      {(showOptionsModal || showShareModal || showComments || showFullRecipe || showEditModal) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowOptionsModal(false);
            setShowShareModal(false);
            setShowComments(false);
            setShowFullRecipe(false);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PostComponent;