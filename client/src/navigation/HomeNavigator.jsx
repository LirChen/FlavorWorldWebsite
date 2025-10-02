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
import EditProfileScreen from '../pages/Profile/EditProfileScreen';
import GroupDetailsScreen from '../pages/Groups/GroupDetailsScreen';
import GroupAdminRequestsScreen from '../pages/Groups/GroupAdminRequestsScreen';
import ChatConversationScreen from '../pages/Chats/ChatConversationScreen';
import GroupSettingsScreen from '../pages/Groups/GroupSettingsScreen';
import GroupMembersScreen from '../pages/Groups/GroupMembersScreen';
import HomeScreen from '../pages/Home/HomeScreen';

export default function HomeNavigator() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route 
        path="/" 
        element={<Navigate to="/home" replace />} 
      />

      {/* Main Pages */}
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/search" element={<SearchScreen />} />
      <Route path="/notifications" element={<NotificationsScreen />} />

      {/* Post Routes */}
      <Route path="/edit-post" element={<EditPostScreen />} />
      <Route path="/post/:postId" element={<PostModalScreen />} />

      {/* Profile Routes */}
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/profile/edit" element={<EditProfileScreen />} />
      <Route path="/profile/statistics" element={<UserStatisticsScreen />} />
      
      {/* Chat Routes */}
      <Route path="/chats" element={<ChatListScreen />} />
      <Route path="/chat/search" element={<UserSearchScreen />} />
      <Route path="/chat/:chatId" element={<ChatConversationScreen />} />
      
      {/* Group Chat Routes */}
      <Route path="/group-chat/create" element={<GroupChatCreationScreen />} />
      <Route path="/group-chat/:chatId" element={<GroupChatConversationScreen />} />
      <Route path="/group-chat/:chatId/settings" element={<GroupChatSettingsScreen />} />
      
      {/* Groups Routes */}
      <Route path="/groups" element={<GroupsScreen />} />
      <Route path="/group/create" element={<CreateGroupComponent />} />
      <Route path="/group/:groupId" element={<GroupDetailsScreen />} />
      <Route path="/group/:groupId/settings" element={<GroupSettingsScreen />} />
      <Route path="/group/:groupId/members" element={<GroupMembersScreen />} />
      <Route path="/group/:groupId/requests" element={<GroupAdminRequestsScreen />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}