import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import { recipeService } from '../../services/recipeService';
import './GroupDetailsScreen.css';
import PostComponent from '../../components/common/PostComponent';
import CreatePostComponent from '../../components/common/CreatePostComponent';
import UserAvatar from '../../components/common/UserAvatar';

const GroupDetailsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { groupId } = location.state || {};
  
  const [group, setGroup] = useState(null);
  const [groupPosts, setGroupPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  const isMember = group ? groupService.isMember(group, currentUser?.id || currentUser?._id) : false;
  const isAdmin = group ? groupService.isAdmin(group, currentUser?.id || currentUser?._id) : false;
  const isCreator = group ? groupService.isCreator(group, currentUser?.id || currentUser?._id) : false;
  const hasPendingRequest = group ? groupService.hasPendingRequest(group, currentUser?.id || currentUser?._id) : false;
  const pendingRequestsCount = group?.pendingRequests?.length || 0;

  useEffect(() => {
    if (!groupId) {
      navigate('/groups');
      return;
    }
    loadGroupData();
  }, [groupId]);

  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Loading group data with enriched members');
      
      const groupResult = await groupService.getGroupWithMembers(groupId);
      if (groupResult.success) {
        setGroup(groupResult.data);
        console.log('Group loaded successfully with enriched member data');
      } else {
        console.log('Fallback: trying regular group endpoint');
        const fallbackResult = await groupService.getGroup(groupId);
        
        if (fallbackResult.success) {
          setGroup(fallbackResult.data);
          console.log('Group loaded with fallback endpoint');
        } else {
          alert('Error: ' + (fallbackResult.message || 'Failed to load group'));
          return;
        }
      }

      await loadGroupPosts();

    } catch (error) {
      console.error('Load group data error occurred');
      alert('Error: Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadGroupPosts = useCallback(async () => {
    try {
      const result = await groupService.getGroupPosts(groupId, currentUser?.id || currentUser?._id);
      
      if (result.success) {
        const sortedPosts = (result.data || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setGroupPosts(sortedPosts);
        console.log('Group posts loaded successfully');
        
        if (result.message && sortedPosts.length === 0) {
          console.log('Group posts info:', result.message);
        }
      } else {
        console.error('Failed to load group posts');
        setGroupPosts([]);
      }
    } catch (error) {
      console.error('Load group posts error occurred');
      setGroupPosts([]);
    }
  }, [groupId, currentUser]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroupData().finally(() => setRefreshing(false));
  }, [loadGroupData]);

  const handleJoinGroup = async () => {
    if (!group) return;
    
    setIsJoining(true);
    try {
      if (hasPendingRequest) {
        const result = await groupService.cancelJoinRequest(groupId, currentUser?.id || currentUser?._id);
        
        if (result.success) {
          alert('Request Canceled: Your join request has been canceled');
          loadGroupData();
        } else {
          alert('Error: ' + (result.message || 'Failed to cancel join request'));
        }
      } else {
        const result = await groupService.joinGroup(groupId, currentUser?.id || currentUser?._id);
        
        if (result.success) {
          if (result.data.status === 'pending') {
            alert('Request Sent: Your join request has been sent to the group admin');
          } else {
            alert('Success: You have joined the group successfully!');
          }
          loadGroupData();
        } else {
          alert('Error: ' + (result.message || 'Failed to join group'));
        }
      }
    } catch (error) {
      console.error('Join/Cancel group error occurred');
      alert('Error: Failed to process request');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;

    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        const result = await groupService.leaveGroup(groupId, currentUser?.id || currentUser?._id);
        console.log('groupId:', groupId, 'userId:', currentUser?.id || currentUser?._id);

        if (result.success) {
          alert('Success: You have left the group');
          navigate(-1);
        } else {
          alert('Error: ' + (result.message || 'Failed to leave group'));
        }
      } catch (error) {
        alert('Error: Failed to leave group');
      }
    }
  };

  const handlePostCreated = useCallback((newPost) => {
    console.log('New post created, refreshing posts');
    loadGroupPosts();
  }, [loadGroupPosts]);

  const handlePostDelete = useCallback(async (postId) => {
    try {
      const result = await groupService.deleteGroupPost(groupId, postId, currentUser?.id || currentUser?._id);
      
      if (result.success) {
        loadGroupPosts();
        alert('Success: Recipe deleted successfully');
      } else {
        alert('Error: ' + (result.message || 'Failed to delete recipe'));
      }
    } catch (error) {
      alert('Error: Failed to delete recipe');
    }
  }, [loadGroupPosts, groupId, currentUser]);

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!isAdmin && !isCreator) {
      alert('Permission Denied: Only admins can remove members');
      return;
    }

    if (memberUserId === (currentUser?.id || currentUser?._id)) {
      alert('Error: You cannot remove yourself from the group');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
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

  const renderMembersSection = () => {
    if (!group || !group.members || group.members.length === 0) return null;

    const previewMembers = group.members.slice(0, 4);

    return (
      <div className="group-details-members-section">
        <div className="group-details-members-header">
          <h3 className="group-details-members-title">
            Members ({group.members.length})
          </h3>
          <button 
            className="group-details-view-all-button"
            onClick={() => navigate('/group-members', {
              state: { groupId: groupId, groupName: group?.name }
            })}
          >
            <span className="group-details-view-all-text">View All</span>
            <span className="group-details-view-all-icon">›</span>
          </button>
        </div>

        <div className="group-details-members-preview">
          {previewMembers.map((member, index) => {
            const memberId = member.userId || member._id || member.id;
            const memberName = member.userName || member.name || member.fullName || 'Unknown User';
            const memberRole = member.role || 'member';
            const isCurrentUser = memberId === (currentUser?.id || currentUser?._id);

            return (
              <button 
                key={index} 
                className="group-details-member-preview"
                onClick={() => navigate('/group-members', {
                  state: { groupId: groupId, groupName: group?.name }
                })}
              >
                <UserAvatar
                  uri={member.userAvatar || member.avatar}
                  name={memberName}
                  size={32}
                />
                <div className="group-details-member-info">
                  <span className="group-details-member-name" title={memberName}>
                    {memberName}
                    {isCurrentUser && ' (You)'}
                  </span>
                  <span className="group-details-member-role">
                    {memberRole === 'owner' ? 'Owner' : 
                     memberRole === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <button 
          className="group-details-view-all-full-button"
          onClick={() => navigate('/group-members', {
            state: { groupId: groupId, groupName: group?.name }
          })}
        >
          <span className="group-details-people-icon">👥</span>
          <span className="group-details-view-all-full-text">
            View All {group.members.length} Members
          </span>
          <span className="group-details-chevron-icon">›</span>
        </button>
      </div>
    );
  };

  const renderGroupHeader = () => {
    if (!group) return null;

    return (
      <div className="group-details-header">
        <div className="group-details-cover-container">
          {group.image ? (
            <img src={group.image} alt={group.name} className="group-details-cover-image" />
          ) : (
            <div className="group-details-placeholder-cover">
              <span className="group-details-placeholder-icon">👥</span>
            </div>
          )}
          
          <div className={`group-details-privacy-badge ${group.isPrivate ? 'private' : ''}`}>
            <span className="group-details-privacy-icon">
              {group.isPrivate ? "🔒" : "🌐"}
            </span>
            <span className="group-details-privacy-text">
              {group.isPrivate ? 'Private' : 'Public'}
            </span>
          </div>
        </div>

        <div className="group-details-info">
          <h1 className="group-details-name">{group.name}</h1>
          
          <div className="group-details-category-container">
            <span className="group-details-category-tag">{group.category}</span>
          </div>

          {group.description && (
            <p className="group-details-description">{group.description}</p>
          )}

          <div className="group-details-stats">
            <div className="group-details-stat-item">
              <span className="group-details-stat-icon">👥</span>
              <span className="group-details-stat-text">{group.membersCount} members</span>
            </div>
            
            <div className="group-details-stat-item">
              <span className="group-details-stat-icon">🍳</span>
              <span className="group-details-stat-text">{groupPosts.length} recipes</span>
            </div>
          </div>

          <div className="group-details-creator">
            <UserAvatar
              uri={group.creatorAvatar}
              name={group.creatorName}
              size={24}
            />
            <span className="group-details-creator-text">
              Created by {group.creatorName}
            </span>
          </div>

          <div className="group-details-action-container">
            {!isMember ? (
              hasPendingRequest ? (
                <button 
                  className={`group-details-pending-button ${isJoining ? 'disabled' : ''}`}
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <div className="group-details-spinner"></div>
                  ) : (
                    <>
                      <span className="group-details-button-icon">✕</span>
                      <span className="group-details-button-text">Cancel Request</span>
                    </>
                  )}
                </button>
              ) : (
                <button 
                  className={`group-details-join-button ${isJoining ? 'disabled' : ''}`}
                  onClick={handleJoinGroup}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <div className="group-details-spinner"></div>
                  ) : (
                    <>
                      <span className="group-details-button-icon">+</span>
                      <span className="group-details-button-text">Join Group</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="group-details-member-actions">
                <button className="group-details-member-button">
                  <span className="group-details-button-icon">✓</span>
                  <span className="group-details-button-text">
                    {isCreator ? 'Group Owner' : isAdmin ? 'Admin' : 'Member'}
                  </span>
                </button>
                
                {!isCreator && (
                  <button 
                    className="group-details-leave-button"
                    onClick={handleLeaveGroup}
                  >
                    <span className="group-details-leave-icon">🚪</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreatePost = () => {
    const allowMemberPosts = group?.settings?.allowMemberPosts ?? group?.allowMemberPosts ?? true;
    
    if (!isMember || !allowMemberPosts) {
      return null;
    }
    
    return (
      <div className="group-details-create-post">
        <div className="group-details-create-header">
          <UserAvatar
            uri={currentUser?.avatar}
            name={currentUser?.fullName || currentUser?.name}
            size={40}
          />
          <button 
            className="group-details-create-input"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="group-details-create-placeholder">
              Share a recipe with {group.name}...
            </span>
          </button>
        </div>
        
        <div className="group-details-create-actions">
          <button 
            className="group-details-create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="group-details-create-icon">🍳</span>
            <span className="group-details-create-text">Recipe</span>
          </button>
          
          <button 
            className="group-details-create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="group-details-create-icon">📷</span>
            <span className="group-details-create-text">Photo</span>
          </button>
        </div>
      </div>
    );
  };

  const renderPost = useCallback((post, index) => {
    return (
      <div key={post._id || post.id || index} className="group-details-post">
        <PostComponent
          post={post || {}}
          navigation={{ navigate }}
          onDelete={handlePostDelete}
          onRefreshData={loadGroupPosts}
          isGroupPost={true}
          groupId={groupId}
          groupName={group?.name}
        />
      </div>
    );
  }, [handlePostDelete, loadGroupPosts, navigate, group, groupId]);

  const renderEmptyComponent = useCallback(() => (
    !loading && (
      <div className="group-details-empty">
        <div className="group-details-empty-icon">
          <span>🍳</span>
        </div>
        <h2 className="group-details-empty-title">No Recipes Yet!</h2>
        <p className="group-details-empty-subtitle">
          {isMember 
            ? 'Be the first to share a delicious recipe with this group'
            : 'Join the group to see and share amazing recipes'
          }
        </p>
        {isMember && (group?.settings?.allowMemberPosts ?? group?.allowMemberPosts ?? true) && (
          <button 
            className="group-details-empty-button"
            onClick={() => setShowCreateModal(true)}
          >
            Share Recipe
          </button>
        )}
      </div>
    )
  ), [loading, isMember, group]);

  if (loading) {
    return (
      <div className="group-details-container">
        <div className="group-details-loading">
          <div className="group-details-spinner"></div>
          <p className="group-details-loading-text">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-details-container">
        <div className="group-details-error">
          <span className="group-details-error-icon">⚠️</span>
          <h2 className="group-details-error-title">Group Not Found</h2>
          <p className="group-details-error-subtitle">This group may have been deleted or you don't have access to it.</p>
          <button 
            className="group-details-back-button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-details-container">
      <div className="group-details-top-header">
        <button 
          className="group-details-header-back" 
          onClick={() => navigate(-1)}
        >
          <span className="group-details-back-icon">←</span>
        </button>
        
        <h1 className="group-details-header-title" title={group.name}>
          {group.name}
        </h1>
        
        <button 
          className="group-details-header-menu"
          onClick={() => {
            if (isAdmin || isCreator) {
              const choice = window.prompt(
                `Group Options:\n1. Manage Requests ${pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}\n2. Group Settings\n\nEnter 1 or 2:`
              );
              
              if (choice === '1') {
                navigate('/group-admin-requests', { 
                  state: { groupId: groupId, groupName: group?.name }
                });
              } else if (choice === '2') {
                navigate('/group-settings', { 
                  state: { groupId: groupId, groupData: group }
                });
              }
            } else {
              const choice = window.prompt(
                'Group Options:\n1. Group Info\n2. Report Group\n\nEnter 1 or 2:'
              );
              
              if (choice === '1') {
                alert(
                  `Group Information:\n\nName: ${group.name}\nCategory: ${group.category}\nPrivacy: ${group.isPrivate ? 'Private' : 'Public'}\nMembers: ${group.membersCount || group.members?.length || 0}\nCreated by: ${group.creatorName}`
                );
              } else if (choice === '2') {
                alert('Report Group: Report functionality coming soon!');
              }
            }
          }}
        >
          <div className="group-details-menu-container">
            <span className="group-details-menu-icon">⋯</span>
            {(isAdmin || isCreator) && pendingRequestsCount > 0 && (
              <div className="group-details-menu-badge">
                <span className="group-details-badge-text">{pendingRequestsCount}</span>
              </div>
            )}
          </div>
        </button>
      </div>
      
      <div className="group-details-content">
        {refreshing && (
          <div className="group-details-refresh-overlay">
            <div className="group-details-spinner"></div>
          </div>
        )}
        
        <button 
          className="group-details-refresh-button"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <span className="group-details-refresh-icon">🔄</span>
          <span>Refresh</span>
        </button>
        
        {renderGroupHeader()}
        {renderMembersSection()}
        {renderCreatePost()}
        
        <div className="group-details-posts">
          {groupPosts.length === 0 ? (
            renderEmptyComponent()
          ) : (
            groupPosts.map((post, index) => renderPost(post, index))
          )}
        </div>
      </div>

      {showCreateModal && isMember && (
        <div className="group-details-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="group-details-modal-container" onClick={e => e.stopPropagation()}>
            <div className="group-details-modal-header">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="group-details-modal-close"
              >
                <span>✕</span>
              </button>
              <h2 className="group-details-modal-title">Share Recipe</h2>
              <div className="group-details-modal-placeholder" />
            </div>
            
            <CreatePostComponent
              currentUser={currentUser}
              groupId={groupId}
              groupName={group.name}
              onPostCreated={(newPost) => {
                handlePostCreated(newPost);
                setShowCreateModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsScreen;