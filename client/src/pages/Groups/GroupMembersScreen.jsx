import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import './GroupMembersScreen.css';
import UserAvatar from '../../components/common/UserAvatar';

const GroupMembersScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { groupId, groupName } = location.state || {};
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const isAdmin = group ? groupService.isAdmin(group, currentUser?.id || currentUser?._id) : false;
  const isCreator = group ? groupService.isCreator(group, currentUser?.id || currentUser?._id) : false;
  const canManageMembers = isAdmin || isCreator;

  useEffect(() => {
    if (!groupId) {
      navigate('/groups');
      return;
    }
    loadGroupData();
  }, [groupId]);

  useEffect(() => {
    filterMembers();
  }, [searchQuery, members]);

  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await groupService.getGroupWithMembers(groupId);
      
      if (result.success) {
        setGroup(result.data);
        setMembers(result.data.members || []);
        console.log('Group members loaded successfully');
      } else {
        alert('Error: ' + (result.message || 'Failed to load group members'));
        navigate(-1);
      }
    } catch (error) {
      console.error('Load group members error occurred');
      alert('Error: Failed to load group members');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroupData().finally(() => setRefreshing(false));
  }, [loadGroupData]);

  const filterMembers = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = members.filter(member => {
      const name = (member.userName || member.name || member.fullName || '').toLowerCase();
      const role = (member.role || 'member').toLowerCase();
      return name.includes(query) || role.includes(query);
    });

    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!canManageMembers) {
      alert('Permission Denied: Only admins can remove members');
      return;
    }

    if (memberUserId === (currentUser?.id || currentUser?._id)) {
      alert('Error: You cannot remove yourself. Use "Leave Group" instead.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${memberName} from ${groupName}?`)) {
      setRemovingMemberId(memberUserId);
      try {
        const result = await groupService.removeMember(
          groupId, 
          memberUserId, 
          currentUser?.id || currentUser?._id
        );
        
        if (result.success) {
          alert(`Success: ${memberName} has been removed from the group`);
          loadGroupData(); 
        } else {
          alert('Error: ' + (result.message || 'Failed to remove member'));
        }
      } catch (error) {
        console.error('Remove member error occurred');
        alert('Error: Failed to remove member');
      } finally {
        setRemovingMemberId(null);
      }
    }
  };

  const handlePromoteToAdmin = async (memberUserId, memberName) => {
    if (!isCreator) {
      alert('Permission Denied: Only the group creator can promote members to admin');
      return;
    }

    if (window.confirm(`Promote ${memberName} to group admin?`)) {
      try {
        const result = await groupService.updateMemberRole(
          groupId, 
          memberUserId, 
          'admin',
          currentUser?.id || currentUser?._id
        );
        
        if (result.success) {
          alert(`Success: ${memberName} is now a group admin`);
          loadGroupData();
        } else {
          alert('Error: ' + (result.message || 'Failed to promote member'));
        }
      } catch (error) {
        console.error('Promote member error occurred');
        alert('Error: Failed to promote member');
      }
    }
  };

  const renderMemberItem = (member, index) => {
    const memberId = member.userId || member._id || member.id;
    const memberName = member.userName || member.name || member.fullName || 'Unknown User';
    const memberEmail = member.userEmail || member.email || '';
    const memberRole = member.role || 'member';
    const joinDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown';
    const isCurrentUser = memberId === (currentUser?.id || currentUser?._id);
    const canRemove = canManageMembers && !isCurrentUser && memberRole !== 'owner';
    const canPromote = isCreator && !isCurrentUser && memberRole === 'member';

    return (
      <div key={memberId || index} className="group-members-item">
        <UserAvatar
          uri={member.userAvatar || member.avatar}
          name={memberName}
          size={50}
        />
        
        <div className="group-members-info">
          <h3 className="group-members-name">
            {memberName}
            {isCurrentUser && ' (You)'}
          </h3>
          {memberEmail && (
            <p className="group-members-email">{memberEmail}</p>
          )}
          <div className="group-members-meta">
            <span className="group-members-role">
              {memberRole === 'owner' ? 'Group Owner' : 
               memberRole === 'admin' ? 'Admin' : 'Member'}
            </span>
            <span className="group-members-join-date">Joined: {joinDate}</span>
          </div>
        </div>

        <div className="group-members-badges">
          {memberRole === 'owner' && (
            <div className="group-members-owner-badge">
              <span className="group-members-badge-text">OWNER</span>
            </div>
          )}
          {memberRole === 'admin' && (
            <div className="group-members-admin-badge">
              <span className="group-members-badge-text">ADMIN</span>
            </div>
          )}
        </div>

        <div className="group-members-actions">
          {canPromote && (
            <button
              className="group-members-promote-button"
              onClick={() => handlePromoteToAdmin(memberId, memberName)}
              title="Promote to Admin"
            >
              <span className="group-members-action-icon">⬆️</span>
            </button>
          )}
          
          {canRemove && (
            <button
              className="group-members-remove-button"
              onClick={() => handleRemoveMember(memberId, memberName)}
              disabled={removingMemberId === memberId}
              title="Remove Member"
            >
              {removingMemberId === memberId ? (
                <div className="group-members-spinner-small"></div>
              ) : (
                <span className="group-members-action-icon">🚫</span>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyComponent = () => (
    <div className="group-members-empty">
      <span className="group-members-empty-icon">👥</span>
      <h2 className="group-members-empty-title">
        {searchQuery ? 'No members found' : 'No members yet'}
      </h2>
      <p className="group-members-empty-subtitle">
        {searchQuery 
          ? `No members match "${searchQuery}"`
          : 'This group has no members yet'
        }
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="group-members-container">
        <div className="group-members-header">
          <button 
            className="group-members-back-button" 
            onClick={() => navigate(-1)}
          >
            <span className="group-members-back-icon">←</span>
          </button>
          <h1 className="group-members-header-title">Members</h1>
          <div className="group-members-placeholder" />
        </div>
        
        <div className="group-members-loading">
          <div className="group-members-spinner"></div>
          <p className="group-members-loading-text">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-members-container">
      <div className="group-members-header">
        <button 
          className="group-members-back-button" 
          onClick={() => navigate(-1)}
        >
          <span className="group-members-back-icon">←</span>
        </button>
        <h1 className="group-members-header-title">
          Members ({filteredMembers.length})
        </h1>
        <div className="group-members-placeholder" />
      </div>

      <div className="group-members-search-container">
        <div className="group-members-search-bar">
          <span className="group-members-search-icon">🔍</span>
          <input
            type="text"
            className="group-members-search-input"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button 
              onClick={() => setSearchQuery('')}
              className="group-members-clear-button"
            >
              <span className="group-members-clear-icon">✕</span>
            </button>
          )}
        </div>
      </div>

      <div className="group-members-content">
        {refreshing && (
          <div className="group-members-refresh-overlay">
            <div className="group-members-spinner"></div>
          </div>
        )}
        
        <button 
          className="group-members-refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <span className="group-members-refresh-icon">🔄</span>
          <span>Refresh</span>
        </button>

        {filteredMembers.length === 0 ? (
          renderEmptyComponent()
        ) : (
          <div className="group-members-list">
            {filteredMembers.map((member, index) => renderMemberItem(member, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMembersScreen;