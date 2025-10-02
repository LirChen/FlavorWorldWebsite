import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  Loader2,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import './UserSearchScreen.css';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { chatService } from '../../services/chatServices';

const UserSearchScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      const timeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
      
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setLoading(true);
      const result = await chatService.searchUsers(query);
      
      if (result.success) {
        setSearchResults(result.data || []);
      } else {
        console.error('Search error:', result.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search users error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const startPrivateChat = async (user) => {
    try {
      setCreating(true);
      
      const result = await chatService.getOrCreatePrivateChat(user.userId);
      
      if (result.success) {
        const otherUser = {
          userId: user.userId,
          userName: user.userName,
          userAvatar: user.userAvatar,
        };
        
        navigate(`/chat/${result.data._id}`, {
          state: { otherUser }
        });
      } else {
        alert(result.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create private chat error:', error);
      alert('Problem creating chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="user-search-screen">
      {/* Header */}
      <header className="search-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Search Users</h1>
        <div className="header-placeholder" />
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <button onClick={() => setSearchQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="search-content">
        {loading && (
          <div className="loading-container">
            <Loader2 className="spinner" size={40} />
            <p>Searching users...</p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="results-list">
            {searchResults.map((user) => (
              <div
                key={user.userId}
                className="user-item"
                onClick={() => !creating && startPrivateChat(user)}
              >
                <UserAvatar
                  uri={user.userAvatar}
                  name={user.userName}
                  size={50}
                />

                <div className="user-info">
                  <h3>{user.userName}</h3>
                  <p>{user.userEmail}</p>
                  {user.userBio && <span>{user.userBio}</span>}
                </div>

                <button className="action-btn">
                  <MessageCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && searchQuery.trim().length === 0 && (
          <div className="empty-state">
            <Search size={80} />
            <h2>Search for Users</h2>
            <p>Type at least 2 characters to start searching</p>
          </div>
        )}

        {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="empty-state">
            <Search size={80} />
            <h2>No Users Found</h2>
            <p>No users found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Creating Overlay */}
      {creating && (
        <div className="creating-overlay">
          <div className="creating-modal">
            <Loader2 className="spinner" size={40} />
            <p>Creating chat...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearchScreen;