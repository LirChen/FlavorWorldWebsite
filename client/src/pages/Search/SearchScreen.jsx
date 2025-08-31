import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  Search, 
  X, 
  Clock, 
  ChevronRight, 
  Users, 
  Lock,
  User,
  ChefHat
} from 'lucide-react';

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

// Mock services for demo
const mockServices = {
  recipeService: {
    getAllRecipes: async () => ({
      success: true,
      data: [
        {
          _id: '1',
          title: 'Spaghetti Carbonara',
          description: 'Classic Italian pasta dish',
          ingredients: 'pasta, eggs, bacon, cheese',
          category: 'Italian',
          userName: 'Chef Mario',
          userAvatar: 'https://images.unsplash.com/photo-1566554273541-37a9ca77b91d?w=100&h=100&fit=crop&crop=face',
          imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop'
        },
        {
          _id: '2',
          title: 'Chicken Tikka Masala',
          description: 'Creamy Indian curry',
          ingredients: 'chicken, tomatoes, cream, spices',
          category: 'Indian',
          userName: 'Priya K',
          userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop'
        }
      ]
    })
  },
  userService: {
    searchUsers: async (query, currentUserId) => [
      {
        userId: 'user1',
        userName: 'Alice Johnson',
        userEmail: 'alice@example.com',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        userBio: 'Home cook and food enthusiast'
      },
      {
        userId: 'user2',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        userBio: 'Professional chef'
      }
    ]
  },
  groupService: {
    searchGroups: async (query, currentUserId) => ({
      success: true,
      data: [
        {
          _id: 'group1',
          name: 'Italian Cuisine Lovers',
          description: 'Share your favorite Italian recipes',
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop',
          membersCount: 245,
          category: 'Italian',
          isPrivate: false
        },
        {
          _id: 'group2',
          name: 'Baking Masters',
          description: 'Advanced baking techniques and recipes',
          image: null,
          membersCount: 156,
          category: 'Baking',
          isPrivate: true
        }
      ]
    })
  }
};

// Mock components
const PostComponent = ({ post, onNavigate }) => (
  <div className="post-item" onClick={() => onNavigate('recipe', post._id)}>
    <div className="post-image">
      <img src={post.imageUrl} alt={post.title} />
    </div>
    <div className="post-content">
      <h3 className="post-title">{post.title}</h3>
      <p className="post-description">{post.description}</p>
      <div className="post-meta">
        <span className="post-author">by {post.userName}</span>
        <span className="post-category">{post.category}</span>
      </div>
    </div>
  </div>
);

const UserAvatar = ({ uri, name, size = 50 }) => (
  <div className="user-avatar" style={{ width: size, height: size }}>
    {uri ? (
      <img src={uri} alt={name} />
    ) : (
      <div className="avatar-placeholder">
        <User size={size * 0.6} color={FLAVORWORLD_COLORS.textLight} />
      </div>
    )}
  </div>
);

