import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  Loader2,
  UserMinus,
  MessageCircle
} from 'lucide-react';
import './FollowingScreen.css';
import { useAuth } from '../../services/AuthContext';
import { followService } from '../../services/followService';
import { chatService } from '../../services/chatServices';
import UserAvatar from '../../components/common/UserAvatar';

const FollowingScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { currentUser } = useAuth();
  
  const [following, setFollowing] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unfollowingUserId, setUnfollowingUserId] = useState(null);

  const isOwnProfile = !userId || userId === (currentUser?.id || currentUser?._id);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  useEffect(() => {
    filterFollowing();
  }, [searchQuery, following]);

  const loadFollowing = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?.id || currentUser?._id;
      
      const result = await followService.getFollowing(targetUserId);
      
      if (result.success) {
        setFollowing(result.data || []);
      } else {
        alert(result.message || 'Failed to load following');
      }
    } catch (error) {
      console.error('Load following error:', error);
      alert('Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  const filterFollowing = () => {
    if (!searchQuery.trim()) {
      setFilteredFollowing(following);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = following.filter(user => {
      const name = (user.name || user.fullName || '').toLowerCase();
      const bio = (user.bio || '').toLowerCase();
      return name.includes(query) || bio.includes(query);
    });

    setFilteredFollowing(filtered);
  };

  const handleUnfollow = async (followingUserId, followingUserName) => {
    if (!isOwnProfile) return;

    if (window.confirm(`Unfollow ${followingUserName}?`)) {
      setUnfollowingUserId(followingUserId);
      try {
        const result = await followService.unfollowUser(followingUserId);
        
        if (result.success) {
          alert(`You unfollowed ${followingUserName}`);
          loadFollowing();
        } else {
          alert(result.message || 'Failed to unfollow');
        }
      } catch (error) {
        console.error('Unfollow error:', error);
        alert('Failed to unfollow');
      } finally {
        setUnfollowingUserId(null);
      }
    }
  };

  const handleStartChat = async (user) => {
    try {
      const result = await chatService.getOrCreatePrivateChat(user._id || user.id);
      
      if (result.success) {
        navigate(`/chat/${result.data._id}`, {
          state: {
            otherUser: {
              userId: user._id || user.id,
              userName: user.name || user.fullName,
              userAvatar: user.avatar || user.profileImage
            }
          }
        });
      } else {
        alert(result.message || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Create chat error:', error);
      alert('Failed to create chat');
    }
  };

  if (loading) {
    return (
      <div className="following-screen">
        <header className="following-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Following</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading following...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="following-screen">
      {/* Header */}
      <header className="following-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Following ({filteredFollowing.length})</h1>
        <div className="header-placeholder" />
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search following..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Following List */}
      <div className="following-list">
        {filteredFollowing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{searchQuery ? 'No users found' : 'Not following anyone yet'}</h3>
            <p>
              {searchQuery 
                ? `No users match "${searchQuery}"`
                : isOwnProfile 
                  ? 'Start following people to see their content here'
                  : 'This user is not following anyone yet'
              }
            </p>
          </div>
        ) : (
          filteredFollowing.map((user) => {
            const followingUserId = user._id || user.id;
            const followingUserName = user.name || user.fullName || 'Unknown User';
            const followingUserBio = user.bio || '';
            const isCurrentUser = followingUserId === (currentUser?.id || currentUser?._id);

            return (
              <div key={followingUserId} className="following-item">
                <div 
                  className="following-main"
                  onClick={() => !isCurrentUser && navigate(`/profile?userId=${followingUserId}`)}
                  style={{ cursor: isCurrentUser ? 'default' : 'pointer' }}
                >
                  <UserAvatar
                    uri={user.avatar || user.profileImage}
                    name={followingUserName}
                    size={50}
                  />
                  
                  <div className="following-info">
                    <h3>
                      {followingUserName}
                      {isCurrentUser && ' (You)'}
                    </h3>
                    {followingUserBio && <p className="following-bio">{followingUserBio}</p>}
                  </div>
                </div>

                {!isCurrentUser && (
                  <div className="following-actions">
                    <button
                      className="message-btn"
                      onClick={() => handleStartChat(user)}
                      title="Send Message"
                    >
                      <MessageCircle size={18} />
                    </button>
                    
                    {isOwnProfile && (
                      <button
                        className="unfollow-btn"
                        onClick={() => handleUnfollow(followingUserId, followingUserName)}
                        disabled={unfollowingUserId === followingUserId}
                        title="Unfollow"
                      >
                        {unfollowingUserId === followingUserId ? (
                          <Loader2 className="spinner" size={18} />
                        ) : (
                          <UserMinus size={18} />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FollowingScreen;