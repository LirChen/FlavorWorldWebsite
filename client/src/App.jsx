import React from 'react';
import { AuthProvider } from './services/AuthContext';
import { ChatSocketProvider } from './contexts/ChatSocketProvider';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ChatSocketProvider>
        <AppNavigator />
      </ChatSocketProvider>
    </AuthProvider>
  );
}