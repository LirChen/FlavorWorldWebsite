import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ArrowLeft,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  CheckCircle,
  Loader2
} from 'lucide-react';
import './NotificationsScreen.css';
import { useAuth } from '../../services/AuthContext';
import { notificationService } from '../../services/notificationService';
import UserAvatar from '../../components/common/UserAvatar';

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || currentUser?._id;
      
      if (!userId) {
        console.error('No user ID available');
        setLoading(false);
        return;
      }

      const result = await notificationService.getUserNotifications(userId);
      
      if (result.success) {
        setNotifications(result.data || []);
        const unread = (result.data || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        console.error('Failed to load notifications:', result.message);
        alert(result.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      alert('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser?.id, currentUser?._id]);

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id;
    if (userId) {
      loadNotifications();
    }
  }, [currentUser?.id, currentUser?._id, loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const userId = currentUser?.id || currentUser?._id;
      if (!userId) return;

      const result = await notificationService.markAllAsRead(userId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }, [currentUser]);

  const handleNotificationPress = useCallback(async (notification) => {
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }

    switch (notification.type) {
      case 'follow':
        if (notification.fromUserId) {
          navigate(`/profile?userId=${notification.fromUserId}`);
        }
        break;
      
      case 'like':
      case 'comment':
      case 'group_post':
        if (notification.postId) {
          navigate(`/post/${notification.postId}`, {
            state: {
              groupId: notification.groupId || null,
              isGroupPost: !!notification.groupId
            }
          });
        }
        break;

      case 'group_join_request':
      case 'group_request_approved':
        if (notification.groupId) {
          navigate(`/group/${notification.groupId}`);
        }
        break;
      
      default:
        console.log('Unknown notification type:', notification.type);
        break;
    }
  }, [handleMarkAsRead, navigate]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { Icon: Heart, color: 'var(--danger)' };
      case 'comment':
        return { Icon: MessageCircle, color: 'var(--info, #3498DB)' };
      case 'follow':
        return { Icon: UserPlus, color: 'var(--success)' };
      case 'group_post':
        return { Icon: Bell, color: 'var(--primary)' };
      case 'group_join_request':
        return { Icon: Users, color: 'var(--secondary)' };
      case 'group_request_approved':
        return { Icon: CheckCircle, color: 'var(--success)' };
      default:
        return { Icon: Bell, color: 'var(--text-light)' };
    }
  };

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMs = now - notificationTime;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-screen">
        <header className="notifications-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Notifications</h1>
          <div className="header-placeholder" />
        </header>

        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-screen">
      <header className="notifications-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        
        {unreadCount > 0 ? (
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            Mark All Read
          </button>
        ) : (
          <div className="header-placeholder" />
        )}
      </header>

      <div className="notifications-content">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={80} />
            <h2>No Notifications Yet</h2>
            <p>
              When someone likes your recipes, follows you, or there's activity in your groups, you'll see it here!
            </p>
            <button className="primary-btn" onClick={() => navigate('/home')}>
              Share a Recipe
            </button>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const { Icon, color } = getNotificationIcon(notification.type);
              const isUnread = !notification.read;

              return (
                <div
                  key={notification._id}
                  className={`notification-item ${isUnread ? 'unread' : ''}`}
                  onClick={() => handleNotificationPress(notification)}
                >
                  <div className="notification-avatar">
                    <UserAvatar
                      uri={notification.fromUser?.avatar}
                      name={notification.fromUser?.name || 'User'}
                      size={40}
                    />
                    <div className="notification-icon-badge" style={{ backgroundColor: color }}>
                      <Icon size={12} />
                    </div>
                  </div>

                  <div className="notification-content">
                    <p className={`notification-message ${isUnread ? 'unread-text' : ''}`}>
                      {notification.message}
                    </p>
                    
                    <span className="notification-time">
                      {getTimeAgo(notification.createdAt)}
                    </span>

                    {notification.postImage && (
                      <img src={notification.postImage} alt="" className="post-thumbnail" />
                    )}
                  </div>

                  {isUnread && <div className="unread-dot" />}
                </div>
              );
            })}
          </div>
        )}

        {refreshing && (
          <div className="refresh-indicator">
            <Loader2 className="spinner" size={24} />
          </div>
        )}
      </div>

      <button className="refresh-fab" onClick={onRefresh} disabled={refreshing}>
        <Loader2 className={refreshing ? 'spinner' : ''} size={24} />
      </button>
    </div>
  );
};

export default NotificationsScreen;