import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import './GroupsScreen.css';
import UserAvatar from '../../components/common/UserAvatar';
import CreateGroupComponent from './CreateGroupComponent';

const GroupsScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('my'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const result = await groupService.getAllGroups(currentUser?.id || currentUser?._id);
      
      if (result.success) {
        const allGroups = result.data || [];
        
        const userGroups = allGroups.filter(group => 
          groupService.isMember(group, currentUser?.id || currentUser?._id)
        );
        
        const otherGroups = allGroups.filter(group => 
          !groupService.isMember(group, currentUser?.id || currentUser?._id)
        );

        setMyGroups(userGroups);
        
        const shuffled = otherGroups.sort(() => 0.5 - Math.random());
        const discoverGroups = shuffled.slice(0, 6);
        
        setGroups(discoverGroups);
      } else {
        alert('Error: ' + (result.message || 'Failed to load groups'));
      }
    } catch (error) {
      console.error('Load groups error:', error);
      alert('Error: Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
  }, []);

  const handleJoinGroup = async (group) => {
    try {
      const result = await groupService.joinGroup(group._id, currentUser?.id || currentUser?._id);
      
      if (result.success) {
        if (result.data.status === 'pending') {
          alert('Request Sent: Your join request has been sent to the group admin');
        } else {
          alert('Success: You have joined the group successfully!');
          loadGroups(); 
        }
      } else {
        alert('Error: ' + (result.message || 'Failed to join group'));
      }
    } catch (error) {
      console.error('Join group error:', error);
      alert('Error: Failed to join group');
    }
  };

  const handleCreateGroup = () => {
    setShowCreateModal(true);
  };

  const handleGroupCreated = (newGroup) => {
    setShowCreateModal(false);
    loadGroups(); 
  };

  const handleGroupPress = (group) => {
    navigate('/group-details', { state: { groupId: group._id } });
  };

  const refreshDiscoverGroups = async () => {
    try {
      const result = await groupService.getAllGroups(currentUser?.id || currentUser?._id);
      
      if (result.success) {
        const allGroups = result.data || [];
        const otherGroups = allGroups.filter(group => 
          !groupService.isMember(group, currentUser?.id || currentUser?._id)
        );
        
        const shuffled = otherGroups.sort(() => 0.5 - Math.random());
        const discoverGroups = shuffled.slice(0, 6);
        
        setGroups(discoverGroups);
      }
    } catch (error) {
      console.error('Refresh discover groups error:', error);
    }
  };

  const filteredGroups = useMemo(() => {
    const currentGroups = selectedTab === 'my' ? myGroups : groups;
    
    if (!debouncedSearchQuery.trim()) {
      return currentGroups;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return currentGroups.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.category.toLowerCase().includes(query) ||
      group.creatorName?.toLowerCase().includes(query)
    );
  }, [selectedTab, myGroups, groups, debouncedSearchQuery]);

  const renderGroupCard = (group, index) => {
    const isMember = groupService.isMember(group, currentUser?.id || currentUser?._id);
    const isCreator = groupService.isCreator(group, currentUser?.id || currentUser?._id);
    const hasPendingRequest = groupService.hasPendingRequest(group, currentUser?.id || currentUser?._id);

    return (
      <div 
        key={group._id}
        className="groups-card"
        onClick={() => handleGroupPress(group)}
      >
        <div className="groups-image-container">
          {group.image ? (
            <img src={group.image} alt={group.name} className="groups-image" />
          ) : (
            <div className="groups-placeholder-image">
              <span className="groups-placeholder-icon">👥</span>
            </div>
          )}
          
          <div className={`groups-privacy-badge ${group.isPrivate ? 'private' : ''}`}>
            <span className="groups-privacy-icon">
              {group.isPrivate ? "🔒" : "🌐"}
            </span>
          </div>
        </div>

        <div className="groups-info">
          <h3 className="groups-name" title={group.name}>
            {group.name}
          </h3>
          
          <p className="groups-description" title={group.description}>
            {group.description || 'No description available'}
          </p>
          
          <div className="groups-stats">
            <div className="groups-stat-item">
              <span className="groups-stat-icon">👥</span>
              <span className="groups-stat-text">{group.membersCount || 0} members</span>
            </div>
            
            <div className="groups-stat-item">
              <span className="groups-stat-icon">🍳</span>
              <span className="groups-stat-text">{group.postsCount || 0} recipes</span>
            </div>
          </div>

          <div className="groups-meta">
            <div className="groups-category-tag">
              <span className="groups-category-text">{group.category}</span>
            </div>
            
            <div className="groups-creator-info">
              <UserAvatar
                uri={group.creatorAvatar}
                name={group.creatorName}
                size={16}
              />
              <span className="groups-creator-text">{group.creatorName}</span>
            </div>
          </div>
        </div>

        <div className="groups-action-button">
          {isMember ? (
            <button className="groups-member-button">
              <span className="groups-button-icon">✓</span>
              <span className="groups-button-text">
                {isCreator ? 'Owner' : 'Member'}
              </span>
            </button>
          ) : hasPendingRequest ? (
            <button className="groups-pending-button">
              <span className="groups-button-icon">⏱</span>
              <span className="groups-button-text">Pending</span>
            </button>
          ) : (
            <button 
              className="groups-join-button"
              onClick={(e) => {
                e.stopPropagation();
                handleJoinGroup(group);
              }}
            >
              <span className="groups-button-icon">+</span>
              <span className="groups-button-text">Join</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="groups-empty-state">
      <span className="groups-empty-icon">👥</span>
      <h2 className="groups-empty-title">
        {selectedTab === 'my' ? 'No Groups Yet' : 'No New Groups to Discover'}
      </h2>
      <p className="groups-empty-subtitle">
        {selectedTab === 'my' 
          ? 'Join cooking groups or create your own to share recipes with fellow food lovers!'
          : 'Great! You\'re already a member of all available groups. Check back later for new communities!'
        }
      </p>
      {selectedTab === 'my' && (
        <button className="groups-create-button" onClick={handleCreateGroup}>
          Create Group
        </button>
      )}
      {selectedTab === 'discover' && (
        <button className="groups-create-button" onClick={refreshDiscoverGroups}>
          Refresh
        </button>
      )}
    </div>
  );

  const renderHeader = () => (
    <div className="groups-header-content">
      <div className="groups-search-container">
        <span className="groups-search-icon">🔍</span>
        <input
          type="text"
          className="groups-search-input"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.length > 0 && (
          <button className="groups-search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      <div className="groups-tab-container">
        <button
          className={`groups-tab ${selectedTab === 'my' ? 'active' : ''}`}
          onClick={() => setSelectedTab('my')}
        >
          <span className="groups-tab-text">
            My Groups ({myGroups.length})
          </span>
        </button>

        <button
          className={`groups-tab ${selectedTab === 'discover' ? 'active' : ''}`}
          onClick={() => setSelectedTab('discover')}
        >
          <span className="groups-tab-text">
            Discover
          </span>
        </button>
      </div>

      {selectedTab === 'discover' && !searchQuery.trim() && (
        <button className="groups-refresh-button" onClick={refreshDiscoverGroups}>
          <span className="groups-refresh-icon">🔄</span>
          <span className="groups-refresh-text">Show Different Groups</span>
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="groups-container">
        <div className="groups-loading-container">
          <div className="groups-spinner"></div>
          <p className="groups-loading-text">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="groups-header">
        <button className="groups-back-button" onClick={() => navigate(-1)}>
          <span className="groups-back-icon">←</span>
        </button>
        
        <h1 className="groups-header-title">Groups</h1>
        
        <button className="groups-create-header-button" onClick={handleCreateGroup}>
          <span className="groups-create-icon">+</span>
        </button>
      </div>

      <div className="groups-content">
        {renderHeader()}
        
        {refreshing && (
          <div className="groups-refresh-overlay">
            <div className="groups-spinner"></div>
          </div>
        )}
        
        {filteredGroups.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="groups-grid">
            {filteredGroups.map((group, index) => renderGroupCard(group, index))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="groups-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="groups-modal-container" onClick={e => e.stopPropagation()}>
            <div className="groups-modal-header">
              <h2 className="groups-modal-title">Create Group</h2>
              <button 
                className="groups-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <CreateGroupComponent
              navigation={{
                goBack: () => setShowCreateModal(false)
              }}
              onGroupCreated={handleGroupCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsScreen;