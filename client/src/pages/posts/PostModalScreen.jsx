import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Users, 
  AlertCircle, 
  Loader 
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { recipeService } from '../../../services/recipeService';
import { groupService } from '../../../services/groupService';
import UserAvatar from '../../common/UserAvatar';
import './PostModalScreen.css';

const PostModalScreen = ({ route, navigation, onClose }) => {
  const { currentUser } = useAuth();
  const { 
    postId, 
    groupId, 
    isGroupPost = false, 
    postTitle = 'Recipe',
    postImage 
  } = route.params || {};

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadPost();
  }, []);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const loadPost = async () => {
    try {
      setLoading(true);
      let result;

      if (isGroupPost && groupId) {
        console.log('Loading group post:', postId);
        const groupPostsResult = await groupService.getGroupPosts(groupId, currentUser?.id);
        if (groupPostsResult.success) {
          const foundPost = groupPostsResult.data.find(p => 
            (p._id || p.id) === postId
          );
          if (foundPost) {
            result = { success: true, data: foundPost };
          } else {
            result = { success: false, message: 'Post not found' };
          }
        } else {
          result = groupPostsResult;
        }
      } else {
        console.log('Loading regular post:', postId);
        result = await recipeService.getRecipeById(postId);
      }

      if (result.success) {
        setPost(result.data);
      } else {
        alert(result.message || 'Failed to load post');
        handleClose();
      }
    } catch (error) {
      console.error('Load post error:', error);
      alert('Failed to load post');
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (loading) {
    return (
      <div className="post-modal-overlay" onClick={handleBackdropClick}>
        <div className="post-modal-container">
          <div className="loading-container">
            <Loader size={48} className="loading-spinner" />
            <p className="loading-text">Loading recipe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-modal-overlay" onClick={handleBackdropClick}>
        <div className="post-modal-container">
          <div className="error-container">
            <AlertCircle size={80} />
            <h2 className="error-title">Recipe Not Found</h2>
            <button 
              className="back-button"
              onClick={handleClose}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-modal-overlay" onClick={handleBackdropClick}>
      <div className="post-modal-container" onClick={e => e.stopPropagation()}>
        <div className="header">
          <h1 className="header-title">
            {post.title || 'Recipe'}
          </h1>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
        </div>

        <div className="scroll-container">
          {post.image && (
            <img 
              src={post.image} 
              alt={post.title || 'Recipe'} 
              className="recipe-image" 
            />
          )}

          <div className="recipe-content">
            <div className="meta-row">
              <div className="meta-item">
                <Clock size={16} />
                <span className="meta-text">{formatTime(post.prepTime)}</span>
              </div>
              <div className="meta-item">
                <Users size={16} />
                <span className="meta-text">{post.servings || 0} servings</span>
              </div>
              <div className="meta-item">
                <span className="category-tag">{post.category || 'General'}</span>
              </div>
              {post.meatType && (
                <div className="meta-item">
                  <span className="meat-type-tag">{post.meatType}</span>
                </div>
              )}
            </div>

            <div className="author-info">
              <UserAvatar
                uri={post.userAvatar}
                name={post.userName || 'Chef'}
                size={40}
              />
              <div className="author-details">
                <h3 className="author-name">{post.userName || 'Anonymous Chef'}</h3>
                {isGroupPost && (
                  <p className="group-name">from group</p>
                )}
              </div>
            </div>

            {post.description && (
              <div className="description-section">
                <p className="description">
                  {post.description}
                </p>
              </div>
            )}

            <div className="section">
              <h2 className="section-title">Ingredients</h2>
              <div className="section-content">
                {post.ingredients ? (
                  <pre className="formatted-text">{post.ingredients}</pre>
                ) : (
                  <p className="no-content">No ingredients listed</p>
                )}
              </div>
            </div>

            <div className="section">
              <h2 className="section-title">Instructions</h2>
              <div className="section-content">
                {post.instructions ? (
                  <pre className="formatted-text">{post.instructions}</pre>
                ) : (
                  <p className="no-content">No instructions provided</p>
                )}
              </div>
            </div>

            {(post.createdAt || post.likes || post.comments) && (
              <div className="additional-info">
                {post.createdAt && (
                  <p className="created-date">
                    Created: {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                )}
                {post.likes && (
                  <p className="stats">
                    {post.likes.length || 0} likes
                  </p>
                )}
                {post.comments && (
                  <p className="stats">
                    {post.comments.length || 0} comments
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModalScreen;
