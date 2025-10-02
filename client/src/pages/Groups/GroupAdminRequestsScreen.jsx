import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  Loader2,
  Users
} from 'lucide-react';
import './GroupAdminRequestsScreen.css';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import UserAvatar from '../../components/common/UserAvatar';

const GroupAdminRequestsScreen = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('groupName');
  const { currentUser } = useAuth();
  
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
        
        if (!isAdmin && !isCreator) {
          alert('Only group admins can manage join requests');
          navigate(-1);
          return;
        }
        
        const requestsWithDetails = groupResult.data.pendingRequestsDetails || [];
        setPendingRequests(requestsWithDetails);
        
      } else {
        alert(groupResult.message || 'Failed to load group');
        navigate(-1);
      }
    } catch (error) {
      console.error('Load group data error:', error);
      alert('Failed to load group data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, currentUser, navigate]);

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

  if (loading) {
    return (
      <div className="admin-requests-screen">
        <header className="requests-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-container">
            <h1>Join Requests</h1>
          </div>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-requests-screen">
      {/* Header */}
      <header className="requests-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <div className="header-title-container">
          <h1>Join Requests</h1>
          {groupName && <p>{groupName}</p>}
        </div>
        
        <div className="counter-badge">
          <span>{pendingRequests.length}</span>
        </div>
      </header>

      {/* Summary Card */}
      {pendingRequests.length > 0 && (
        <div className="summary-card">
          <div className="summary-icon">
            <Clock size={24} />
          </div>
          <div className="summary-text">
            <h3>
              {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} pending
            </h3>
            <p>Review and approve new members for your group</p>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="requests-list">
        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <Users size={80} />
            <h3>No Pending Requests</h3>
            <p>There are no join requests waiting for approval</p>
          </div>
        ) : (
          pendingRequests.map((request) => {
            const requestId = request.userId || request._id || request.id;
            const isProcessing = processingRequests.has(requestId);
            const userName = request.userName || request.fullName || request.name || 'Unknown User';
            const userAvatar = request.userAvatar || request.avatar;
            const userBio = request.userBio || request.bio;
            const requestDate = request.createdAt || request.requestDate;

            return (
              <div key={requestId} className="request-item">
                <div className="user-info">
                  <UserAvatar
                    uri={userAvatar}
                    name={userName}
                    size={50}
                  />
                  
                  <div className="user-details">
                    <h3>{userName}</h3>
                    {userBio && <p className="user-bio">{userBio}</p>}
                    {requestDate && (
                      <span className="request-date">
                        Requested {new Date(requestDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="approve-btn"
                    onClick={() => handleRequest(request, 'approve')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="spinner" size={18} />
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Approve</span>
                      </>
                    )}
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() => handleRequest(request, 'reject')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="spinner" size={18} />
                    ) : (
                      <>
                        <X size={18} />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GroupAdminRequestsScreen;