import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Heart, MessageCircle, UserPlus, ChefHat, Users, CheckCircle, Bell, Loader } from 'lucide-react';
import './NotificationsScreen.css'; // We'll define CSS separately
import { useAuth } from '../../services/AuthContext';
import { notificationService } from '../../services/NotificationService';
import UserAvatar from '../../components/common/UserAvatar';

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
  info: '#3498DB'
};

const NotificationsScreen = ({ navigation }) => {
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

      // Use the enhanced notification service with caching
      const result = await notificationService.getUserNotificationsWithCache(userId);
      
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
  }, [currentUser]);

  useEffect(() => {
    loadNotifications();

    // Set up real-time updates
    const unsubscribe = notificationService.connectToNotifications(
      currentUser?.id || currentUser?._id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe.close();
    };
  }, [loadNotifications, currentUser]);

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
          navigation.navigate('/profile/' + notification.fromUserId);
        }
        break;
      
      case 'like':
      case 'comment':
      case 'group_post':
        if (notification.postId) {
          console.log('New group post - opening full recipe view');
          navigation.navigate('/post/' + notification.postId, {
            groupId: notification.groupId || null,
            isGroupPost: !!notification.groupId,
            postTitle: notification.postTitle || 'Recipe',
            postImage: notification.postImage || null
          });
        }
        break;

      case 'group_join_request':
      case 'group_request_approved':
        if (notification.groupId) {
          navigation.navigate('/group/' + notification.groupId);
        }
        break;
      
      default:
        console.log('Unknown notification type:', notification.type);
        break;
    }
  }, [handleMarkAsRead, navigation]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { icon: Heart, color: FLAVORWORLD_COLORS.danger };
      case 'comment':
        return { icon: MessageCircle, color: FLAVORWORLD_COLORS.info };
      case 'follow':
        return { icon: UserPlus, color: FLAVORWORLD_COLORS.success };
      case 'group_post':
        return { icon: ChefHat, color: FLAVORWORLD_COLORS.primary };
      case 'group_join_request':
        return { icon: Users, color: FLAVORWORLD_COLORS.secondary };
      case 'group_request_approved':
        return { icon: CheckCircle, color: FLAVORWORLD_COLORS.success };
      default:
        return { icon: Bell, color: FLAVORWORLD_COLORS.textLight };
    }
  };

  const getTimeAgo = (createdAt) => {
    return notificationService.formatNotificationTime(createdAt);
  };

  const renderNotification = useCallback((item, index) => {
    const iconData = getNotificationIcon(item.type);
    const IconComponent = iconData.icon;
    const isUnread = !item.read;

    return (
      <div
        key={item._id || item.id || index}
        className={`notification-item ${isUnread ? 'unread' : ''}`}
        onClick={() => handleNotificationPress(item)}
      >
        <div className="notification-content">
          {/* Avatar with notification icon badge */}
          <div className="avatar-container">
            <UserAvatar
              uri={item.fromUser?.avatar}
              name={item.fromUser?.name || 'User'}
              size={40}
            />
            {/* Notification type icon badge */}
            <div 
              className="notification-icon-badge"
              style={{ backgroundColor: iconData.color }}
            >
              <IconComponent size={12} color={FLAVORWORLD_COLORS.white} />
            </div>
          </div>

          {/* Notification text content */}
          <div className="notification-text-container">
            <p className={`notification-message ${isUnread ? 'unread-text' : ''}`}>
              {item.message}
            </p>
            
            <p className="notification-time">
              {getTimeAgo(item.createdAt)}
            </p>

            {/* Post thumbnail for post-related notifications */}
            {(item.type === 'like' || item.type === 'comment' || item.type === 'group_post') && item.postImage && (
              <img src={item.postImage} alt="Post" className="post-thumbnail" />
            )}
          </div>

          {/* Unread indicator dot */}
          {isUnread && <div className="unread-dot" />}
        </div>
      </div>
    );
  }, [handleNotificationPress]);

  const renderEmptyComponent = useCallback(() => (
    !loading && (
      <div className="empty-container">
        <div className="empty-icon">
          <Bell size={80} color={FLAVORWORLD_COLORS.textLight} />
        </div>
        <h3 className="empty-title">No Notifications Yet</h3>
        <p className="empty-subtitle">
          When someone likes your recipes, follows you, or there's activity in your groups, you'll see it here!
        </p>
        <button 
          className="empty-button"
          onClick={() => navigation.navigate('/home')}
        >
          Share a Recipe
        </button>
      </div>
    )
  ), [loading, navigation]);

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-screen">
        <div className="header">
          <button 
            className="back-button"
            onClick={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={FLAVORWORLD_COLORS.accent} />
          </button>
          <h1 className="header-title">Notifications</h1>
          <div className="header-placeholder" />
        </div>

        <div className="loading-container">
          <Loader size={48} color={FLAVORWORLD_COLORS.primary} className="loading-spinner" />
          <p className="loading-text">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-screen">
      {/* Header */}
      <div className="header">
        <button 
          className="back-button"
          onClick={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={FLAVORWORLD_COLORS.accent} />
        </button>
        
        <h1 className="header-title">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        
        {unreadCount > 0 && (
          <button 
            className="mark-all-button"
            onClick={handleMarkAllAsRead}
          >
            Mark All Read
          </button>
        )}
        
        {unreadCount === 0 && <div className="header-placeholder" />}
      </div>

      {/* Notifications List */}
      <div className="notifications-container">
        {refreshing && (
          <div className="refresh-indicator">
            <Loader size={24} color={FLAVORWORLD_COLORS.primary} className="loading-spinner" />
          </div>
        )}
        
        {notifications.length === 0 ? (
          renderEmptyComponent()
        ) : (
          <div className="notifications-list">
            {notifications.map((item, index) => renderNotification(item, index))}
          </div>
        )}
        
        {/* Pull to refresh area */}
        <div className="pull-to-refresh" onClick={onRefresh}>
          <p>Pull to refresh</p>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (can be moved to a separate .css file)
const styles = `
.notifications-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${FLAVORWORLD_COLORS.background};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: ${FLAVORWORLD_COLORS.white};
  border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: ${FLAVORWORLD_COLORS.background};
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: ${FLAVORWORLD_COLORS.border};
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: ${FLAVORWORLD_COLORS.text};
  flex: 1;
  text-align: center;
  margin: 0 16px;
}

.mark-all-button {
  padding: 6px 12px;
  background-color: ${FLAVORWORLD_COLORS.primary};
  color: ${FLAVORWORLD_COLORS.white};
  border: none;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mark-all-button:hover {
  background-color: #E6951C;
}

.header-placeholder {
  width: 80px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  gap: 16px;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: ${FLAVORWORLD_COLORS.textLight};
  margin: 0;
}

.notifications-container {
  flex: 1;
  overflow-y: auto;
}

.refresh-indicator {
  display: flex;
  justify-content: center;
  padding: 16px;
  background-color: ${FLAVORWORLD_COLORS.white};
}

.notifications-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  background-color: ${FLAVORWORLD_COLORS.white};
  border-bottom: 1px solid ${FLAVORWORLD_COLORS.border};
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #F8F9FA;
}

.notification-item.unread {
  background-color: #F8F9FF;
  border-left: 3px solid ${FLAVORWORLD_COLORS.primary};
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.avatar-container {
  position: relative;
}

.notification-icon-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid ${FLAVORWORLD_COLORS.white};
}

.notification-text-container {
  flex: 1;
  margin-right: 8px;
}

.notification-message {
  font-size: 14px;
  color: ${FLAVORWORLD_COLORS.text};
  line-height: 1.4;
  margin: 0 0 4px 0;
}

.notification-message.unread-text {
  font-weight: 600;
}

.notification-time {
  font-size: 12px;
  color: ${FLAVORWORLD_COLORS.textLight};
  margin: 0 0 8px 0;
}

.post-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-top: 4px;
  object-fit: cover;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${FLAVORWORLD_COLORS.primary};
  margin-top: 6px;
  flex-shrink: 0;
}

.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-title {
  font-size: 20px;
  font-weight: bold;
  color: ${FLAVORWORLD_COLORS.text};
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 16px;
  color: ${FLAVORWORLD_COLORS.textLight};
  line-height: 1.4;
  margin: 0 0 24px 0;
  max-width: 400px;
}

.empty-button {
  background-color: ${FLAVORWORLD_COLORS.primary};
  color: ${FLAVORWORLD_COLORS.white};
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.empty-button:hover {
  background-color: #E6951C;
}

.pull-to-refresh {
  padding: 20px;
  text-align: center;
  color: ${FLAVORWORLD_COLORS.textLight};
  cursor: pointer;
}

.pull-to-refresh:hover {
  background-color: ${FLAVORWORLD_COLORS.border};
}

/* Responsive design */
@media (max-width: 768px) {
  .header {
    padding: 8px 12px;
  }
  
  .header-title {
    font-size: 16px;
    margin: 0 8px;
  }
  
  .notification-item {
    padding: 12px;
  }
  
  .empty-container {
    padding: 20px;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default NotificationsScreen;