const SearchScreen = ({ 
  currentUser = { id: 'current-user', name: 'Current User' },
  onNavigate = (type, id) => console.log(`Navigate to ${type}:`, id),
  onBack = () => console.log('Go back')
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    groups: []
  });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['pasta', 'chicken curry', 'desserts']);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults({ posts: [], users: [], groups: [] });
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      console.log('Searching for:', searchQuery);
      
      const [postsResult, usersResult, groupsResult] = await Promise.all([
        searchPosts(),
        searchUsers(),
        searchGroups()
      ]);

      setSearchResults({
        posts: postsResult || [],
        users: usersResult || [],
        groups: groupsResult || []
      });

      addToRecentSearches(searchQuery);
      
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async () => {
    try {
      const result = await mockServices.recipeService.getAllRecipes();
      if (result.success) {
        const query = searchQuery.toLowerCase();
        return result.data.filter(post => 
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query) ||
          post.ingredients?.toLowerCase().includes(query) ||
          post.category?.toLowerCase().includes(query) ||
          post.userName?.toLowerCase().includes(query)
        );
      }
    } catch (error) {
      console.error('Search posts error:', error);
    }
    return [];
  };

  const searchUsers = async () => {
    try {
      console.log('Searching users for:', searchQuery);
      
      const users = await mockServices.userService.searchUsers(searchQuery, currentUser?.id);
      
      if (users && users.length > 0) {
        console.log('Found users:', users.length);
        
        return users.map(user => ({
          _id: user.userId,
          id: user.userId,
          fullName: user.userName,
          name: user.userName,
          email: user.userEmail,
          avatar: user.userAvatar,
          bio: user.userBio
        }));
      } else {
        console.log('No users found');
        return [];
      }
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  };

  const searchGroups = async () => {
    try {
      const result = await mockServices.groupService.searchGroups(searchQuery, currentUser?.id);
      
      if (result.success) {
        console.log('Groups search results:', result.data.length);
        return result.data;
      }
    } catch (error) {
      console.error('Search groups error:', error);
    }
    return [];
  };

  const addToRecentSearches = (query) => {
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(item => item !== query)].slice(0, 5);
      return updated;
    });
  };

  const handleRecentSearch = (query) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ posts: [], users: [], groups: [] });
  };

  const renderTabBar = () => (
    <div className="tab-container">
      {[
        { key: 'all', label: 'All', count: searchResults.posts.length + searchResults.users.length + searchResults.groups.length },
        { key: 'posts', label: 'Recipes', count: searchResults.posts.length },
        { key: 'users', label: 'Users', count: searchResults.users.length },
        { key: 'groups', label: 'Groups', count: searchResults.groups.length }
      ].map(tab => (
        <button
          key={tab.key}
          className={`tab ${selectedTab === tab.key ? 'active-tab' : ''}`}
          onClick={() => setSelectedTab(tab.key)}
        >
          <span className={`tab-text ${selectedTab === tab.key ? 'active-tab-text' : ''}`}>
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </span>
        </button>
      ))}
    </div>
  );

  const renderUser = (item) => (
    <div 
      key={item.id || item._id}
      className="user-item"
      onClick={() => onNavigate('profile', item.id || item._id)}
    >
      <UserAvatar
        uri={item.avatar}
        name={item.fullName || item.name}
        size={50}
      />
      <div className="user-info">
        <div className="user-name">{item.fullName || item.name}</div>
        <div className="user-email">{item.email}</div>
        {item.bio && <div className="user-bio">{item.bio}</div>}
      </div>
      <ChevronRight size={20} color={FLAVORWORLD_COLORS.textLight} />
    </div>
  );

  const renderGroup = (item) => (
    <div 
      key={item._id}
      className="group-item"
      onClick={() => onNavigate('group', item._id)}
    >
      <div className="group-image-container">
        {item.image ? (
          <img src={item.image} alt={item.name} className="group-image" />
        ) : (
          <div className="placeholder-group-image">
            <Users size={24} color={FLAVORWORLD_COLORS.textLight} />
          </div>
        )}
      </div>
      
      <div className="group-info">
        <div className="group-name">{item.name}</div>
        <div className="group-description">
          {item.description || 'No description'}
        </div>
        <div className="group-meta">
          <span className="group-meta-text">{item.membersCount} members</span>
          <span className="group-meta-text">•</span>
          <span className="group-meta-text">{item.category}</span>
          {item.isPrivate && (
            <>
              <span className="group-meta-text">•</span>
              <Lock size={12} color={FLAVORWORLD_COLORS.textLight} />
            </>
          )}
        </div>
      </div>
      
      <ChevronRight size={20} color={FLAVORWORLD_COLORS.textLight} />
    </div>
  );

  const renderRecentSearches = () => (
    <div className="recent-searches">
      <h2 className="section-title">Recent Searches</h2>
      {recentSearches.map((search, index) => (
        <div
          key={index}
          className="recent-item"
          onClick={() => handleRecentSearch(search)}
        >
          <Clock size={16} color={FLAVORWORLD_COLORS.textLight} />
          <span className="recent-text">{search}</span>
        </div>
      ))}
    </div>
  );

  const getFilteredResults = () => {
    switch (selectedTab) {
      case 'posts':
        return searchResults.posts;
      case 'users':
        return searchResults.users;
      case 'groups':
        return searchResults.groups;
      default:
        return [
          ...searchResults.posts.map(item => ({ ...item, type: 'post' })),
          ...searchResults.users.map(item => ({ ...item, type: 'user' })),
          ...searchResults.groups.map(item => ({ ...item, type: 'group' }))
        ];
    }
  };

  const renderSearchResults = () => {
    const results = getFilteredResults();
    
    if (results.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="search-results">
        {results.map((item, index) => {
          const key = item._id || item.id || index;
          
          if (selectedTab === 'all') {
            switch (item.type) {
              case 'post':
                return <PostComponent key={key} post={item} onNavigate={onNavigate} />;
              case 'user':
                return renderUser(item);
              case 'group':
                return renderGroup(item);
              default:
                return null;
            }
          } else {
            switch (selectedTab) {
              case 'posts':
                return <PostComponent key={key} post={item} onNavigate={onNavigate} />;
              case 'users':
                return renderUser(item);
              case 'groups':
                return renderGroup(item);
              default:
                return null;
            }
          }
        })}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <Search size={80} color={FLAVORWORLD_COLORS.textLight} />
      <h2 className="empty-title">
        {searchQuery ? 'No Results Found' : 'Start Searching'}
      </h2>
      <p className="empty-subtitle">
        {searchQuery 
          ? `No results found for "${searchQuery}". Try different keywords.`
          : 'Search for recipes, users, or cooking groups'
        }
      </p>
    </div>
  );

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={24} color={FLAVORWORLD_COLORS.accent} />
        </button>
        
        <div className="search-container">
          <Search size={20} color={FLAVORWORLD_COLORS.textLight} />
          <input
            className="search-input"
            placeholder="Search recipes, users, groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <button className="clear-button" onClick={clearSearch}>
              <X size={20} color={FLAVORWORLD_COLORS.textLight} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {searchQuery.trim().length === 0 ? (
        <div className="content">
          {recentSearches.length > 0 && renderRecentSearches()}
          {renderEmptyState()}
        </div>
      ) : (
        <div className="search-content">
          {renderTabBar()}
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Searching...</p>
            </div>
          ) : (
            renderSearchResults()
          )}
        </div>
      )}

      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: ${FLAVORWORLD_COLORS.background};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background-color: ${FLAVORWORLD_COLORS.white};
          border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
          gap: 12px;
        }

        .back-button {
          padding: 8px;
          background-color: ${FLAVORWORLD_COLORS.background};
          border: none;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-button:hover {
          background-color: ${FLAVORWORLD_COLORS.border};
        }

        .search-container {
          flex: 1;
          display: flex;
          align-items: center;
          background-color: ${FLAVORWORLD_COLORS.background};
          border-radius: 20px;
          padding: 12px 16px;
          border: 1px solid ${FLAVORWORLD_COLORS.border};
          gap: 8px;
        }

        .search-input {
          flex: 1;
          font-size: 16px;
          color: ${FLAVORWORLD_COLORS.text};
          border: none;
          background: transparent;
          outline: none;
        }

        .search-input::placeholder {
          color: ${FLAVORWORLD_COLORS.textLight};
        }

        .clear-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .content {
          flex: 1;
          padding: 16px;
        }

        .search-content {
          flex: 1;
        }

        .tab-container {
          display: flex;
          background-color: ${FLAVORWORLD_COLORS.white};
          border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
        }

        .tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover {
          background-color: ${FLAVORWORLD_COLORS.background};
        }

        .active-tab {
          border-bottom-color: ${FLAVORWORLD_COLORS.primary};
        }

        .tab-text {
          font-size: 14px;
          font-weight: 500;
          color: ${FLAVORWORLD_COLORS.textLight};
          transition: color 0.2s ease;
        }

        .active-tab-text {
          color: ${FLAVORWORLD_COLORS.primary};
          font-weight: 600;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid ${FLAVORWORLD_COLORS.border};
          border-top: 4px solid ${FLAVORWORLD_COLORS.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          margin-top: 16px;
          font-size: 16px;
          color: ${FLAVORWORLD_COLORS.textLight};
        }

        .search-results {
          flex: 1;
        }

        .user-item {
          display: flex;
          align-items: center;
          background-color: ${FLAVORWORLD_COLORS.white};
          padding: 12px 16px;
          border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .user-item:hover {
          background-color: ${FLAVORWORLD_COLORS.background};
        }

        .user-avatar {
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background-color: ${FLAVORWORLD_COLORS.background};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-info {
          flex: 1;
          margin-left: 12px;
        }

        .user-name {
          font-size: 16px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          margin-bottom: 2px;
        }

        .user-email {
          font-size: 14px;
          color: ${FLAVORWORLD_COLORS.textLight};
          margin-bottom: 2px;
        }

        .user-bio {
          font-size: 12px;
          color: ${FLAVORWORLD_COLORS.textLight};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-item {
          display: flex;
          align-items: center;
          background-color: ${FLAVORWORLD_COLORS.white};
          padding: 12px 16px;
          border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .group-item:hover {
          background-color: ${FLAVORWORLD_COLORS.background};
        }

        .group-image-container {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .group-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-group-image {
          width: 100%;
          height: 100%;
          background-color: ${FLAVORWORLD_COLORS.background};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .group-info {
          flex: 1;
          margin-left: 12px;
        }

        .group-name {
          font-size: 16px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          margin-bottom: 2px;
        }

        .group-description {
          font-size: 14px;
          color: ${FLAVORWORLD_COLORS.textLight};
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .group-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .group-meta-text {
          font-size: 12px;
          color: ${FLAVORWORLD_COLORS.textLight};
        }

        .post-item {
          display: flex;
          background-color: ${FLAVORWORLD_COLORS.white};
          margin-bottom: 12px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .post-item:hover {
          transform: translateY(-2px);
        }

        .post-image {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .post-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-content {
          flex: 1;
          padding: 16px;
        }

        .post-title {
          font-size: 16px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          margin: 0 0 8px 0;
        }

        .post-description {
          font-size: 14px;
          color: ${FLAVORWORLD_COLORS.textLight};
          margin: 0 0 12px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .post-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .post-author {
          font-size: 12px;
          color: ${FLAVORWORLD_COLORS.textLight};
        }

        .post-category {
          font-size: 12px;
          color: ${FLAVORWORLD_COLORS.primary};
          font-weight: 500;
        }

        .recent-searches {
          background-color: ${FLAVORWORLD_COLORS.white};
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: ${FLAVORWORLD_COLORS.text};
          margin: 0 0 12px 0;
        }

        .recent-item {
          display: flex;
          align-items: center;
          padding: 8px 0;
          cursor: pointer;
          gap: 8px;
        }

        .recent-item:hover {
          background-color: ${FLAVORWORLD_COLORS.background};
          margin: 0 -8px;
          padding: 8px;
          border-radius: 8px;
        }

        .recent-text {
          font-size: 16px;
          color: ${FLAVORWORLD_COLORS.text};
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 40px;
          text-align: center;
        }

        .empty-title {
          font-size: 20px;
          font-weight: bold;
          color: ${FLAVORWORLD_COLORS.text};
          margin: 16px 0 8px 0;
        }

        .empty-subtitle {
          font-size: 16px;
          color: ${FLAVORWORLD_COLORS.textLight};
          line-height: 1.4;
          margin: 0;
        }

        @media (max-width: 768px) {
          .header {
            padding: 8px 12px;
          }

          .content {
            padding: 12px;
          }

          .post-item {
            flex-direction: column;
          }

          .post-image {
            width: 100%;
            height: 200px;
          }

          .tab-text {
            font-size: 12px;
          }

          .user-info, .group-info {
            margin-left: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchScreen;