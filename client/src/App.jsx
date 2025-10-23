import React from 'react';
import { AuthProvider, useAuth } from './services/AuthContext';
import { ChatSocketProvider } from './contexts/ChatSocketProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import AppNavigator from './navigation/AppNavigator';

const AppContent = () => {
  const { currentUser } = useAuth();
  
  return (
    <ChatSocketProvider>
      <NotificationProvider currentUser={currentUser}>
        <AppNavigator />
      </NotificationProvider>
    </ChatSocketProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}