import React, { useState, useEffect, useCallback } from 'react';

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
  warning: '#F39C12',
};

// Mock UserAvatar component
const UserAvatar = ({ uri, name, size = 50, style }) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  
  return (
    <div style={{
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
    </div>
  );
};

// Mock hooks and services
const useAuth = () => ({
  currentUser: { id: '123', userName: 'TestUser' }
});

const groupService = {
  getGroup: (groupId) => ({
    success: true,
    data: {
      _id: groupId,
      name: 'Team Group',
      adminId: '123',
      creatorId: '123',
      pendingRequestsDetails: [
        {
          userId: '456',
          userName: 'John Doe',
          userAvatar: null,
          userBio: 'Software Developer passionate about React',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          userId: '789',
          userName: 'Jane Smith',
          userAvatar: null,
          userBio: 'UX Designer with 5 years experience',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          userId: '101',
          userName: 'Bob Wilson',
          userAvatar: null,
          userBio: 'Product Manager building amazing products',
          createdAt: new Date(Date.now() - 259200000).toISOString()
        }
      ]
    }
  }),
  isAdmin: (group, userId) => group?.adminId === userId,
  isCreator: (group, userId) => group?.creatorId === userId,
  handleJoinRequest: (groupId, requestId, action, currentUserId) => ({
    success: true,
    message: `Request ${action}d successfully`
  })
};

const GroupAdminRequestsScreen = ({ 
  route = { params: { groupId: '1', groupName: 'Team Group' } },
  navigation = { goBack: () => console.log('Go back') } 
}) => {
  const { currentUser } = useAuth();
  const { groupId, groupName } = route.params;
  
  const [group, setGroup] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = useCallback(async () => {
    try {
      setLoading(true);
      
      const groupResult = await groupService.getGroup(groupId);
      if (groupResult.success) {
        setGroup(groupResult.data);
        
        const isAdmin = groupService.isAdmin(groupResult.data, currentUser?.id || currentUser?._id);
        const isCreator = groupService.isCreator(groupResult.data, currentUser?.id || currentUser?._id);
        
        console.log(' Admin check:', { isAdmin, isCreator, userId: currentUser?.id || currentUser?._id });
        
        if (!isAdmin && !isCreator) {
          alert('Only group admins can manage join requests');
          navigation.goBack();
          return;
        }
        
        const requestsWithDetails = groupResult.data.pendingRequestsDetails || [];
        
        console.log(' Pending requests loaded:', {
          totalRequests: requestsWithDetails.length,
          requestsData: requestsWithDetails.map(r => ({
            userId: r.userId,
            userName: r.userName,
            hasAvatar: !!r.userAvatar
          }))
        });
        
        setPendingRequests(requestsWithDetails);
        
      } else {
        alert(groupResult.message || 'Failed to load group');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load group data error:', error);
      alert('Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUser, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroupData().finally(() => setRefreshing(false));
  }, [loadGroupData]);

  const handleRequest = async (request, action) => {
    const requestId = request.userId || request._id || request.id;
    
    if (processingRequests.has(requestId)) {
      return; 
    }

    setProcessingRequests(prev => new Set([...prev, requestId]));

    try {
      const result = await groupService.handleJoinRequest(
        groupId, 
        requestId, 
        action, 
        currentUser?.id || currentUser?._id
      );
      
      if (result.success) {
        setPendingRequests(prev => 
          prev.filter(req => {
            const reqId = req.userId || req._id || req.id;
            return reqId !== requestId;
          })
        );
        
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        const userName = request.userName || request.fullName || request.name || 'User';
        alert(`${userName}'s request has been ${actionText}`);
        
      } else {
        alert(result.message || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Handle ${action} request error:`, error);
      alert(`Failed to ${action} request`);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const renderRequestItem = (request) => {
    const requestId = request.userId || request._id || request.id;
    const isProcessing = processingRequests.has(requestId);
    const userName = request.userName || request.fullName || request.name || 'Unknown User';
    const userAvatar = request.userAvatar || request.avatar;
    const userBio = request.userBio || request.bio;
    const requestDate = request.createdAt || request.requestDate;

    return (
      <div
        key={requestId}
        style={{
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <UserAvatar
            uri={userAvatar}
            name={userName}
            size={50}
          />
          
          <div style={{ flex: 1, marginLeft: 12 }}>
            <div style={{
              fontSize: 16,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              marginBottom: 4
            }}>
              {userName}
            </div>
            {userBio && (
              <div style={{
                fontSize: 14,
                color: FLAVORWORLD_COLORS.textLight,
                lineHeight: 1.3,
                marginBottom: 4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {userBio}
              </div>
            )}
            {requestDate && (
              <div style={{
                fontSize: 12,
                color: FLAVORWORLD_COLORS.textLight
              }}>
                Requested {new Date(requestDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: FLAVORWORLD_COLORS.success,
              color: FLAVORWORLD_COLORS.white,
              border: 'none',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
            onClick={() => handleRequest(request, 'approve')}
            disabled={isProcessing}
          >
            {isProcessing ? (
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
                <span style={{ marginRight: 6 }}>✓</span>
                Approve
              </>
            )}
          </button>

          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: FLAVORWORLD_COLORS.danger,
              color: FLAVORWORLD_COLORS.white,
              border: 'none',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: '600',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
            onClick={() => handleRequest(request, 'reject')}
            disabled={isProcessing}
          >
            {isProcessing ? (
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
                <span style={{ marginRight: 6 }}>×</span>
                Reject
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderEmptyComponent = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 40px'
    }}>
      <div style={{
        fontSize: 80,
        color: FLAVORWORLD_COLORS.textLight,
        marginBottom: 20,
        opacity: 0.5
      }}>
        👥
      </div>
      <h3 style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: FLAVORWORLD_COLORS.text,
        marginBottom: 8,
        textAlign: 'center'
      }}>
        No Pending Requests
      </h3>
      <p style={{
        fontSize: 16,
        color: FLAVORWORLD_COLORS.textLight,
        textAlign: 'center',
        lineHeight: 1.4,
        margin: 0
      }}>
        There are no join requests waiting for approval
      </p>
    </div>
  );

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: FLAVORWORLD_COLORS.background
      }}>
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
            Loading requests...
          </p>
        </div>
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
        borderBottom: `1px solid ${FLAVORWORLD_COLORS.border}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 16px'
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: '600',
            color: FLAVORWORLD_COLORS.text,
            margin: 0
          }}>
            Join Requests
          </h2>
          <p style={{
            fontSize: 14,
            color: FLAVORWORLD_COLORS.textLight,
            margin: '2px 0 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '200px'
          }}>
            {groupName || 'Group Management'}
          </p>
        </div>
        
        <div style={{
          width: 40,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            backgroundColor: FLAVORWORLD_COLORS.warning,
            borderRadius: 12,
            padding: '4px 8px',
            minWidth: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              color: FLAVORWORLD_COLORS.white,
              fontSize: 12,
              fontWeight: '600'
            }}>
              {pendingRequests.length}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {pendingRequests.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: FLAVORWORLD_COLORS.white,
          margin: 16,
          padding: 16,
          borderRadius: 12,
          borderLeft: `4px solid ${FLAVORWORLD_COLORS.warning}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginRight: 16 }}>
            <span style={{
              fontSize: 24,
              color: FLAVORWORLD_COLORS.warning
            }}>
              ⏰
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 16,
              fontWeight: '600',
              color: FLAVORWORLD_COLORS.text,
              marginBottom: 4
            }}>
              {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} pending
            </div>
            <div style={{
              fontSize: 14,
              color: FLAVORWORLD_COLORS.textLight,
              lineHeight: 1.3
            }}>
              Review and approve new members for your group
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px'
      }}>
        {pendingRequests.length === 0 ? (
          renderEmptyComponent()
        ) : (
          <div>
            {pendingRequests.map(renderRequestItem)}
          </div>
        )}
      </div>

      {/* Refresh functionality */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: FLAVORWORLD_COLORS.white,
        borderTop: `1px solid ${FLAVORWORLD_COLORS.border}`
      }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: FLAVORWORLD_COLORS.background,
            border: `1px solid ${FLAVORWORLD_COLORS.border}`,
            padding: '8px 16px',
            borderRadius: 20,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            color: FLAVORWORLD_COLORS.primary,
            fontSize: 14,
            fontWeight: '500'
          }}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <div style={{
              width: 16,
              height: 16,
              border: `2px solid ${FLAVORWORLD_COLORS.primary}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: 8
            }} />
          ) : (
            <span style={{ marginRight: 8 }}>🔄</span>
          )}
          Refresh
        </button>
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
};

export default GroupAdminRequestsScreen;