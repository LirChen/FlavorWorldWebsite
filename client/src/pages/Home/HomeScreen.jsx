import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiSearch, FiSettings, FiRefreshCw, FiCamera, FiX, FiHeart, FiUsers, FiGlobe, FiFilter, FiBell, FiMessageCircle } from 'react-icons/fi';
import { MdRestaurant, MdChatBubble } from 'react-icons/md';
import { chatService } from '../../services/chatServices';
import './HomeScreen.css';
import { notificationService } from '../../services/NotificationService';
import PostComponent from '../../components/common/PostComponent';
import CreatePostComponent from '../../components/common/CreatePostComponent';
import SharePostComponent from '../../components/common/SharePostComponent';
import UserAvatar from '../../components/common/UserAvatar';
import { useAuth } from '../../services/AuthContext';
import { recipeService } from '../../services/recipeService';
const HomeScreen = () => {
  const navigate = useNavigate();
  const { logout, currentUser, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0); 
  const [feedType, setFeedType] = useState('personalized'); 
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMeatType, setSelectedMeatType] = useState('all');
  const [selectedCookingTime, setSelectedCookingTime] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    'all', 'Asian', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 
    'American', 'French', 'Chinese', 'Japanese', 'Thai', 
    'Middle Eastern', 'Greek', 'Spanish', 'Korean', 'Vietnamese', 'Dessert'
  ];
  
  const meatTypes = [
    'all', 'Vegetarian', 'Vegan', 'Chicken', 'Beef', 'Pork', 
    'Fish', 'Seafood', 'Lamb', 'Turkey', 'Mixed'
  ];
  
  const cookingTimes = [
    { key: 'all', label: 'All Times' },
    { key: 'quick', label: 'Under 30 min', max: 30 },
    { key: 'medium', label: '30-60 min', min: 30, max: 60 },
    { key: 'long', label: '1-2 hours', min: 60, max: 120 },
    { key: 'very_long', label: 'Over 2 hours', min: 120 }
  ];

  const feedTypes = [
    { key: 'personalized', label: 'Following & Groups', icon: <FiUsers /> },
    { key: 'all', label: 'All Posts', icon: <FiGlobe /> },
    { key: 'following', label: 'Following Only', icon: <FiHeart /> }
  ];

  const loadUnreadChatCount = useCallback(async () => {
    try {
      const result = await chatService.getUnreadChatsCount();
      if (result.success) {
        setUnreadChatCount(result.count);
      }
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  }, []);

  const loadUnreadNotificationsCount = useCallback(async () => {
    try {
      const userId = currentUser?.id || currentUser?._id;
      if (userId) {
        const result = await notificationService.getUnreadCount(userId);
        if (result.success) {
          setUnreadNotificationsCount(result.count);
        }
      }
    } catch (error) {
      console.error('Load unread notifications count error:', error);
    }
  }, [currentUser]);

  const handleNavigateToNotifications = () => {
    navigate('/notifications');
  };

  const initializeChatService = useCallback(async () => {
    const userId = currentUser?.id || currentUser?._id;
    if (userId) {
      await chatService.initializeSocket(userId);
      loadUnreadChatCount();
    }
  }, [currentUser, loadUnreadChatCount]);

  const handleOpenChats = useCallback(() => {
    navigate('/chat-list');
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="home-loading-container">
        <div className="home-spinner"></div>
        <p className="home-loading-text">Loading...</p>
      </div>
    );
  } 

  const applyFiltersAndSort = useCallback((postsArray) => {
    let filtered = [...postsArray];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => 
        post.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedMeatType !== 'all') {
      filtered = filtered.filter(post => 
        post.meatType?.toLowerCase() === selectedMeatType.toLowerCase()
      );
    }

    if (selectedCookingTime !== 'all') {
      const timeFilter = cookingTimes.find(t => t.key === selectedCookingTime);
      if (timeFilter) {
        filtered = filtered.filter(post => {
          const cookTime = parseInt(post.prepTime) || parseInt(post.preparationTime) || parseInt(post.cookingTime) || 0;
          if (timeFilter.max && timeFilter.min) {
            return cookTime >= timeFilter.min && cookTime <= timeFilter.max;
          } else if (timeFilter.max) {
            return cookTime <= timeFilter.max;
          } else if (timeFilter.min) {
            return cookTime >= timeFilter.min;
          }
          return true;
        });
      }
    }

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  }, [selectedCategory, selectedMeatType, selectedCookingTime, sortBy]);

  useEffect(() => {
    const filtered = applyFiltersAndSort(posts);
    setFilteredPosts(filtered);
  }, [posts, applyFiltersAndSort]);

  const loadPosts = useCallback(async () => {
      try {
        const userId = currentUser?.id || currentUser?._id;
        
        if (!userId) {
          console.error('No user ID available - user probably logged out');
          setLoading(false);
          setRefreshing(false);
          const result = await recipeService.getAllRecipes();
          if (result.success) {
            const postsArray = Array.isArray(result.data) ? result.data : [];
            const formattedPosts = postsArray.map(post => ({
              ...post,
              _id: post._id || post.id,
              userName: post.userName || 'Anonymous',
              userAvatar: post.userAvatar || null,
              likes: Array.isArray(post.likes) ? post.likes : [],
              comments: Array.isArray(post.comments) ? post.comments : [],
              createdAt: post.createdAt || new Date().toISOString(),
              postSource: 'personal',
              groupName: null,
              isLiked: false
            }));
            setPosts(formattedPosts);
          }
          return;
        }

      let result;
      
      switch (feedType) {
        case 'personalized':
          console.log(' Loading personalized feed...');
          result = await recipeService.getFeed(userId);
          break;
          
        case 'following':
          console.log(' Loading following posts...');
          result = await recipeService.getFollowingPosts(userId);
          break;
          
        case 'all':
        default:
          console.log(' Loading all posts...');
          result = await recipeService.getAllRecipes();
          break;
      }
      
      if (result.success) {
        const postsArray = Array.isArray(result.data) ? result.data : [];
        
        const formattedPosts = postsArray.map(post => ({
          ...post,
          _id: post._id || post.id,
          userName: post.userName || post.user?.name || post.author?.name || 'Anonymous',
          userAvatar: post.userAvatar || post.user?.avatar || post.author?.avatar || null,
          likes: Array.isArray(post.likes) ? post.likes : [],
          comments: Array.isArray(post.comments) ? post.comments : [],
          createdAt: post.createdAt || post.created_at || new Date().toISOString(),
          postSource: post.groupId ? 'group' : 'personal',
          groupName: post.groupName || null,
          isLiked: post.likes ? post.likes.includes(userId) : false
        }));
        
        console.log(` Loaded ${formattedPosts.length} posts for feed type: ${feedType}`);
        setPosts(formattedPosts);
      } else {
        alert(`Failed to load posts: ${result.message}`);
      }
    } catch (error) {
      console.error(' Load posts error:', error);
      alert(`Failed to load posts: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feedType, currentUser]);

  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      loadPosts();
      loadUnreadNotificationsCount(); 
    } else {
      setPosts([]);
      setFilteredPosts([]);
      setLoading(false);
      setUnreadNotificationsCount(0); 
    }
  }, [currentUser, feedType, loadPosts, loadUnreadNotificationsCount]);

  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      initializeChatService();
    }
  }, [currentUser, initializeChatService]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
    loadUnreadChatCount();
    loadUnreadNotificationsCount(); 
  }, [loadPosts, loadUnreadChatCount, loadUnreadNotificationsCount]);

  const handleRefreshData = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        chatService.disconnect();
        logout();
      } catch (error) {
        alert('Failed to logout');
      }
    }
  }, [logout]);

  const handleNavigateToProfile = () => {
    navigate(`/profile?userId=${currentUser?.id || currentUser?._id}`);
  };

  const handleNavigateToSearch = () => {
    navigate('/search');
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedMeatType('all');
    setSelectedCookingTime('all');
    setSortBy('newest');
    setShowFilters(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedMeatType !== 'all') count++;
    if (selectedCookingTime !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  };

  const handlePostCreated = useCallback((newPost) => {
    handleRefreshData();
  }, [handleRefreshData]);

  const handlePostDelete = useCallback(async (postId) => {
  console.log(' handlePostDelete called with:', postId);
  
  try {
    console.log(' About to call recipeService.deleteRecipe...');
    
    const postToDelete = posts.find(p => (p._id || p.id) === postId);
    console.log(' Found post to delete:', postToDelete);
    
    if (!postToDelete) {
      console.error(' Post not found in posts array');
      alert('Post not found');
      return;
    }
    
    console.log(' Post data being sent:', {
      groupId: postToDelete.groupId,
      userId: currentUser?.id || currentUser?._id,
      isGroupPost: !!postToDelete.groupId,
      authorId: postToDelete.userId || postToDelete.authorId
    });
    
    console.log(' Calling recipeService.deleteRecipe NOW...');
    
    const result = await recipeService.deleteRecipe(postId, {
      groupId: postToDelete.groupId,
      userId: currentUser?.id || currentUser?._id,
      isGroupPost: !!postToDelete.groupId,
      authorId: postToDelete.userId || postToDelete.authorId
    });
    
    console.log(' Delete result:', result);
    
    if (result.success) {
      console.log(' Delete successful!');
      handleRefreshData();
      alert('Recipe deleted successfully');
    } else {
      console.log(' Delete failed:', result.message);
      alert(result.message || 'Failed to delete recipe');
    }
  } catch (error) {
    console.error(' Delete error:', error);
    alert('Failed to delete recipe');
  }
}, [posts, currentUser, handleRefreshData]); 

  const handleShare = useCallback((post) => {
    setSharePost(post);
    setShowShareModal(true);
  }, []);

  const handleSystemShare = useCallback(async (post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `Check out this amazing recipe: ${post.title}\n\n${post.description}`,
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`Check out this amazing recipe: ${post.title}\n\n${post.description}\n\n${window.location.href}`);
        alert('Recipe link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  }, []);

  const handleShareModalClose = useCallback(() => {
    setShowShareModal(false);
    setSharePost(null);
  }, []);

  const handleShareSubmit = useCallback((shareData) => {
    alert('Recipe shared successfully!');
    handleShareModalClose();
  }, [handleShareModalClose]);

  const renderFeedTypeSelector = () => (
    <div className="home-feed-type-container">
      <h3 className="home-feed-type-title">What would you like to see?</h3>
      <div className="home-feed-type-scroll">
        {feedTypes.map(type => (
          <button
            key={type.key}
            className={`home-feed-type-chip ${feedType === type.key ? 'active' : ''}`}
            onClick={() => setFeedType(type.key)}
          >
            {type.icon}
            <span className="home-feed-type-chip-text">
              {type.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFilters = () => (
    showFilters && (
      <div className="home-filters-container">
        <div className="home-filters-scroll">
          {/* Sort */}
          <div className="home-filter-group">
            <p className="home-filter-label">Sort:</p>
            <div className="home-filter-chips">
              {[
                { key: 'newest', label: 'Newest' },
                { key: 'oldest', label: 'Oldest' },
                { key: 'popular', label: 'Popular' }
              ].map(sort => (
                <button
                  key={sort.key}
                  className={`home-filter-chip ${sortBy === sort.key ? 'active' : ''}`}
                  onClick={() => setSortBy(sort.key)}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="home-filter-group">
            <p className="home-filter-label">Category:</p>
            <div className="home-filter-chips">
              {categories.map(category => (
                <button
                  key={category}
                  className={`home-filter-chip ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Meat Type */}
          <div className="home-filter-group">
            <p className="home-filter-label">Type:</p>
            <div className="home-filter-chips">
              {meatTypes.map(meatType => (
                <button
                  key={meatType}
                  className={`home-filter-chip ${selectedMeatType === meatType ? 'active' : ''}`}
                  onClick={() => setSelectedMeatType(meatType)}
                >
                  {meatType === 'all' ? 'All' : meatType}
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Time */}
          <div className="home-filter-group">
            <p className="home-filter-label">Prep Time:</p>
            <div className="home-filter-chips">
              {cookingTimes.map(time => (
                <button
                  key={time.key}
                  className={`home-filter-chip ${selectedCookingTime === time.key ? 'active' : ''}`}
                  onClick={() => setSelectedCookingTime(time.key)}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {getActiveFiltersCount() > 0 && (
          <button className="home-clear-filters-button" onClick={clearAllFilters}>
            <FiRefreshCw />
            <span>Clear All Filters</span>
          </button>
        )}

        {/* Search Stats */}
        <div className="home-search-stats">
          <p className="home-search-stats-text">
            {getActiveFiltersCount() > 0 ? `${filteredPosts.length} recipes found` : `${posts.length} total recipes`}
          </p>
        </div>
      </div>
    )
  );

  const renderCreatePost = useCallback(() => (
    <div className="home-create-post-container">
      <div className="home-create-post-header">
        <UserAvatar
          uri={currentUser?.avatar || currentUser?.userAvatar}
          name={currentUser?.fullName || currentUser?.name}
          size={40}
          onPress={handleNavigateToProfile}
        />
        <button 
          className="home-create-post-input"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="home-create-post-placeholder">
            What delicious recipe will you share today?
          </span>
        </button>
      </div>
      
      <div className="home-create-post-actions">
        <button 
          className="home-create-post-button"
          onClick={() => setShowCreateModal(true)}
        >
          <MdRestaurant />
          <span>Recipe</span>
        </button>
        
        <button 
          className="home-create-post-button"
          onClick={() => setShowCreateModal(true)}
        >
          <FiCamera />
          <span>Photo</span>
        </button>
      </div>
    </div>
  ), [currentUser, handleNavigateToProfile]);

  const renderPost = useCallback((post, index) => {
  return (
    <div key={post._id || post.id || index} className="home-post-container">
      {post.postSource === 'group' && post.groupName && (
        <div className="home-post-source-label">
          <MdChatBubble />
          <span className="home-post-source-text">from {post.groupName}</span>
        </div>
      )}
      
      <PostComponent
        post={post || {}}
        navigation={{ navigate }}
        onDelete={handlePostDelete}
        onShare={() => handleSystemShare(post)}
        onShareCustom={() => handleShare(post)}  
        onRefreshData={handleRefreshData}
      />
    </div>
  );
}, [handlePostDelete, handleSystemShare, handleShare, handleRefreshData, navigate]);

  const renderEmptyComponent = useCallback(() => (
    !loading && (
      <div className="home-empty-container">
        <div className="home-empty-icon">
          {getActiveFiltersCount() > 0 ? <FiFilter size={80} /> :
           feedType === 'personalized' ? <FiUsers size={80} /> :
           feedType === 'following' ? <FiHeart size={80} /> : <MdRestaurant size={80} />}
        </div>
        <h2 className="home-empty-title">
          {getActiveFiltersCount() > 0 ? 'No Recipes Found' :
           feedType === 'personalized' ? 'Your Feed is Empty' :
           feedType === 'following' ? 'No Posts from Following' : 'No Recipes Yet!'}
        </h2>
        <p className="home-empty-subtitle">
          {getActiveFiltersCount() > 0
            ? 'No recipes match your filter criteria. Try adjusting your filters.'
            : feedType === 'personalized'
            ? 'Follow some chefs or join groups to see their amazing recipes here!'
            : feedType === 'following'
            ? 'Follow some amazing chefs to see their recipes in your feed.'
            : 'Be the first to share your amazing recipe with the FlavorWorld community'
          }
        </p>
        {(getActiveFiltersCount() === 0 && feedType !== 'following' && feedType !== 'groups') && (
          <button 
            className="home-empty-button"
            onClick={() => setShowCreateModal(true)}
          >
            Share Recipe
          </button>
        )}
        {feedType === 'following' && (
          <button 
            className="home-empty-button"
            onClick={handleNavigateToSearch}
          >
            Find Chefs to Follow
          </button>
        )}
      </div>
    )
  ), [loading, getActiveFiltersCount, feedType, handleNavigateToSearch]);

  const renderLoader = useCallback(() => (
    loading && (
      <div className="home-loader-container">
        <div className="home-spinner"></div>
        <p className="home-loader-text">
          {feedType === 'personalized' ? 'Loading your personalized feed...' :
           feedType === 'following' ? 'Loading posts from chefs you follow...' : 'Loading delicious recipes...'}
        </p>
      </div>
    )
  ), [loading, feedType]);

  return (
    <div className="home-container">
      {/* Header */}
      <div className="home-header">
        <h1 className="home-header-title">FlavorWorld</h1>
        <div className="home-header-buttons">
          {/* Search Button */}
          <button 
            className="home-header-button"
            onClick={handleNavigateToSearch}
          >
            <FiSearch />
          </button>
          
          {/* Filter Button */}
          <button 
            className={`home-header-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            {getActiveFiltersCount() > 0 && (
              <div className="home-filter-badge">
                <span>{getActiveFiltersCount()}</span>
              </div>
            )}
          </button>
          
          {/* Logout Button */}
          <button className="home-logout-button" onClick={handleLogout}>
            <FiLogOut />
          </button>
        </div>
      </div>
      
      {/* Feed Type Selector */}
      {renderFeedTypeSelector()}
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Main Content */}
      <div className="home-main-content">
        {!showFilters && renderCreatePost()}
        
        {filteredPosts.length === 0 ? renderEmptyComponent() : (
          <div className="home-posts-list">
            {filteredPosts.map((post, index) => renderPost(post, index))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="home-bottom-navigation">
        <button 
          className="home-bottom-nav-item"
          onClick={handleNavigateToNotifications}
        >
          <div className="home-bottom-nav-icon">
            <FiBell />
            {unreadNotificationsCount > 0 && (
              <div className="home-notification-badge">
                <span>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              </div>
            )}
          </div>
          <span className="home-bottom-nav-label">Notifications</span>
        </button>

        <button 
          className="home-bottom-nav-item"
          onClick={handleNavigateToProfile}
        >
          <div className="home-bottom-nav-icon-profile">
            <UserAvatar
              uri={currentUser?.avatar || currentUser?.userAvatar}
              name={currentUser?.fullName || currentUser?.name}
              size={28}
            />
          </div>
          <span className="home-bottom-nav-label">Profile</span>
        </button>

        <button 
          className="home-bottom-nav-item"
          onClick={handleOpenChats}
        >
          <div className="home-bottom-nav-icon-chat">
            <FiMessageCircle />
            {unreadChatCount > 0 && (
              <div className="home-chat-badge">
                <span>
                  {unreadChatCount > 99 ? '99+' : unreadChatCount}
                </span>
              </div>
            )}
          </div>
          <span className="home-bottom-nav-label active">Messages</span>
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="home-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="home-modal-container" onClick={e => e.stopPropagation()}>
            <div className="home-modal-header">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="home-modal-close-button"
              >
                <FiX />
              </button>
              <h2 className="home-modal-title">Share Recipe</h2>
              <div className="home-modal-placeholder" />
            </div>
            
            <CreatePostComponent
              currentUser={currentUser}
              onPostCreated={(newPost) => {
                handlePostCreated(newPost);
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharePost && (
        <SharePostComponent
          visible={showShareModal}
          onClose={handleShareModalClose}
          post={sharePost}
          onShare={handleShareSubmit}
          currentUserId={currentUser?.id}
          navigation={{ navigate }}
        />
      )}

      {/* Loading Overlay */}
      {renderLoader()}
      
      {/* Refresh Button */}
      {refreshing && (
        <div className="home-refresh-overlay">
          <div className="home-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;