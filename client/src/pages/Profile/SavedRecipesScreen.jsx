import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Bookmark } from 'lucide-react';
import './ProfileScreen.css';
import { recipeService } from '../../services/recipeService';
import PostComponent from '../../components/common/PostComponent';

const SavedRecipesScreen = () => {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPosts = async () => {
      try {
        const result = await recipeService.getSavedRecipes();
        if (result.success && Array.isArray(result.data)) {
          setSavedPosts(result.data);
        }
      } catch (error) {
        console.error('Error loading saved posts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSavedPosts();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    const loadSavedPosts = async () => {
      try {
        const result = await recipeService.getSavedRecipes();
        if (result.success && Array.isArray(result.data)) {
          setSavedPosts(result.data);
        }
      } catch (error) {
        console.error('Error loading saved posts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSavedPosts();
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <header className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Saved Recipes</h1>
          <div className="header-placeholder" />
        </header>
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Saved Recipes</h1>
        <div className="header-placeholder" />
      </header>

      <div className="profile-content">
        <div className="posts-section">
          {savedPosts.length === 0 ? (
            <div className="empty-state">
              <Bookmark size={64} style={{ color: 'var(--text-light)' }} />
              <h3>No Saved Recipes</h3>
              <p>Start saving recipes to see them here</p>
            </div>
         ) : (
  <div className="saved-recipes-grid">
    {savedPosts.map(post => (
      <div 
        key={post._id || post.id} 
        className="saved-recipe-card"
        onClick={() => navigate(`/post/${post._id || post.id}`)}
      >
        <img 
          src={post.image} 
          alt={post.title || 'Recipe'} 
          className="saved-recipe-image"
        />
        <div className="saved-recipe-overlay">
          <span className="saved-recipe-title">{post.title}</span>
        </div>
      </div>
    ))}
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default SavedRecipesScreen;