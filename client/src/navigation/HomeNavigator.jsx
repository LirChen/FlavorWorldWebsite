import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EditPostScreen from '../pages/posts/EditPostScreen';
import SearchScreen from '../pages/Search/SearchScreen';
import ChatListScreen from '../pages/Chats/ChatListScreen';
import UserStatisticsScreen from '../pages/Profile/UserStatisticsScreen';
import GroupChatCreationScreen from '../pages/Chats/GroupChatCreationScreen';
import GroupChatConversationScreen from '../pages/Chats/GroupChatConversationScreen';
import UserSearchScreen from '../pages/Chats/UserSearchScreen';
import GroupChatSettingsScreen from '../pages/Chats/GroupChatSettingsScreen';
import NotificationsScreen from '../pages/Notifications/NotificationsScreen';
import PostModalScreen from '../pages/posts/PostModalScreen';
import CreateGroupComponent from '../pages/Groups/CreateGroupComponent';
import GroupsScreen from '../pages/Groups/GroupsScreen';
import ProfileScreen from '../pages/Profile/ProfileScreen';
import GroupDetailsScreen from '../pages/Groups/GroupDetailsScreen';
import GroupAdminRequestsScreen from '../pages/Groups/GroupAdminRequestsScreen';
import ChatConversationScreen from '../pages/Chats/ChatConversationScreen';
import GroupSettingsScreen from '../pages/Groups/GroupSettingsScreen';
import GroupMembersScreen from '../pages/Groups/GroupMembersScreen';
import HomeScreen from '../pages/Home/HomeScreen';

export default function HomeNavigator() {
  return (
    <Routes>
       <Route 
                path="/" 
                element={<Navigate to="/home" replace />} 
              />
      <Route 
        path="/home" 
        element={<HomeScreen />} 
      />
      
      <Route 
        path="/search" 
        element={<SearchScreen />} 
      />
      
      <Route 
        path="/notifications" 
        element={<NotificationsScreen />} 
      />
      
      <Route 
        path="/profile" 
        element={<ProfileScreen />} 
      />

      <Route 
        path="/edit-profile" 
        element={<EditPostScreen />} 
      />

      <Route 
        path="/user-statistics" 
        element={<UserStatisticsScreen />} 
      />

      <Route 
        path="/edit-post" 
        element={<EditPostScreen />}
      />

      <Route 
        path="/groups" 
        element={<GroupsScreen />} 
      />

      <Route 
        path="/group-details" 
        element={<GroupDetailsScreen />} 
      />

      <Route 
        path="/group-admin-requests" 
        element={<GroupAdminRequestsScreen />} 
      />

      <Route 
        path="/group-members" 
        element={<GroupMembersScreen />}
      />

      <Route 
        path="/create-group" 
        element={<CreateGroupComponent />} 
      />

      <Route 
        path="/chat-list" 
        element={<ChatListScreen />} 
      />

      <Route 
        path="/chat-conversation" 
        element={<ChatConversationScreen />} 
      />

      <Route 
        path="/group-settings" 
        element={<GroupSettingsScreen />}
      />

      <Route 
        path="/group-chat-creation" 
        element={<GroupChatCreationScreen />} 
      />

      <Route 
        path="/group-chat-conversation" 
        element={<GroupChatConversationScreen />} 
      />

      <Route 
        path="/user-search" 
        element={<UserSearchScreen />} 
      />

      <Route 
        path="/group-chat-settings" 
        element={<GroupChatSettingsScreen />}
      />

      <Route 
        path="/post-modal" 
        element={<PostModalScreen />}
      />

    </Routes>
  );
}