import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Users,
  Lock,
  Globe,
  RefreshCw,
  UtensilsCrossed,
  Clock,
  CheckCircle
} from 'lucide-react';
import './GroupsScreen.css';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import UserAvatar from '../../components/common/UserAvatar';

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
        alert(result.message || 'Failed to load groups');
      }
    } catch (error) {
      console.error('Load groups error:', error);
      alert('Failed to load groups');
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
          alert('Your join request has been sent to the group admin');
        } else {
          alert('You have joined the group successfully!');
          loadGroups();
        }
      } else {
        alert(result.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Join group error:', error);
      alert('Failed to join group');
    }
  };

  const handleGroupPress = (group) => {
    navigate(`/group/${group._id}`);
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

  const renderGroupCard = (group) => {
    const isMember = groupService.isMember(group, currentUser?.id || currentUser?._id);
    const isCreator = groupService.isCreator(group, currentUser?.id || currentUser?._id);
    const hasPendingRequest = groupService.hasPendingRequest(group, currentUser?.id || currentUser?._id);

    return (
      <div 
        key={group._id}
        className="group-card"
        onClick={() => handleGroupPress(group)}
      >
        <div className="group-image-container">
          {group.image ? (
            <img src={group.image} alt={group.name} className="group-image" />
          ) : (
            <div className="placeholder-group-image">
              <Users size={40} />
            </div>
          )}
          
          <div className={`privacy-badge ${group.isPrivate ? 'private' : ''}`}>
            {group.isPrivate ? <Lock size={12} /> : <Globe size={12} />}
          </div>
        </div>

        <div className="group-info">
          <h3 className="group-name">{group.name}</h3>
          
          <p className="group-description">
            {group.description || 'No description available'}
          </p>
          
          <div className="group-stats">
            <div className="stat-item">
              <Users size={14} />
              <span>{group.membersCount || 0} members</span>
            </div>
            
            <div className="stat-item">
              <UtensilsCrossed size={14} />
              <span>{group.postsCount || 0} recipes</span>
            </div>
          </div>

          <div className="group-meta">
            <div className="category-tag">
              <span>{group.category}</span>
            </div>
            
            <div className="creator-info">
              <UserAvatar
                uri={group.creatorAvatar}
                name={group.creatorName}
                size={16}
              />
              <span>{group.creatorName}</span>
            </div>
          </div>
        </div>

        <div className="action-button" onClick={(e) => e.stopPropagation()}>
          {isMember ? (
            <button className="member-button">
              <CheckCircle size={16} />
              <span>{isCreator ? 'Owner' : 'Member'}</span>
            </button>
          ) : hasPendingRequest ? (
            <button className="pending-button">
              <Clock size={16} />
              <span>Pending</span>
            </button>
          ) : (
            <button 
              className="join-button"
              onClick={(e) => {
                e.stopPropagation();
                handleJoinGroup(group);
              }}
            >
              <Plus size={16} />
              <span>Join</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="groups-screen">
        <header className="groups-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Groups</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groups-screen">
      {/* Header */}
      <header className="groups-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>Groups</h1>
        
        <button 
          className="create-btn"
          onClick={() => navigate('/group/create')}
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="groups-content">
        {/* Search */}
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={selectedTab === 'my' ? 'active' : ''}
            onClick={() => setSelectedTab('my')}
          >
            My Groups ({myGroups.length})
          </button>

          <button
            className={selectedTab === 'discover' ? 'active' : ''}
            onClick={() => setSelectedTab('discover')}
          >
            Discover
          </button>
        </div>

        {/* Refresh Button */}
        {selectedTab === 'discover' && !searchQuery.trim() && (
          <button 
            className="refresh-button"
            onClick={refreshDiscoverGroups}
          >
            <RefreshCw size={16} />
            <span>Show Different Groups</span>
          </button>
        )}

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="empty-state">
            <Users size={80} />
            <h3>
              {selectedTab === 'my' ? 'No Groups Yet' : 'No New Groups to Discover'}
            </h3>
            <p>
              {selectedTab === 'my' 
                ? 'Join cooking groups or create your own to share recipes with fellow food lovers!'
                : 'Great! You\'re already a member of all available groups. Check back later for new communities!'
              }
            </p>
            {selectedTab === 'my' && (
              <button 
                className="create-group-button"
                onClick={() => navigate('/group/create')}
              >
                Create Group
              </button>
            )}
            {selectedTab === 'discover' && (
              <button 
                className="create-group-button"
                onClick={refreshDiscoverGroups}
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <div className="groups-grid">
            {filteredGroups.map(group => renderGroupCard(group))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsScreen;