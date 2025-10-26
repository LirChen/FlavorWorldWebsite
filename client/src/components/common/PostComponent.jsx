import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  Users,
  X,
  Trash2,
  Edit2,
  Send,
  Loader2
} from 'lucide-react';
import './PostComponent.css';
import { recipeService } from '../../services/recipeService';
import { groupService } from '../../services/groupService';
import { useAuth } from '../../services/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#F0F2F5',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E4E6EB',
  success: '#27AE60',
  danger: '#E74C3C',
};

const PostComponent = ({ 
  post = {}, 
  onDelete, 
  onShare,
  onShareCustom,
  onRefreshData, 
  navigation,
  isGroupPost = false,
  groupId = null 
}) => {
  const safePost = post || {};
  const { currentUser } = useAuth();
  
  const [localLikes, setLocalLikes] = useState(safePost.likes || []);
  const [localComments, setLocalComments] = useState(safePost.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [showFullRecipe, setShowFullRecipe] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const navigate = useNavigate();

 useEffect(() => {
  setLocalLikes(safePost.likes || []);
  setLocalComments(safePost.comments || []);
  
  const checkSaved = async () => {
  const result = await recipeService.getSavedRecipes();
  if (result.success && Array.isArray(result.data)) {
    setIsSaved(result.data.some(r => (r._id || r.id) === (post._id || post.id)));
  }
};
  checkSaved();
}, [safePost.likes, safePost.comments, post._id, post.id]);
  

  const currentUserId = currentUser?.id || currentUser?._id;
  const isLiked = currentUserId ? localLikes.includes(currentUserId) : false;
  const postId = safePost._id || safePost.id;
  const isActualGroupPost = (isGroupPost && groupId) || safePost.groupId;
  const effectiveGroupId = groupId || safePost.groupId;
  const isOwner = currentUserId && safePost.userId === currentUserId;

  const formatTime = (minutes) => {
    if (!minutes) return '0m';
    const numMinutes = parseInt(minutes);
    if (numMinutes < 60) return `${numMinutes}m`;
    const hours = Math.floor(numMinutes / 60);
    const remainingMinutes = numMinutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return 'Just now';
    }
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('button') ||
      e.target.closest('.post-options') ||
      e.target.closest('.post-actions-buttons') ||
      e.target.closest('.post-comments')
    ) {
      return;
    }

    navigate(`/post/${postId}`, {
      state: { 
        groupId: effectiveGroupId, 
        isGroupPost: isActualGroupPost 
      }
    });
  };

  const handleLike = async () => {
    if (!postId || !currentUserId || isSubmittingLike) return;
    setIsSubmittingLike(true);

    const newLikes = isLiked 
      ? localLikes.filter(id => id !== currentUserId)
      : [...localLikes, currentUserId];
    
    setLocalLikes(newLikes);

    try {
      let result;
      if (isActualGroupPost && effectiveGroupId) {
        result = isLiked 
          ? await groupService.unlikeGroupPost(effectiveGroupId, postId, currentUserId)
          : await groupService.likeGroupPost(effectiveGroupId, postId, currentUserId);
      } else {
        result = isLiked 
          ? await recipeService.unlikeRecipe(postId, currentUserId)
          : await recipeService.likeRecipe(postId, currentUserId);
      }

      if (result.success) {
        if (result.data?.likes) {
          setLocalLikes(result.data.likes);
        }
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setLocalLikes(safePost.likes || []);
        console.error('Like failed:', result.message);
      }
    } catch (error) {
      setLocalLikes(safePost.likes || []);
      console.error('Like error:', error);
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId || isSubmittingComment || !currentUserId) return;
    setIsSubmittingComment(true);

    const commentText = newComment.trim();
    
    const tempComment = {
      _id: `temp-${Date.now()}`,
      text: commentText,
      userId: currentUserId,
      userName: currentUser?.fullName || currentUser?.name || 'Anonymous',
      userAvatar: currentUser?.avatar || currentUser?.userAvatar || '',
      createdAt: new Date().toISOString()
    };
    
    setLocalComments(prev => [...prev, tempComment]);
    setNewComment('');

    try {
      const commentData = {
        text: commentText,
        userId: currentUserId,
        userName: currentUser?.fullName || currentUser?.name || 'Anonymous',
        userAvatar: currentUser?.avatar || currentUser?.userAvatar || ''
      };

      let result;
      if (isActualGroupPost && effectiveGroupId) {
        result = await groupService.addCommentToGroupPost(effectiveGroupId, postId, commentData);
      } else {
        result = await recipeService.addComment(postId, commentData);
      }

      if (result.success) {
        if (result.data?.comments) {
          setLocalComments(result.data.comments);
        } else if (result.data?.comment) {
          setLocalComments(prev => 
            prev.map(c => c._id === tempComment._id ? result.data.comment : c)
          );
        }
        
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setLocalComments(prev => prev.filter(c => c._id !== tempComment._id));
        setNewComment(commentText);
        console.error('Add comment failed:', result.message);
        alert(result.message || 'Failed to add comment');
      }
    } catch (error) {
      setLocalComments(prev => prev.filter(c => c._id !== tempComment._id));
      setNewComment(commentText);
      console.error('Comment error:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId || !currentUserId) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const originalComments = [...localComments];
    setLocalComments(prev => prev.filter(comment => comment._id !== commentId));

    try {
      let result;
      if (isActualGroupPost && effectiveGroupId) {
        result = await groupService.deleteCommentFromGroupPost(
          effectiveGroupId, 
          postId, 
          commentId, 
          currentUserId
        );
      } else {
        result = await recipeService.deleteComment(postId, commentId);
      }
      
      if (result.success) {
        if (result.data?.comments) {
          setLocalComments(result.data.comments);
        }
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        setLocalComments(originalComments);
        console.error('Delete comment failed:', result.message);
        alert(result.message || 'Failed to delete comment');
      }
    } catch (error) {
      setLocalComments(originalComments);
      console.error('Delete comment error:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };
 const handleSave = async () => {
  const postId = post._id || post.id;
  
  console.log('=== SAVE DEBUG ===');
  console.log('Post object:', post);
  console.log('Post ID:', postId);
  console.log('Is saved:', isSaved);
  console.log('Post source:', post.postSource);
  console.log('Group ID:', post.groupId);
  
  if (!postId) {
    alert('Error: Post ID is missing');
    return;
  }
  
  try {
    if (isSaved) {
      console.log('Attempting to unsave...');
      const result = await recipeService.unsaveRecipe(postId);
      console.log('Unsave result:', result);
      if (result.success) {
        setIsSaved(false);
      } else {
        console.error('Unsave failed:', result);
        alert(result.message || 'Failed to unsave recipe');
      }
    } else {
      console.log('Attempting to save...');
      const result = await recipeService.saveRecipe(postId);
      console.log('Save result:', result);
      if (result.success) {
        setIsSaved(true);
      } else {
        console.error('Save failed:', result);
        alert(result.message || 'Failed to save recipe');
      }
    }
  } catch (error) {
    console.error('Error saving post:', error);
    alert('An error occurred. Please try again.');
  }
};
  const handleEdit = () => {
    navigate('/edit-post', {
      state: {
        postId: safePost._id || safePost.id,
        postData: safePost,
        isGroupPost: isActualGroupPost,
        groupId: effectiveGroupId,
        groupName: safePost.group?.name || safePost.groupName
      }
    });
  };

  const handleDelete = () => {
    setShowOptionsMenu(false);
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      onDelete?.(postId);
    }
  };

  return (
    <div className="post-component" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      {/* Post Header */}
      <div className="post-header">
        <div 
          className="post-author" 
          onClick={(e) => {
            e.stopPropagation();
            navigation?.navigate?.('/profile', { state: { userId: safePost.userId } });
          }}
        >
          <UserAvatar
            uri={safePost.userAvatar}
            name={safePost.userName || 'Anonymous'}
            size={40}
          />
          <div className="post-author-info">
            <h4>{safePost.userName || 'Anonymous'}</h4>
            <span>{formatDate(safePost.createdAt)}</span>
          </div>
        </div>

        {isOwner && (
          <div className="post-options">
            <button 
              className="menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
            >
              <MoreHorizontal size={20} />
            </button>
            {showOptionsMenu && (
              <div className="options-menu">
                <button 
                  className="option-item" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
                <button 
                  className="option-item delete" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">{safePost.title || 'Untitled Recipe'}</h3>
        <p className="post-description">{safePost.description}</p>

        <div className="post-meta">
          <span className="meta-item">
            <Clock size={16} />
            {formatTime(safePost.prepTime)}
          </span>
          <span className="meta-item">
            <Users size={16} />
            {safePost.servings || 0} servings
          </span>
          <span className="meta-tag">{safePost.category}</span>
          <span className="meta-tag">{safePost.meatType}</span>
        </div>

        {/* Show video if mediaType is video or video field exists */}
        {(safePost.mediaType === 'video' || safePost.video) && (
          <div className="post-video-container" onClick={(e) => {
            e.stopPropagation();
            setShowFullRecipe(true);
          }}>
            <video src={safePost.video} controls />
          </div>
        )}

        {/* Show image if mediaType is image or image field exists (and no video) */}
        {(safePost.mediaType === 'image' || safePost.image) && !safePost.video && (
          <div className="post-image-container">
            <img src={safePost.image} alt={safePost.title} />
          </div>
        )}

        {/* Show placeholder only if no image and no video */}
        {!safePost.image && !safePost.video && (
          <div className="post-image-placeholder">
            🍽️
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <div className="post-stats">
          <button 
            className="stat-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/post/${postId}`, {
                state: { 
                  groupId: effectiveGroupId, 
                  isGroupPost: isActualGroupPost 
                }
              });
            }}
          >
            {localLikes.length} likes
          </button>
          <button 
            className="stat-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/post/${postId}`, {
                state: { 
                  groupId: effectiveGroupId, 
                  isGroupPost: isActualGroupPost 
                }
              });
            }}
          >
            {localComments.length} comments
          </button>
        </div>

        <div className="post-actions-buttons">
          <button 
            className={`action-btn like-button ${isLiked ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            disabled={isSubmittingLike}
          >
            {isSubmittingLike ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            )}
            <span>Like</span>
          </button>

          <button 
            className="action-btn comment-button" 
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
          >
            <MessageCircle size={18} />
            <span>Comment</span>
          </button>
          <button className="action-btn" onClick={handleSave}>
              <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

          <button 
            className="action-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(safePost);
            }}
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments" onClick={(e) => e.stopPropagation()}>
          <div className="add-comment">
            <UserAvatar
              uri={currentUser?.avatar || currentUser?.userAvatar}
              name={currentUser?.fullName || currentUser?.name}
              size={32}
            />
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>

          <div className="comments-list">
            {localComments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <UserAvatar
                  uri={comment.userAvatar}
                  name={comment.userName}
                  size={32}
                />
                <div className="comment-content">
                  <div className="comment-bubble">
                    <h5>{comment.userName}</h5>
                    <p>{comment.text}</p>
                  </div>
                  <div className="comment-meta">
                    <span>{formatDate(comment.createdAt)}</span>
                    {comment.userId === currentUserId && (
                      <button onClick={() => handleDeleteComment(comment._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Recipe Modal */}
      {showFullRecipe && (
        <div className="modal-overlay" onClick={(e) => {
          e.stopPropagation();
          setShowFullRecipe(false);
        }}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header">
              <h2>{safePost.title}</h2>
              <button onClick={(e) => {
                e.stopPropagation();
                setShowFullRecipe(false);
              }}>
                <X size={24} />
              </button>
            </div>
            <div className="recipe-modal-body">
              {/* Show video if it exists */}
              {safePost.video && <video src={safePost.video} controls />}
              
              {/* Show image only if no video */}
              {safePost.image && !safePost.video && <img src={safePost.image} alt={safePost.title} />}
              
              <div className="recipe-details">
                <h3>Description</h3>
                <p>{safePost.description}</p>

                <h3>Ingredients</h3>
                <p className="recipe-text">{safePost.ingredients}</p>

                <h3>Instructions</h3>
                <p className="recipe-text">{safePost.instructions}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComponent;