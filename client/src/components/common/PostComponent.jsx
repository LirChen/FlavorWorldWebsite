import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
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

  const navigate = useNavigate();

  useEffect(() => {
    setLocalLikes(safePost.likes || []);
    setLocalComments(safePost.comments || []);
  }, [safePost.likes, safePost.comments]);

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

      if (result.success && result.data?.likes) {
        setLocalLikes(result.data.likes);
        setTimeout(() => onRefreshData?.(), 500);
      } else {
        setLocalLikes(safePost.likes || []);
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

    try {
      const commentData = {
        text: newComment.trim(),
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
        setNewComment('');
        if (result.data?.comments) {
          setLocalComments(result.data.comments);
        }
        onRefreshData?.();
      }
    } catch (error) {
      console.error('Comment error:', error);
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
        onRefreshData?.();
      }
    } catch (error) {
      console.error('Delete comment error:', error);
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
    <div className="post-component">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author" onClick={() => navigation?.navigate?.('/profile', { state: { userId: safePost.userId } })}>
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
            <button onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
              <MoreHorizontal size={20} />
            </button>
            {showOptionsMenu && (
              <div className="options-menu">
                <button className="option-item" onClick={handleEdit}>
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
                <button className="option-item delete" onClick={handleDelete}>
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

        {/* Post Image */}
        {safePost.image && (
          <div 
            className="post-image-container" 
            onClick={() => navigate(`/post/${postId}`, {
              state: { 
                groupId: effectiveGroupId, 
                isGroupPost: isActualGroupPost 
              }
            })}
          >
            <img src={safePost.image} alt={safePost.title} />
          </div>
        )}

        {safePost.video && !safePost.image && (
          <div className="post-video-container" onClick={() => setShowFullRecipe(true)}>
            <video src={safePost.video} controls />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions">
        <div className="post-stats">
          <button 
            className="stat-btn"
            onClick={() => navigate(`/post/${postId}`, {
              state: { 
                groupId: effectiveGroupId, 
                isGroupPost: isActualGroupPost 
              }
            })}
          >
            {localLikes.length} likes
          </button>
          <button 
            className="stat-btn"
            onClick={() => navigate(`/post/${postId}`, {
              state: { 
                groupId: effectiveGroupId, 
                isGroupPost: isActualGroupPost 
              }
            })}
          >
            {localComments.length} comments
          </button>
        </div>

        <div className="post-actions-buttons">
          <button 
            className={`action-btn ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            disabled={isSubmittingLike}
          >
            {isSubmittingLike ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            )}
            <span>Like</span>
          </button>

          <button className="action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageCircle size={18} />
            <span>Comment</span>
          </button>

          <button className="action-btn" onClick={() => onShare?.(safePost)}>
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments">
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
        <div className="modal-overlay" onClick={() => setShowFullRecipe(false)}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header">
              <h2>{safePost.title}</h2>
              <button onClick={() => setShowFullRecipe(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="recipe-modal-body">
              {safePost.image && <img src={safePost.image} alt={safePost.title} />}
              {safePost.video && !safePost.image && <video src={safePost.video} controls />}
              
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