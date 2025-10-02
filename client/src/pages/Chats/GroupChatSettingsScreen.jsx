import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  Camera,
  Loader2,
  UserPlus,
  LogOut,
  Trash2,
  Image as ImageIcon,
  Users,
  Check
} from 'lucide-react';
import './GroupChatSettingsScreen.css';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { chatService } from '../../services/chatServices';

const GroupChatSettingsScreen = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { groupChat } = location.state || {};
  
  const [chatInfo, setChatInfo] = useState(groupChat);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [leaving, setLeaving] = useState(false);
  
  const [pendingChanges, setPendingChanges] = useState({
    name: groupChat?.name || '',
    description: groupChat?.description || '',
    image: null,
    allowNameChange: groupChat?.settings?.allowNameChange !== false,
    allowImageChange: groupChat?.settings?.allowImageChange !== false,
    allowMemberInvites: groupChat?.settings?.allowMemberInvites === true,
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isAdmin = chatInfo?.adminId === (currentUser?.id || currentUser?._id);

  useEffect(() => {
    loadChatInfo();
  }, []);

  useEffect(() => {
    const hasChanges = 
      pendingChanges.name !== (chatInfo?.name || '') ||
      pendingChanges.description !== (chatInfo?.description || '') ||
      pendingChanges.image !== null ||
      pendingChanges.allowNameChange !== (chatInfo?.settings?.allowNameChange !== false) ||
      pendingChanges.allowImageChange !== (chatInfo?.settings?.allowImageChange !== false) ||
      pendingChanges.allowMemberInvites !== (chatInfo?.settings?.allowMemberInvites === true);
    
    setHasUnsavedChanges(hasChanges);
  }, [pendingChanges, chatInfo]);

  const loadChatInfo = async () => {
    try {
      setLoading(true);
      const result = await chatService.getGroupChat(chatId);
      if (result.success) {
        setChatInfo(result.data);
        setPendingChanges({
          name: result.data.name,
          description: result.data.description || '',
          image: null,
          allowNameChange: result.data.settings?.allowNameChange !== false,
          allowImageChange: result.data.settings?.allowImageChange !== false,
          allowMemberInvites: result.data.settings?.allowMemberInvites === true,
        });
      }
    } catch (error) {
      console.error('Load chat info error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePendingChange = (field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePendingChange('image', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove the group image?')) {
      updatePendingChange('image', '');
    }
  };

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      alert('No changes to save');
      return;
    }

    if (!pendingChanges.name.trim()) {
      alert('Group name cannot be empty');
      return;
    }

    try {
      setUpdating(true);
      
      const updateData = {};
      
      if (pendingChanges.name !== chatInfo.name) {
        updateData.name = pendingChanges.name.trim();
      }
      
      if (pendingChanges.description !== (chatInfo.description || '')) {
        updateData.description = pendingChanges.description;
      }
      
      if (pendingChanges.image !== null) {
        updateData.image = pendingChanges.image;
      }
      
      if (isAdmin) {
        if (pendingChanges.allowNameChange !== (chatInfo.settings?.allowNameChange !== false)) {
          updateData.allowNameChange = pendingChanges.allowNameChange;
        }
        
        if (pendingChanges.allowImageChange !== (chatInfo.settings?.allowImageChange !== false)) {
          updateData.allowImageChange = pendingChanges.allowImageChange;
        }
        
        if (pendingChanges.allowMemberInvites !== (chatInfo.settings?.allowMemberInvites === true)) {
          updateData.allowMemberInvites = pendingChanges.allowMemberInvites;
        }
      }

      const result = await chatService.updateGroupChat(chatId, updateData);

      if (result.success) {
        setChatInfo(prev => ({
          ...prev,
          name: pendingChanges.name.trim(),
          description: pendingChanges.description,
          image: pendingChanges.image !== null ? pendingChanges.image : prev.image,
          settings: {
            ...prev.settings,
            allowNameChange: pendingChanges.allowNameChange,
            allowImageChange: pendingChanges.allowImageChange,
            allowMemberInvites: pendingChanges.allowMemberInvites
          }
        }));
        
        setPendingChanges(prev => ({
          ...prev,
          image: null
        }));
        
        alert('Group settings saved successfully!');
      } else {
        alert(result.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Save changes error:', error);
      alert('Problem saving changes');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelChanges = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      setPendingChanges({
        name: chatInfo?.name || '',
        description: chatInfo?.description || '',
        image: null,
        allowNameChange: chatInfo?.settings?.allowNameChange !== false,
        allowImageChange: chatInfo?.settings?.allowImageChange !== false,
        allowMemberInvites: chatInfo?.settings?.allowMemberInvites === true,
      });
    }
  };

  const handleRemoveMember = async (member) => {
    if (member.userId === chatInfo.adminId) {
      alert('Cannot remove the group admin');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${member.userName} from the group?`)) {
      try {
        setUpdating(true);
        const result = await chatService.removeParticipantFromGroupChat(chatId, member.userId);

        if (result.success) {
          setChatInfo(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.userId !== member.userId),
            participantsCount: (prev.participantsCount || prev.participants.length) - 1
          }));
          alert('Member removed successfully');
        } else {
          alert(result.message || 'Failed to remove member');
        }
      } catch (error) {
        console.error('Remove member error:', error);
        alert('Problem removing member');
      } finally {
        setUpdating(false);
      }
    }
  };

  const loadAvailableUsersForInvite = async () => {
    try {
      setLoadingUsers(true);
      const result = await chatService.getAvailableUsersForGroupChat(chatId);
      
      if (result.success) {
        setAvailableUsers(result.data || []);
      } else {
        alert(result.message || 'Failed to load available users');
      }
    } catch (error) {
      console.error('Load available users error:', error);
      alert('Problem loading available users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMembers = () => {
    setSelectedNewMembers([]);
    setShowAddMembersModal(true);
    loadAvailableUsersForInvite();
  };

  const toggleUserSelection = (user) => {
    setSelectedNewMembers(prev => {
      const isSelected = prev.some(u => u.userId === user.userId);
      if (isSelected) {
        return prev.filter(u => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const confirmAddMembers = async () => {
    if (selectedNewMembers.length === 0) {
      alert('Please select at least one user to add');
      return;
    }

    try {
      setUpdating(true);
      const userIds = selectedNewMembers.map(user => user.userId);
      const result = await chatService.addParticipantsToGroupChat(chatId, userIds);

      if (result.success) {
        loadChatInfo();
        setShowAddMembersModal(false);
        alert(`Added ${selectedNewMembers.length} member(s) successfully`);
      } else {
        alert(result.message || 'Failed to add members');
      }
    } catch (error) {
      console.error('Add members error:', error);
      alert('Problem adding members');
    } finally {
      setUpdating(false);
    }
  };

  const handleLeaveGroup = () => {
    const message = isAdmin 
      ? 'As the admin, if you leave, another member will randomly become the new admin. Are you sure you want to leave?'
      : 'Are you sure you want to leave this group?';

    if (window.confirm(message)) {
      leaveGroup();
    }
  };

  const leaveGroup = async () => {
    try {
      setLeaving(true);
      const result = await chatService.leaveGroupChat(chatId);

      if (result.success) {
        alert('You have left the group successfully');
        navigate('/chats');
      } else {
        alert(result.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Leave group error:', error);
      alert('Problem leaving group');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="group-settings-screen">
        <header className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Group Settings</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading group settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-settings-screen">
      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Group Settings</h1>
        
        <div className="header-actions">
          {hasUnsavedChanges && (
            <>
              <button className="cancel-btn" onClick={handleCancelChanges}>
                Cancel
              </button>
              
              <button 
                className="save-btn"
                onClick={handleSaveChanges}
                disabled={updating}
              >
                {updating ? <Loader2 className="spinner" size={16} /> : <><Save size={16} /> Save</>}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="settings-content">
        {/* Unsaved Changes Notice */}
        {hasUnsavedChanges && (
          <div className="unsaved-notice">
            <span>⚠️</span>
            <p>You have unsaved changes</p>
          </div>
        )}

        {/* Group Information */}
        <section className="settings-section">
          <h2>Group Information</h2>
          
          <div className="group-avatar-section">
            <div className="avatar-preview">
              {pendingChanges.image ? (
                <img src={pendingChanges.image} alt="Group" />
              ) : chatInfo?.image ? (
                <img src={chatInfo.image} alt="Group" />
              ) : (
                <div className="default-avatar">
                  <Users size={40} />
                </div>
              )}
            </div>
            
            <p className="members-count">{chatInfo?.participantsCount || 0} members</p>
            
            {(isAdmin || chatInfo?.settings?.allowImageChange !== false) && (
              <div className="avatar-actions">
                <label className="change-image-btn">
                  <Camera size={16} />
                  <span>{chatInfo?.image || pendingChanges.image ? 'Change Image' : 'Add Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
                
                {(chatInfo?.image || pendingChanges.image) && (
                  <button className="remove-image-btn" onClick={handleRemoveImage}>
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={pendingChanges.name}
              onChange={(e) => updatePendingChange('name', e.target.value)}
              maxLength={100}
              placeholder="Enter group name"
              disabled={!isAdmin && chatInfo?.settings?.allowNameChange === false}
              className={pendingChanges.name !== chatInfo?.name ? 'changed' : ''}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={pendingChanges.description}
              onChange={(e) => updatePendingChange('description', e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Enter group description"
              disabled={!isAdmin && chatInfo?.settings?.allowNameChange === false}
              className={pendingChanges.description !== (chatInfo?.description || '') ? 'changed' : ''}
            />
          </div>
        </section>

        {/* Members */}
        <section className="settings-section">
          <div className="section-header">
            <h2>Members ({chatInfo?.participants?.length || 0})</h2>
            {isAdmin && (
              <button className="add-members-btn" onClick={handleAddMembers}>
                <UserPlus size={20} />
                <span>Add</span>
              </button>
            )}
          </div>

          <div className="members-list">
            {chatInfo?.participants?.map((member) => {
              const isCurrentUser = member.userId === (currentUser?.id || currentUser?._id);
              const isMemberAdmin = member.userId === chatInfo.adminId;
              
              return (
                <div key={member.userId} className="member-item">
                  <UserAvatar
                    uri={member.userAvatar}
                    name={member.userName}
                    size={40}
                  />
                  
                  <div className="member-info">
                    <div className="member-header">
                      <h4>{member.userName}</h4>
                      {isMemberAdmin && <span className="admin-badge">Admin</span>}
                      {isCurrentUser && <span className="you-badge">You</span>}
                    </div>
                    <p>Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                  </div>
                  
                  {isAdmin && !isCurrentUser && !isMemberAdmin && (
                    <button
                      className="remove-member-btn"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Permissions */}
        {isAdmin && (
          <section className="settings-section">
            <h2>Group Permissions</h2>
            
            <div className="permission-item">
              <div className="permission-info">
                <h4>Allow members to change name</h4>
                <p>Let any member change the group name and description</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pendingChanges.allowNameChange}
                  onChange={(e) => updatePendingChange('allowNameChange', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="permission-item">
              <div className="permission-info">
                <h4>Allow members to change image</h4>
                <p>Let any member change the group profile image</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pendingChanges.allowImageChange}
                  onChange={(e) => updatePendingChange('allowImageChange', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="permission-item">
              <div className="permission-info">
                <h4>Allow member invites</h4>
                <p>Let any member add new people to the group</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pendingChanges.allowMemberInvites}
                  onChange={(e) => updatePendingChange('allowMemberInvites', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="settings-section">
          <h2>Actions</h2>
          
          <button
            className="leave-group-btn"
            onClick={handleLeaveGroup}
            disabled={leaving}
          >
            {leaving ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <>
                <LogOut size={20} />
                <span>Leave Group</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="modal-overlay" onClick={() => setShowAddMembersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button onClick={() => setShowAddMembersModal(false)}>Cancel</button>
              <h3>Add Members</h3>
              <button
                onClick={confirmAddMembers}
                disabled={selectedNewMembers.length === 0 || updating}
                className="modal-add-btn"
              >
                {updating ? <Loader2 className="spinner" size={16} /> : `Add (${selectedNewMembers.length})`}
              </button>
            </div>

            {loadingUsers ? (
              <div className="modal-loading">
                <Loader2 className="spinner" size={40} />
                <p>Loading available users...</p>
              </div>
            ) : (
              <div className="modal-users-list">
                {availableUsers.length === 0 ? (
                  <div className="empty-users">
                    <Users size={60} />
                    <h2>No users available to add</h2>
                    <p>You can only add people you follow or have chatted with</p>
                  </div>
                ) : (
                  availableUsers.map((user) => {
                    const isSelected = selectedNewMembers.some(u => u.userId === user.userId);
                    return (
                      <div
                        key={user.userId}
                        className={`modal-user-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleUserSelection(user)}
                      >
                        <UserAvatar
                          uri={user.userAvatar}
                          name={user.userName}
                          size={40}
                        />
                        
                        <div className="user-info">
                          <h4>{user.userName}</h4>
                          <div className="user-badges">
                            {user.isFollowing && <span className="badge">Following</span>}
                            {user.hasPrivateChat && <span className="badge chat">Chatted</span>}
                          </div>
                        </div>
                        
                        <div className={`selection-circle ${isSelected ? 'selected' : ''}`}>
                          {isSelected && <Check size={16} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatSettingsScreen;