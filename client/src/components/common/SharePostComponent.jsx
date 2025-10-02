import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Send,
  Users,
  User,
  Loader2,
  Check
} from 'lucide-react';
import './SharePostComponent.css';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import UserAvatar from './UserAvatar';

const SharePostComponent = ({
  visible,
  onClose,
  post,
  onShare,
  currentUserId,
  navigation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');

  useEffect(() => {
    if (visible && currentUserId) {
      loadData();
    }
  }, [visible, currentUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsResult, groupsResult] = await Promise.all([
        userService.getFriends(currentUserId),
        groupService.getUserGroups(currentUserId)
      ]);

      if (friendsResult?.success) {
        setFriends(friendsResult.data || []);
      }

      if (groupsResult?.success) {
        setGroups(groupsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading share data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleToggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleShare = async () => {
    if (selectedFriends.length === 0 && selectedGroups.length === 0) {
      alert('Please select at least one friend or group');
      return;
    }

    setSharing(true);

    try {
      const shareData = {
        postId: post._id || post.id,
        friends: selectedFriends,
        groups: selectedGroups,
        userId: currentUserId
      };

      onShare?.(shareData);
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!visible) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <h2>Share Recipe</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Post Preview */}
        <div className="share-post-preview">
          {post.image && (
            <img src={post.image} alt={post.title} />
          )}
          <div className="share-post-info">
            <h3>{post.title}</h3>
            <p>{post.description?.substring(0, 100)}...</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="share-tabs">
          <button
            className={`share-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <User size={18} />
            <span>Friends</span>
            {selectedFriends.length > 0 && (
              <span className="tab-badge">{selectedFriends.length}</span>
            )}
          </button>
          <button
            className={`share-tab ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <Users size={18} />
            <span>Groups</span>
            {selectedGroups.length > 0 && (
              <span className="tab-badge">{selectedGroups.length}</span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="share-search">
          <Search size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="share-content">
          {loading ? (
            <div className="share-loading">
              <Loader2 className="spinner" size={32} />
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'friends' && (
                <div className="share-list">
                  {filteredFriends.length === 0 ? (
                    <div className="share-empty">
                      <User size={48} />
                      <p>No friends found</p>
                    </div>
                  ) : (
                    filteredFriends.map(friend => (
                      <div
                        key={friend._id || friend.id}
                        className={`share-item ${
                          selectedFriends.includes(friend._id || friend.id) ? 'selected' : ''
                        }`}
                        onClick={() => handleToggleFriend(friend._id || friend.id)}
                      >
                        <UserAvatar
                          uri={friend.avatar || friend.userAvatar}
                          name={friend.name || friend.fullName}
                          size={40}
                        />
                        <div className="share-item-info">
                          <h4>{friend.name || friend.fullName}</h4>
                        </div>
                        {selectedFriends.includes(friend._id || friend.id) && (
                          <div className="share-check">
                            <Check size={20} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'groups' && (
                <div className="share-list">
                  {filteredGroups.length === 0 ? (
                    <div className="share-empty">
                      <Users size={48} />
                      <p>No groups found</p>
                    </div>
                  ) : (
                    filteredGroups.map(group => (
                      <div
                        key={group._id || group.id}
                        className={`share-item ${
                          selectedGroups.includes(group._id || group.id) ? 'selected' : ''
                        }`}
                        onClick={() => handleToggleGroup(group._id || group.id)}
                      >
                        <div className="group-avatar">
                          <Users size={24} />
                        </div>
                        <div className="share-item-info">
                          <h4>{group.name}</h4>
                          <span>{group.members?.length || 0} members</span>
                        </div>
                        {selectedGroups.includes(group._id || group.id) && (
                          <div className="share-check">
                            <Check size={20} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="share-btn"
            onClick={handleShare}
            disabled={
              sharing ||
              (selectedFriends.length === 0 && selectedGroups.length === 0)
            }
          >
            {sharing ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Sharing...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>
                  Share ({selectedFriends.length + selectedGroups.length})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostComponent;