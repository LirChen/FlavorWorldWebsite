import React, { useState, useEffect } from 'react';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E8E8E8',
  success: '#27AE60',
  danger: '#E74C3C',
};

// Mock UserAvatar component
const UserAvatar = ({ uri, name, size = 50, showOnlineStatus, isOnline, style }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      backgroundColor: FLAVORWORLD_COLORS.secondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: FLAVORWORLD_COLORS.white,
      fontWeight: 'bold',
      fontSize: size * 0.4,
      ...style
    }}>
      {uri ? (
        <img 
          src={uri} 
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
      {showOnlineStatus && (
        <div style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: '50%',
          backgroundColor: isOnline ? FLAVORWORLD_COLORS.success : FLAVORWORLD_COLORS.textLight,
          border: `2px solid ${FLAVORWORLD_COLORS.white}`,
        }} />
      )}
    </div>
  );
};

// Mock Switch component
const Switch = ({ value, onValueChange, trackColor, thumbColor }) => {
  return (
    <div
      style={{
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? trackColor.true : trackColor.false,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.3s'
      }}
      onClick={() => onValueChange(!value)}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          backgroundColor: thumbColor,
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          transition: 'left 0.3s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
};

// Mock hooks and services
const useAuth = () => ({
  currentUser: { id: '123', userName: 'TestUser' }
});

const chatService = {
  getGroupChat: (chatId) => ({
    success: true,
    data: {
      _id: chatId,
      name: 'Team Chat',
      description: 'Our awesome team chat',
      image: null,
      adminId: '123',
      participants: [
        {
          userId: '123',
          userName: 'TestUser',
          userAvatar: null,
          joinedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          userId: '456',
          userName: 'John Doe',
          userAvatar: null,
          joinedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          userId: '789',
          userName: 'Jane Smith',
          userAvatar: null,
          joinedAt: new Date(Date.now() - 259200000).toISOString()
        }
      ],
      participantsCount: 3,
      settings: {
        allowNameChange: true,
        allowImageChange: true,
        allowMemberInvites: false
      }
    }
  }),
  updateGroupChat: (chatId, updateData) => ({ success: true }),
  removeParticipantFromGroupChat: (chatId, userId) => ({ success: true }),
  getAvailableUsersForGroupChat: (chatId) => ({
    success: true,
    data: [
      {
        userId: '101',
        userName: 'Bob Wilson',
        userAvatar: null,
        userEmail: 'bob@example.com',
        isFollowing: true,
        hasPrivateChat: false
      },
      {
        userId: '102',
        userName: 'Alice Brown',
        userAvatar: null,
        userEmail: 'alice@example.com',
        isFollowing: false,
        hasPrivateChat: true
      }
    ]
  }),
  addParticipantsToGroupChat: (chatId, userIds) => ({ success: true }),
  leaveGroupChat: (chatId) => ({ success: true })
};

const GroupChatSettingsScreen = ({ 
  route = { params: { chatId: '1', groupChat: { _id: '1', name: 'Team Chat' } } },
  navigation = { goBack: () => console.log('Go back'), popToTop: () => console.log('Pop to top') } 
}) => {
  const { currentUser } = useAuth();
  const { chatId, groupChat } = route.params;
  
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

  const handleImagePick = async (source) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (source === 'camera') {
        input.capture = 'environment';
      }
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64data = event.target.result;
            updatePendingChange('image', base64data);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Problem selecting image');
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove the group image?')) {
      updatePendingChange('image', '');
    }
  };

  const showImageOptions = () => {
    const options = ['Camera', 'Gallery'];
    if (chatInfo?.image || pendingChanges.image) {
      options.push('Remove Image');
    }
    
    const choice = window.prompt(`Choose an option:\n1. Camera\n2. Gallery${chatInfo?.image || pendingChanges.image ? '\n3. Remove Image' : ''}\n\nEnter number (1-${options.length}):`);
    
    if (choice === '1') {
      handleImagePick('camera');
    } else if (choice === '2') {
      handleImagePick('gallery');
    } else if (choice === '3' && (chatInfo?.image || pendingChanges.image)) {
      handleRemoveImage();
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

      console.log('Saving changes:', updateData);

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

  const handleRemoveMember = (member) => {
    if (member.userId === chatInfo.adminId) {
      alert('Cannot remove the group admin');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${member.userName} from the group?`)) {
      removeMember(member.userId);
    }
  };

  const removeMember = async (userId) => {
    try {
      setUpdating(true);
      const result = await chatService.removeParticipantFromGroupChat(chatId, userId);

      if (result.success) {
        setChatInfo(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.userId !== userId),
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
        if (window.confirm('You have left the group successfully')) {
          navigation.popToTop();
        }
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

  const renderMember = (item) => {
    const isCurrentUser = item.userId === (currentUser?.id || currentUser?._id);
    const isMemberAdmin = item.userId === chatInfo.adminId;
    
    return (
      <div key={item.userId} style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 0'
      }}>
        <UserAvatar
          uri={item.userAvatar}
          name={item.userName}
          size={40}
          showOnlineStatus={false}
        />
        
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 4
          }}>
            <span style={{
              fontSize: 16,
              fontWeight: '500',
              color: FLAVORWORLD_COLORS.text,
              marginRight: 8
            }}>
              {item.userName}
            </span>
            {isMemberAdmin && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: FLAVORWORLD_COLORS.primary,
                padding: '2px 8px',
                borderRadius: 10,
                marginRight: 8
              }}>
                <span style={{ fontSize: 12, marginRight: 2 }}>⭐</span>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Admin
                </span>
              </div>
            )}
            {isCurrentUser && (
              <div style={{
                backgroundColor: FLAVORWORLD_COLORS.secondary,
                padding: '2px 8px',
                borderRadius: 10
              }}>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  You
                </span>
              </div>
            )}
          </div>
          <span style={{
            fontSize: 12,
            color: FLAVORWORLD_COLORS.textLight
          }}>
            Joined {new Date(item.joinedAt).toLocaleDateString()}
          </span>
        </div>
        
        {isAdmin && !isCurrentUser && !isMemberAdmin && (
          <button
            style={{
              padding: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: FLAVORWORLD_COLORS.danger,
              fontSize: 20
            }}
            onClick={() => handleRemoveMember(item)}
          >
            👤❌
          </button>
        )}
      </div>
    );
  };

  const renderAvailableUser = (item) => {
    const isSelected = selectedNewMembers.some(u => u.userId === item.userId);

    return (
      <div
        key={item.userId}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
          backgroundColor: isSelected ? FLAVORWORLD_COLORS.background : FLAVORWORLD_COLORS.white,
          cursor: 'pointer'
        }}
        onClick={() => toggleUserSelection(item)}
      >
        <UserAvatar
          uri={item.userAvatar}
          name={item.userName}
          size={40}
          showOnlineStatus={false}
        />
        
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{
            fontSize: 16,
            fontWeight: '500',
            color: FLAVORWORLD_COLORS.text,
            marginBottom: 4
          }}>
            {item.userName}
          </div>
          <div style={{ display: 'flex' }}>
            {item.isFollowing && (
              <div style={{
                backgroundColor: FLAVORWORLD_COLORS.primary,
                borderRadius: 8,
                padding: '2px 8px',
                marginRight: 8
              }}>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Following
                </span>
              </div>
            )}
            {item.hasPrivateChat && (
              <div style={{
                backgroundColor: FLAVORWORLD_COLORS.secondary,
                borderRadius: 8,
                padding: '2px 8px',
                marginRight: 8
              }}>
                <span style={{
                  color: FLAVORWORLD_COLORS.white,
                  fontSize: 12,
                  fontWeight: '500'
                }}>
                  Chatted
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          border: `2px solid ${isSelected ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border}`,
          backgroundColor: isSelected ? FLAVORWORLD_COLORS.primary : 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {isSelected && (
            <span style={{ color: FLAVORWORLD_COLORS.white, fontSize: 16 }}>✓</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: FLAVORWORLD_COLORS.background
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
        }}>
          <button 
            style={{
              padding: 8,
              backgroundColor: FLAVORWORLD_COLORS.background,
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer'
            }}
            onClick={() => navigation.goBack()}
          >
            ←
          </button>
          <h2 style={{
            fontSize: 18,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            flex: 1,
            textAlign: 'center',
            margin: '0 16px'
          }}>
            Group Settings
          </h2>
          <div style={{ width: 40 }} />
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `4px solid ${FLAVORWORLD_COLORS.primary}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{
            marginTop: 16,
            fontSize: 16,
            color: FLAVORWORLD_COLORS.textLight
          }}>
            Loading group settings...
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: FLAVORWORLD_COLORS.background
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: FLAVORWORLD_COLORS.white,
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
      }}>
        <button 
          style={{
            padding: 8,
            backgroundColor: FLAVORWORLD_COLORS.background,
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer'
          }}
          onClick={() => navigation.goBack()}
        >
          ←
        </button>
        <h2 style={{
          fontSize: 18,
          fontWeight: '600',
          color: FLAVORWORLD_COLORS.text,
          flex: 1,
          textAlign: 'center',
          margin: '0 16px'
        }}>
          Group Settings
        </h2>
        
        {/* Save/Cancel buttons */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {hasUnsavedChanges && (
            <>
              <button 
                style={{
                  padding: '6px 12px',
                  marginRight: 8,
                  background: 'transparent',
                  border: 'none',
                  color: FLAVORWORLD_COLORS.textLight,
                  fontSize: 16,
                  cursor: 'pointer'
                }}
                onClick={handleCancelChanges}
              >
                Cancel
              </button>
              
              <button 
                style={{
                  backgroundColor: updating ? FLAVORWORLD_COLORS.textLight : FLAVORWORLD_COLORS.primary,
                  color: FLAVORWORLD_COLORS.white,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 20,
                  minWidth: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: '600'
                }}
                onClick={handleSaveChanges}
                disabled={updating}
              >
                {updating ? (
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  'Save'
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {/* Unsaved changes notice */}
        {hasUnsavedChanges && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: FLAVORWORLD_COLORS.white,
            padding: '12px 16px',
            margin: '8px 0',
            borderLeft: `4px solid ${FLAVORWORLD_COLORS.primary}`
          }}>
            <span style={{ fontSize: 16, color: FLAVORWORLD_COLORS.primary, marginRight: 8 }}>⚠️</span>
            <span style={{
              fontSize: 14,
              color: FLAVORWORLD_COLORS.text,
              fontWeight: '500'
            }}>
              You have unsaved changes
            </span>
          </div>
        )}

        {/* Group Information Section */}
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          margin: '8px 0',
          padding: '20px 16px'
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            margin: '0 0 20px 0'
          }}>
            Group Information
          </h3>
          
          {/* Group Avatar Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <div style={{
              position: 'relative',
              width: 80,
              height: 80,
              borderRadius: 40,
              overflow: 'hidden',
              marginBottom: 8
            }}>
              {pendingChanges.image ? (
                <img 
                  src={pendingChanges.image} 
                  alt="Group avatar preview"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    objectFit: 'cover'
                  }}
                />
              ) : chatInfo?.image ? (
                <UserAvatar
                  uri={chatInfo.image}
                  name={chatInfo.name}
                  size={80}
                  showOnlineStatus={false}
                />
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: FLAVORWORLD_COLORS.secondary,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 40, color: FLAVORWORLD_COLORS.white }}>👥</span>
                </div>
              )}
              
              {pendingChanges.image && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: FLAVORWORLD_COLORS.primary,
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  border: `2px solid ${FLAVORWORLD_COLORS.white}`
                }}>
                  <span style={{ fontSize: 12, color: FLAVORWORLD_COLORS.white }}>📷</span>
                </div>
              )}
            </div>
            
            <span style={{
              fontSize: 14,
              color: FLAVORWORLD_COLORS.textLight
            }}>
              {chatInfo?.participantsCount || chatInfo?.participants?.length || 0} members
            </span>
            
            {(isAdmin || chatInfo?.settings?.allowImageChange !== false) && (
              <button 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  border: `1px solid ${FLAVORWORLD_COLORS.border}`,
                  padding: '8px 12px',
                  borderRadius: 20,
                  marginTop: 8,
                  cursor: 'pointer',
                  color: FLAVORWORLD_COLORS.primary,
                  fontSize: 14,
                  fontWeight: '500'
                }}
                onClick={showImageOptions}
              >
                <span style={{ fontSize: 16, marginRight: 6 }}>📷</span>
                {chatInfo?.image || pendingChanges.image ? 'Change Image' : 'Add Image'}
              </button>
            )}
          </div>

          {/* Group Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 14,
              fontWeight: '500',
              color: FLAVORWORLD_COLORS.textLight,
              marginBottom: 8,
              display: 'block'
            }}>
              Group Name
            </label>
            <input
              type="text"
              style={{
                backgroundColor: FLAVORWORLD_COLORS.background,
                borderRadius: 8,
                padding: '12px',
                fontSize: 16,
                color: FLAVORWORLD_COLORS.text,
                border: `1px solid ${pendingChanges.name !== chatInfo?.name ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border}`,
                width: '100%',
                outline: 'none',
                ...(pendingChanges.name !== chatInfo?.name && {
                  backgroundColor: '#FFF8F0'
                })
              }}
              value={pendingChanges.name}
              onChange={(e) => updatePendingChange('name', e.target.value)}
              maxLength={100}
              placeholder="Enter group name"
              readOnly={!isAdmin && chatInfo?.settings?.allowNameChange === false}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              fontSize: 14,
              fontWeight: '500',
              color: FLAVORWORLD_COLORS.textLight,
              marginBottom: 8,
              display: 'block'
            }}>
              Description
            </label>
            <textarea
              style={{
                backgroundColor: FLAVORWORLD_COLORS.background,
                borderRadius: 8,
                padding: '12px',
                fontSize: 16,
                color: FLAVORWORLD_COLORS.text,
                border: `1px solid ${pendingChanges.description !== (chatInfo?.description || '') ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border}`,
                width: '100%',
                minHeight: 80,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                ...(pendingChanges.description !== (chatInfo?.description || '') && {
                  backgroundColor: '#FFF8F0'
                })
              }}
              value={pendingChanges.description}
              onChange={(e) => updatePendingChange('description', e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Enter group description"
              readOnly={!isAdmin && chatInfo?.settings?.allowNameChange === false}
            />
          </div>
        </div>

        {/* Members Section */}
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          margin: '8px 0',
          padding: '20px 16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              margin: 0
            }}>
              Members ({chatInfo?.participants?.length || 0})
            </h3>
            {isAdmin && (
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: FLAVORWORLD_COLORS.background,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  color: FLAVORWORLD_COLORS.primary,
                  fontSize: 14,
                  fontWeight: '500'
                }}
                onClick={handleAddMembers}
              >
                <span style={{ fontSize: 20, marginRight: 4 }}>👤➕</span>
                Add
              </button>
            )}
          </div>

          <div>
            {(chatInfo?.participants || []).map((member, index) => (
              <div key={member.userId}>
                {renderMember(member)}
                {index < (chatInfo?.participants?.length || 0) - 1 && (
                  <div style={{
                    height: 1,
                    backgroundColor: FLAVORWORLD_COLORS.border,
                    margin: '8px 0'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group Permissions Section */}
        {isAdmin && (
          <div style={{
            backgroundColor: FLAVORWORLD_COLORS.white,
            margin: '8px 0',
            padding: '20px 16px'
          }}>
            <h3 style={{
              fontSize: 18,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              margin: '0 0 20px 0'
            }}>
              Group Permissions
            </h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
            }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: FLAVORWORLD_COLORS.text,
                  marginBottom: 4
                }}>
                  Allow members to change name
                </div>
                <div style={{
                  fontSize: 14,
                  color: FLAVORWORLD_COLORS.textLight,
                  lineHeight: 1.3
                }}>
                  Let any member change the group name and description
                </div>
              </div>
              <Switch
                value={pendingChanges.allowNameChange}
                onValueChange={(value) => updatePendingChange('allowNameChange', value)}
                trackColor={{ false: FLAVORWORLD_COLORS.border, true: FLAVORWORLD_COLORS.primary }}
                thumbColor={FLAVORWORLD_COLORS.white}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
            }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: FLAVORWORLD_COLORS.text,
                  marginBottom: 4
                }}>
                  Allow members to change image
                </div>
                <div style={{
                  fontSize: 14,
                  color: FLAVORWORLD_COLORS.textLight,
                  lineHeight: 1.3
                }}>
                  Let any member change the group profile image
                </div>
              </div>
              <Switch
                value={pendingChanges.allowImageChange}
                onValueChange={(value) => updatePendingChange('allowImageChange', value)}
                trackColor={{ false: FLAVORWORLD_COLORS.border, true: FLAVORWORLD_COLORS.primary }}
                thumbColor={FLAVORWORLD_COLORS.white}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0'
            }}>
              <div style={{ flex: 1, marginRight: 16 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: FLAVORWORLD_COLORS.text,
                  marginBottom: 4
                }}>
                  Allow member invites
                </div>
                <div style={{
                  fontSize: 14,
                  color: FLAVORWORLD_COLORS.textLight,
                  lineHeight: 1.3
                }}>
                  Let any member add new people to the group
                </div>
              </div>
              <Switch
                value={pendingChanges.allowMemberInvites}
                onValueChange={(value) => updatePendingChange('allowMemberInvites', value)}
                trackColor={{ false: FLAVORWORLD_COLORS.border, true: FLAVORWORLD_COLORS.primary }}
                thumbColor={FLAVORWORLD_COLORS.white}
              />
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          margin: '8px 0',
          padding: '20px 16px'
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            margin: '0 0 20px 0'
          }}>
            Actions
          </h3>
          
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              backgroundColor: FLAVORWORLD_COLORS.danger,
              color: FLAVORWORLD_COLORS.white,
              border: 'none',
              fontSize: 16,
              fontWeight: '500',
              cursor: leaving ? 'not-allowed' : 'pointer'
            }}
            onClick={handleLeaveGroup}
            disabled={leaving}
          >
            {leaving ? (
              <div style={{
                width: 16,
                height: 16,
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <>
                <span style={{ fontSize: 20, marginRight: 8 }}>🚪</span>
                Leave Group
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderRadius: 20,
            width: '90%',
            maxWidth: 500,
            height: '80%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`
            }}>
              <button
                onClick={() => setShowAddMembersModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  color: FLAVORWORLD_COLORS.textLight,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <h3 style={{
                fontSize: 18,
                fontWeight: '600',
                color: FLAVORWORLD_COLORS.text,
                margin: 0
              }}>
                Add Members
              </h3>
              <button
                onClick={confirmAddMembers}
                disabled={selectedNewMembers.length === 0 || updating}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 16,
                  color: selectedNewMembers.length === 0 ? FLAVORWORLD_COLORS.textLight : FLAVORWORLD_COLORS.primary,
                  fontWeight: '500',
                  cursor: selectedNewMembers.length === 0 || updating ? 'not-allowed' : 'pointer'
                }}
              >
                {updating ? (
                  <div style={{
                    width: 16,
                    height: 16,
                    border: '2px solid transparent',
                    borderTop: `2px solid ${FLAVORWORLD_COLORS.primary}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  `Add (${selectedNewMembers.length})`
                )}
              </button>
            </div>

            {/* Modal Content */}
            {loadingUsers ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: `4px solid ${FLAVORWORLD_COLORS.primary}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: FLAVORWORLD_COLORS.textLight
                }}>
                  Loading available users...
                </p>
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto'
              }}>
                {availableUsers.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '60px 40px'
                  }}>
                    <div style={{ fontSize: 60, color: FLAVORWORLD_COLORS.textLight }}>👥</div>
                    <h4 style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: FLAVORWORLD_COLORS.text,
                      marginTop: 16,
                      marginBottom: 8,
                      textAlign: 'center'
                    }}>
                      No users available to add
                    </h4>
                    <p style={{
                      fontSize: 14,
                      color: FLAVORWORLD_COLORS.textLight,
                      textAlign: 'center',
                      lineHeight: 1.4,
                      margin: 0
                    }}>
                      You can only add people you follow or have chatted with
                    </p>
                  </div>
                ) : (
                  availableUsers.map(renderAvailableUser)
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GroupChatSettingsScreen;