import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, currentUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    
    try {
      console.log('Loading unread notifications count for user:', userId);
      const result = await notificationService.getUnreadCount(userId);
      
      if (result.success) {
        console.log('Unread count:', result.count);
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [currentUser]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [currentUser, loadUnreadCount]);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount, 
        loadUnreadCount, 
        decrementUnreadCount,
        resetUnreadCount 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};