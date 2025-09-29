import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  MoreHorizontal,
  Edit3,
  Settings,
  Users,
  BarChart3,
  Grid,
  User,
  ChevronRight,
  Plus,
  Check,
  Loader,
  Camera,
  Lock,
  AlertTriangle,
  X,
  Shield,
  HelpCircle,
  Info,
  Trash2
} from 'lucide-react';
import './ProfileScreen.css';
import UserAvatar from '../../components/common/UserAvatar';
import { useAuth } from '../../services/AuthContext';
import { recipeService } from '../../services/recipeService';
import { userService } from '../../services/UserService';
import { chatService } from '../../services/chatServices';
import { statisticsService } from '../../services/statisticsService';
import { groupService } from '../../services/groupService';
import PostComponent from '../../components/common/PostComponent';

const ProfileScreen = ({ route, navigation }) => {
  const { currentUser, logout } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('posts');
  const [stats, setStats] = useState({
    postsCount: 0,
    likesCount: 0,
    followersCount: 0
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const userId = route?.params?.userId || currentUser?.id || currentUser?._id;
  const isOwnProfile = userId === (currentUser?.id || currentUser?._id);

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
        console.log('Loading own profile');
      } else {
        console.log('Loading user profile');
        const userResult = await userService.getUserProfile(userId);
        
        if (userResult.success) {
          setProfileUser(userResult.data);
          console.log('User profile loaded successfully');
          
          await loadFollowStatus();
        } else {
          alert('Failed to load user profile');
          navigation.goBack();
          return;
        }
      }

      await loadUserPosts();
      
    } catch (error) {
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadFollowStatus = async () => {
    if (isOwnProfile || !currentUser?.id) return;
    
    try {
      console.log('Loading follow status');
      
      const result = await chatService.getFollowStatus(
        userId, 
        currentUser.id || currentUser._id
      );
      
      if (result.success) {
        setIsFollowing(result.data.isFollowing);
        setStats(prev => ({
          ...prev,
          followersCount: result.data.followersCount
        }));
        
        console.log('Follow status loaded successfully');
      }
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const loadUserGroupPosts = async () => {
    try {
      console.log('Loading user group posts with privacy filter');
      console.log(`Loading for user: ${userId}, Viewer: ${currentUser?.id || currentUser?._id}, isOwnProfile: ${isOwnProfile}`);
      
      const groupsResult = await groupService.getAllGroups(userId);
      
      if (!groupsResult.success) {
        return { success: false, data: [] };
      }

      const userGroups = groupsResult.data.filter(group => 
        groupService.isMember(group, userId)
      );

      console.log(`User is member of ${userGroups.length} groups`);
      
      let allGroupPosts = [];
      
      for (const group of userGroups) {
        try {
          if (group.isPrivate && !isOwnProfile) {
            const viewerUserId = currentUser?.id || currentUser?._id;
            const isViewerMember = groupService.isMember(group, viewerUserId);
            
            if (!isViewerMember) {
              console.log(`Skipping private group ${group.name} - viewer is not a member`);
              continue;
            }
          }
          
          const groupPostsResult = await groupService.getGroupPosts(group._id, userId);
          
          if (groupPostsResult.success && groupPostsResult.data) {
            const userPostsInGroup = groupPostsResult.data.filter(post => 
              post.userId === userId || 
              post.user?.id === userId || 
              post.user?._id === userId
            );
            
            const postsWithGroupInfo = userPostsInGroup.map(post => ({
              ...post,
              groupName: group.name,
              groupId: group._id,
              isPrivateGroup: group.isPrivate
            }));
            
            allGroupPosts = [...allGroupPosts, ...postsWithGroupInfo];
            console.log(`Found ${userPostsInGroup.length} posts in group ${group.name}`);
          }
        } catch (groupPostError) {
          console.log(`Could not load posts for group ${group.name}:`, groupPostError);
          continue;
        }
      }

      console.log(`Total accessible group posts found: ${allGroupPosts.length}`);
      
      return {
        success: true,
        data: allGroupPosts
      };
      
    } catch (error) {
      console.error('Error loading user group posts:', error);
      return { success: false, data: [] };
    }
  };

  const loadUserPosts = async () => {
    try {
      console.log('Loading user posts including group posts with privacy checks');
      console.log(`Loading for user: ${userId}, Viewer: ${currentUser?.id || currentUser?._id}, isOwnProfile: ${isOwnProfile}`);
      
      const regularPostsResult = await recipeService.getAllRecipes();
      let allPosts = [];
      
      if (regularPostsResult.success) {
        const regularPosts = Array.isArray(regularPostsResult.data) ? regularPostsResult.data : [];
        const userRegularPosts = regularPosts.filter(post => 
          post.userId === userId || 
          post.user?.id === userId || 
          post.user?._id === userId
        );
        
        const markedRegularPosts = userRegularPosts.map(post => ({
          ...post,
          postSource: 'personal'
        }));
        
        allPosts = [...markedRegularPosts];
        console.log('Regular posts loaded:', markedRegularPosts.length);
      }

      try {
        const groupPostsResult = await loadUserGroupPosts();
        
        if (groupPostsResult.success && groupPostsResult.data) {
          const userGroupPosts = groupPostsResult.data.map(post => ({
            ...post,
            postSource: 'group'
          }));
          
          allPosts = [...allPosts, ...userGroupPosts];
          console.log('Accessible group posts loaded:', userGroupPosts.length);
        }
      } catch (groupError) {
        console.log('Could not load group posts:', groupError);
      }

      console.log('Total user posts loaded (with privacy filtering):', allPosts.length);

      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setUserPosts(sortedPosts);
      await calculateUserStatistics(sortedPosts);
      
    } catch (error) {
      console.error('Error loading user posts:', error);
      alert('Failed to load posts');
    }
  };

  const calculateUserStatistics = async (posts) => {
    try {
      console.log('Calculating user statistics using statistics service');
      
      const statsData = statisticsService.processRealUserData(posts, userId);
      
      let followersCount = 0;
      try {
        const followersResult = await statisticsService.getFollowersGrowth(userId);
        if (followersResult.success && followersResult.data) {
          followersCount = followersResult.currentFollowersCount || 0;
          console.log('Real followers data retrieved successfully');
        } else {
          console.log('No followers data available from server');
        }
      } catch (followersError) {
        console.log('Could not fetch followers data from server');
        followersCount = 0;
      }

      setStats({
        postsCount: statsData.totalPosts,
        likesCount: statsData.totalLikes,
        followersCount: followersCount
      });

      console.log('Statistics calculated:', {
        posts: statsData.totalPosts,
        likes: statsData.totalLikes,
        followers: followersCount
      });

    } catch (error) {
      const totalLikes = posts.reduce((sum, post) => 
        sum + (post.likes ? post.likes.length : 0), 0
      );

      setStats(prev => ({
        ...prev,
        postsCount: posts.length,
        likesCount: totalLikes
      }));
    }
  };

  const handleFollowToggle = async () => {
    if (isFollowLoading || !currentUser?.id) return;
    
    setIsFollowLoading(true);
    try {
      console.log('Toggling follow status');
      
      const result = await chatService.toggleFollow(
        userId,
        currentUser.id || currentUser._id,
        isFollowing
      );
      
      if (result.success) {
        setIsFollowing(!isFollowing);
        setStats(prev => ({
          ...prev,
          followersCount: result.data.followersCount
        }));
        
        alert(isFollowing ? 'Unfollowed successfully' : 'Following successfully!');
        console.log('Follow status updated successfully');
      } else {
        alert(result.message || 'Failed to update follow status');
      }
    } catch (error) {
      alert('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (isOwnProfile) {
      alert('You cannot chat with yourself!');
      return;
    }

    if (!profileUser) {
      alert('User information not available');
      return;
    }

    setStartingChat(true);

    try {
      console.log('Starting chat with user');
      
      const result = await chatService.getOrCreatePrivateChat(userId);
      
      if (result.success) {
        navigation.navigate('ChatConversation', {
          chatId: result.data._id,
          otherUser: {
            userId: userId,
            userName: profileUser.fullName || profileUser.name || 'Unknown User',
            UserAvatar: profileUser.avatar,
            isOnline: false
          }
        });
      } else {
        alert(result.message || 'Failed to start chat');
      }
    } catch (error) {
      alert('Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  const handleShowFollowers = async () => {
    try {
      navigation.navigate('FollowersList', {
        userId: userId,
        title: `${profileUser?.fullName || 'User'}'s Followers`,
        listType: 'followers'
      });
    } catch (error) {
      console.error('Error showing followers:', error);
    }
  };

  const handleViewStatistics = () => {
    console.log('Navigating to UserStatistics');
    
    navigation.navigate('UserStatistics', {
      currentUser: profileUser,
      userPosts: userPosts,
      userId: userId
    });
  };

  const handleRefreshData = useCallback(() => {
    loadUserPosts();
  }, [userId]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleMyGroups = () => {
    navigation.navigate('Groups');
  };

  const handleSettings = () => {
    setShowSettingsModal(true);
  };

  const handleDeleteAccount = () => {
    setShowSettingsModal(false);
    
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your recipes, chats, and data.')) {
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      alert('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Attempting to delete user account');
      
      const result = await userService.deleteUserAccount(userId, deletePassword);
      
      if (result.success) {
        alert('Your account has been permanently deleted. Thank you for using FlavorWorld.');
        setShowDeleteModal(false);
        logout();
      } else {
        alert(result.message || 'Failed to delete account. Please try again or contact support.');
      }
      
    } catch (error) {
      alert('An error occurred while deleting your account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFilteredPosts = () => {
    switch (selectedTab) {
      case 'personal':
        return userPosts.filter(post => post.postSource === 'personal');
      case 'groups':
        return userPosts.filter(post => post.postSource === 'group');
      case 'posts':
      default:
        return userPosts;
    }
  };

  const renderProfileHeader = () => (
    <div className="profile-header">
      <div className="profile-image-container">
        <UserAvatar
          uri={profileUser?.avatar || profileUser?.userAvatar}
          name={profileUser?.fullName || profileUser?.name}
          size={120}
        />
      </div>

      <div className="profile-info">
        <h2 className="profile-name">
          {profileUser?.fullName || profileUser?.name || 'Anonymous Chef'}
        </h2>
        
        <p className="profile-email">
          {profileUser?.email || 'No email'}
        </p>

        <p className="profile-bio">
          {profileUser?.bio || 'Passionate about cooking and sharing delicious recipes!'}
        </p>
      </div>

      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-number">{stats.postsCount}</span>
          <span className="stat-label">Recipes</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-number">{stats.likesCount}</span>
          <span className="stat-label">Total Likes</span>
        </div>
        
        <div className="stat-item" onClick={handleShowFollowers}>
          <span className="stat-number">{stats.followersCount}</span>
          <span className="stat-label">Followers</span>
        </div>
      </div>

      <div className="action-buttons">
        {isOwnProfile ? (
          <>
            <button className="edit-button" onClick={handleEditProfile}>
              <Edit3 size={18} />
              <span>Edit Profile</span>
            </button>
            
            <button className="settings-button" onClick={handleSettings}>
              <Settings size={18} />
            </button>
          </>
        ) : (
          <>
            <button 
              className={`chat-button ${startingChat ? 'disabled' : ''}`}
              onClick={handleStartChat}
              disabled={startingChat}
            >
              {startingChat ? (
                <Loader size={18} className="loading-spinner" />
              ) : (
                <MessageCircle size={18} />
              )}
              <span>{startingChat ? 'Starting...' : 'Chat'}</span>
            </button>

            <button 
              className={`follow-button ${isFollowing ? 'following' : ''} ${isFollowLoading ? 'disabled' : ''}`}
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <Loader size={16} className="loading-spinner" />
              ) : (
                <>
                  {isFollowing ? <Check size={16} /> : <Plus size={16} />}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {isOwnProfile && (
        <div className="quick-actions">
          <div className="quick-action-item" onClick={handleMyGroups}>
            <div className="quick-action-icon">
              <Users size={20} />
            </div>
            <span className="quick-action-text">My Groups</span>
            <ChevronRight size={16} />
          </div>

          <div className="quick-action-item" onClick={() => navigation.navigate('ChatList')}>
            <div className="quick-action-icon">
              <MessageCircle size={20} />
            </div>
            <span className="quick-action-text">My Chats</span>
            <ChevronRight size={16} />
          </div>

          <div className="quick-action-item" onClick={handleViewStatistics}>
            <div className="quick-action-icon">
              <BarChart3 size={20} />
            </div>
            <span className="quick-action-text">My Statistics</span>
            <ChevronRight size={16} />
          </div>
        </div>
      )}
    </div>
  );

  const renderTabBar = () => (
    <div className="tab-bar">
      <button
        className={`tab ${selectedTab === 'posts' ? 'active' : ''}`}
        onClick={() => setSelectedTab('posts')}
      >
        <Grid size={20} />
        <span>All Recipes</span>
      </button>

      <button
        className={`tab ${selectedTab === 'personal' ? 'active' : ''}`}
        onClick={() => setSelectedTab('personal')}
      >
        <User size={20} />
        <span>Personal</span>
      </button>

      <button
        className={`tab ${selectedTab === 'groups' ? 'active' : ''}`}
        onClick={() => setSelectedTab('groups')}
      >
        <Users size={20} />
        <span>Groups</span>
      </button>
    </div>
  );

  const renderPost = (item, index) => (
    <div key={item._id || item.id || index}>
      {item.postSource === 'group' && (
        <div className={`group-post-badge ${item.isPrivateGroup ? 'private' : ''}`}>
          {item.isPrivateGroup ? <Lock size={14} /> : <Users size={14} />}
          <span>
            Posted in {item.groupName || 'Group'} 
            {item.isPrivateGroup && ' (Private)'}
          </span>
        </div>
      )}
      
      <PostComponent
        post={item}
        navigation={navigation}
        onRefreshData={handleRefreshData}
      />
    </div>
  );

  const renderEmptyState = () => (
    <div className="empty-state">
      <Camera size={80} />
      <h3 className="empty-title">
        {selectedTab === 'posts' ? 'No Recipes Yet' : 
         selectedTab === 'personal' ? 'No Personal Recipes' : 'No Group Recipes'}
      </h3>
      <p className="empty-subtitle">
        {selectedTab === 'posts' && isOwnProfile ? 
         'Share your first delicious recipe!' : 
         selectedTab === 'personal' ? 'Create your first personal recipe!' :
         'Join groups and start sharing recipes!'}
      </p>
    </div>
  );

  const renderSettingsModal = () => (
    showSettingsModal && (
      <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Settings</h2>
            <button onClick={() => setShowSettingsModal(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="settings-list">
            <div className="setting-item">
              <Shield size={20} />
              <span className="setting-text">Privacy</span>
              <ChevronRight size={16} />
            </div>

            <div className="setting-item">
              <HelpCircle size={20} />
              <span className="setting-text">Help & Support</span>
              <ChevronRight size={16} />
            </div>

            <div className="setting-item">
              <Info size={20} />
              <span className="setting-text">About</span>
              <ChevronRight size={16} />
            </div>

            <div className="setting-divider" />

            <div className="setting-item danger" onClick={handleDeleteAccount}>
              <Trash2 size={20} />
              <span className="setting-text">Delete Account</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderDeleteModal = () => (
    showDeleteModal && (
      <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
        <div className="delete-modal" onClick={e => e.stopPropagation()}>
          <div className="delete-modal-header">
            <AlertTriangle size={48} />
            <h2 className="delete-modal-title">Delete Account</h2>
            <p className="delete-modal-subtitle">
              This action cannot be undone. All your recipes, chats, and data will be permanently removed.
            </p>
          </div>

          <div className="delete-modal-content">
            <label className="password-label">Enter your password to confirm:</label>
            <input
              type="password"
              className="password-input"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              disabled={isDeleting}
            />
          </div>

          <div className="delete-modal-buttons">
            <button 
              className="cancel-button"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
              }}
              disabled={isDeleting}
            >
              Cancel
            </button>

            <button 
              className={`delete-button ${isDeleting ? 'disabled' : ''}`}
              onClick={confirmDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader size={20} className="loading-spinner" />
              ) : (
                'Delete Forever'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="profile-screen">
        <div className="loading-container">
          <Loader size={48} className="loading-spinner" />
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="header">
        <button className="back-button" onClick={() => navigation.goBack()}>
          <ArrowLeft size={24} />
        </button>
        
        <h1 className="header-title">
          {isOwnProfile ? 'My Profile' : profileUser?.fullName || 'Profile'}
        </h1>
        
        <div className="header-right">
          {!isOwnProfile && (
            <button 
              className="header-chat-button"
              onClick={handleStartChat}
              disabled={startingChat}
            >
              {startingChat ? (
                <Loader size={20} className="loading-spinner" />
              ) : (
                <MessageCircle size={20} />
              )}
            </button>
          )}
          
          <button className="menu-button">
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      <div className="content">
        {renderProfileHeader()}
        {renderTabBar()}
        
        <div className="posts-container">
          {getFilteredPosts().length === 0 ? (
            renderEmptyState()
          ) : (
            getFilteredPosts().map((item, index) => renderPost(item, index))
          )}
        </div>
      </div>

      {renderSettingsModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default ProfileScreen;