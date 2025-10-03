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
import './FollowersScreen.css';
import { useAuth } from '../../services/AuthContext';
import { followService } from '../../services/followService';
import { chatService } from '../../services/chatServices';
import UserAvatar from '../../components/common/UserAvatar';

const FollowersScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const { currentUser } = useAuth();
  
  const [followers, setFollowers] = useState([]);
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingUserId, setRemovingUserId] = useState(null);

  const isOwnProfile = !userId || userId === (currentUser?.id || currentUser?._id);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  useEffect(() => {
    filterFollowers();
  }, [searchQuery, followers]);

  const loadFollowers = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser?.id || currentUser?._id;
      
      const result = await followService.getFollowers(targetUserId);
      
      if (result.success) {
        setFollowers(result.data || []);
      } else {
        alert(result.message || 'Failed to load followers');
      }
    } catch (error) {
      console.error('Load followers error:', error);
      alert('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const filterFollowers = () => {
    if (!searchQuery.trim()) {
      setFilteredFollowers(followers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = followers.filter(follower => {
      const name = (follower.name || follower.fullName || '').toLowerCase();
      const bio = (follower.bio || '').toLowerCase();
      return name.includes(query) || bio.includes(query);
    });

    setFilteredFollowers(filtered);
  };

  const handleRemoveFollower = async (followerId, followerName) => {
    if (!isOwnProfile) return;

    if (window.confirm(`Remove ${followerName} from your followers?`)) {
      setRemovingUserId(followerId);
      try {
        const result = await followService.removeFollower(
          currentUser?.id || currentUser?._id,
          followerId
        );
        
        if (result.success) {
          alert(`${followerName} has been removed from your followers`);
          loadFollowers();
        } else {
          alert(result.message || 'Failed to remove follower');
        }
      } catch (error) {
        console.error('Remove follower error:', error);
        alert('Failed to remove follower');
      } finally {
        setRemovingUserId(null);
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
      <div className="followers-screen">
        <header className="followers-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Followers</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading followers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="followers-screen">
      {/* Header */}
      <header className="followers-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Followers ({filteredFollowers.length})</h1>
        <div className="header-placeholder" />
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search followers..."
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

      {/* Followers List */}
      <div className="followers-list">
        {filteredFollowers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{searchQuery ? 'No followers found' : 'No followers yet'}</h3>
            <p>
              {searchQuery 
                ? `No followers match "${searchQuery}"`
                : isOwnProfile 
                  ? 'When people follow you, they will appear here'
                  : 'This user has no followers yet'
              }
            </p>
          </div>
        ) : (
          filteredFollowers.map((follower) => {
            const followerId = follower._id || follower.id;
            const followerName = follower.name || follower.fullName || 'Unknown User';
            const followerBio = follower.bio || '';
            const isCurrentUser = followerId === (currentUser?.id || currentUser?._id);

            return (
              <div key={followerId} className="follower-item">
                <div 
                  className="follower-main"
                  onClick={() => !isCurrentUser && navigate(`/profile?userId=${followerId}`)}
                  style={{ cursor: isCurrentUser ? 'default' : 'pointer' }}
                >
                  <UserAvatar
                    uri={follower.avatar || follower.profileImage}
                    name={followerName}
                    size={50}
                  />
                  
                  <div className="follower-info">
                    <h3>
                      {followerName}
                      {isCurrentUser && ' (You)'}
                    </h3>
                    {followerBio && <p className="follower-bio">{followerBio}</p>}
                  </div>
                </div>

                {!isCurrentUser && (
                  <div className="follower-actions">
                    <button
                      className="message-btn"
                      onClick={() => handleStartChat(follower)}
                      title="Send Message"
                    >
                      <MessageCircle size={18} />
                    </button>
                    
                    {isOwnProfile && (
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveFollower(followerId, followerName)}
                        disabled={removingUserId === followerId}
                        title="Remove Follower"
                      >
                        {removingUserId === followerId ? (
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

export default FollowersScreen;