import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  UserMinus,
  ArrowUp,
  Loader2
} from 'lucide-react';
import './GroupMembersScreen.css';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import UserAvatar from '../../components/common/UserAvatar';

const GroupMembersScreen = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('groupName');
  const { currentUser } = useAuth();
  
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
      } else {
        alert(result.message || 'Failed to load group members');
        navigate(-1);
      }
    } catch (error) {
      console.error('Load group members error:', error);
      alert('Failed to load group members');
      navigate(-1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

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
      alert('Only admins can remove members');
      return;
    }

    if (memberUserId === (currentUser?.id || currentUser?._id)) {
      alert('You cannot remove yourself. Use "Leave Group" instead.');
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
          alert(`${memberName} has been removed from the group`);
          loadGroupData();
        } else {
          alert(result.message || 'Failed to remove member');
        }
      } catch (error) {
        console.error('Remove member error:', error);
        alert('Failed to remove member');
      } finally {
        setRemovingMemberId(null);
      }
    }
  };

  const handlePromoteToAdmin = async (memberUserId, memberName) => {
    if (!isCreator) {
      alert('Only the group creator can promote members to admin');
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
          alert(`${memberName} is now a group admin`);
          loadGroupData();
        } else {
          alert(result.message || 'Failed to promote member');
        }
      } catch (error) {
        console.error('Promote member error:', error);
        alert('Failed to promote member');
      }
    }
  };

  if (loading) {
    return (
      <div className="group-members-screen">
        <header className="members-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Members</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-members-screen">
      {/* Header */}
      <header className="members-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Members ({filteredMembers.length})</h1>
        <div className="header-placeholder" />
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search members..."
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

      {/* Members List */}
      <div className="members-list">
        {filteredMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{searchQuery ? 'No members found' : 'No members yet'}</h3>
            <p>
              {searchQuery 
                ? `No members match "${searchQuery}"`
                : 'This group has no members yet'
              }
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const memberId = member.userId || member._id || member.id;
            const memberName = member.userName || member.name || member.fullName || 'Unknown User';
            const memberEmail = member.userEmail || member.email || '';
            const memberRole = member.role || 'member';
            const joinDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown';
            const isCurrentUser = memberId === (currentUser?.id || currentUser?._id);
            const canRemove = canManageMembers && !isCurrentUser && memberRole !== 'owner';
            const canPromote = isCreator && !isCurrentUser && memberRole === 'member';

            return (
              <div key={memberId} className="member-item">
                <UserAvatar
                  uri={member.userAvatar || member.avatar}
                  name={memberName}
                  size={50}
                />
                
                <div className="member-info">
                  <h3>
                    {memberName}
                    {isCurrentUser && ' (You)'}
                  </h3>
                  {memberEmail && <p className="member-email">{memberEmail}</p>}
                  <div className="member-meta">
                    <span className="member-role">
                      {memberRole === 'owner' ? 'Group Owner' : 
                       memberRole === 'admin' ? 'Admin' : 'Member'}
                    </span>
                    <span className="member-join-date">Joined: {joinDate}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="badges">
                  {memberRole === 'owner' && (
                    <span className="badge owner">OWNER</span>
                  )}
                  {memberRole === 'admin' && (
                    <span className="badge admin">ADMIN</span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  {canPromote && (
                    <button
                      className="promote-btn"
                      onClick={() => handlePromoteToAdmin(memberId, memberName)}
                      title="Promote to Admin"
                    >
                      <ArrowUp size={16} />
                    </button>
                  )}
                  
                  {canRemove && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveMember(memberId, memberName)}
                      disabled={removingMemberId === memberId}
                      title="Remove Member"
                    >
                      {removingMemberId === memberId ? (
                        <Loader2 className="spinner" size={16} />
                      ) : (
                        <UserMinus size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GroupMembersScreen;