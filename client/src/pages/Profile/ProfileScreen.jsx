import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  MessageCircle,
  Calendar,
  MoreVertical,
  UserPlus,
  UserMinus,
  Flag,
  Ban,
  Loader2,
  Users,
  Heart,
  Grid,
  User,
  BarChart3,
  Trash2,
  HelpCircle,
  Info,
  Shield,
  X
} from 'lucide-react';
import './ProfileScreen.css';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import PostComponent from '../../components/common/PostComponent';
import { recipeService } from '../../services/recipeService';
import { userService } from '../../services/userService';
import { chatService } from '../../services/chatServices';
import { statisticsService } from '../../services/statisticsService';
import { groupService } from '../../services/groupService';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();
  const userId = searchParams.get('userId') || currentUser?.id || currentUser?._id;
  
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
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const isOwnProfile = userId === (currentUser?.id || currentUser?._id);

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        setProfileUser(currentUser);
      } else {
        const userResult = await userService.getUserProfile(userId);
        
        if (userResult.success) {
          setProfileUser(userResult.data);
          await loadFollowStatus();
        } else {
          alert('Failed to load user profile');
          navigate(-1);
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
      }
    } catch (error) {
      console.error('Failed to load follow status:', error);
    }
  };

  const loadUserGroupPosts = async () => {
    try {
      const groupsResult = await groupService.getAllGroups(userId);
      
      if (!groupsResult.success) {
        return { success: false, data: [] };
      }

      const userGroups = groupsResult.data.filter(group => 
        groupService.isMember(group, userId)
      );

      let allGroupPosts = [];
      
      for (const group of userGroups) {
        try {
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
              groupId: group._id
            }));
            
            allGroupPosts = [...allGroupPosts, ...postsWithGroupInfo];
          }
        } catch (groupPostError) {
          continue;
        }
      }

      return {
        success: true,
        data: allGroupPosts
      };
      
    } catch (error) {
      return { success: false, data: [] };
    }
  };

  const loadUserPosts = async () => {
    try {
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
      }

      try {
        const groupPostsResult = await loadUserGroupPosts();
        
        if (groupPostsResult.success && groupPostsResult.data) {
          const userGroupPosts = groupPostsResult.data.map(post => ({
            ...post,
            postSource: 'group'
          }));
          
          allPosts = [...allPosts, ...userGroupPosts];
        }
      } catch (groupError) {
        console.error('Could not load group posts:', groupError);
      }

      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setUserPosts(sortedPosts);
      await calculateUserStatistics(sortedPosts);
      
    } catch (error) {
      console.error('Failed to load user posts:', error);
    }
  };

  const calculateUserStatistics = async (posts) => {
    try {
      const statsData = statisticsService.processRealUserData(posts, userId);
      
      let followersCount = 0;
      try {
        const followersResult = await statisticsService.getFollowersGrowth(userId);
        if (followersResult.success && followersResult.data) {
          followersCount = followersResult.currentFollowersCount || 0;
        }
      } catch (followersError) {
        followersCount = 0;
      }

      setStats({
        postsCount: statsData.totalPosts,
        likesCount: statsData.totalLikes,
        followersCount: followersCount
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
      const result = await chatService.getOrCreatePrivateChat(userId);
      
      if (result.success) {
        navigate(`/chat/${result.data._id}`, {
          state: {
            otherUser: {
              userId: userId,
              userName: profileUser.fullName || profileUser.name || 'Unknown User',
              userAvatar: profileUser.avatar,
              isOnline: false
            }
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

  const handleDeleteAccount = () => {
    setShowSettingsModal(false);
    
    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your recipes, chats, and data.')) {
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

  const handleRefreshData = useCallback(() => {
    loadUserPosts();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="profile-screen">
        <header className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Profile</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="profile-screen">
      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>{isOwnProfile ? 'My Profile' : profileUser?.fullName || 'Profile'}</h1>
        
        <div className="header-actions">
          {isOwnProfile ? (
            <button className="settings-btn" onClick={() => setShowSettingsModal(true)}>
              <Settings size={20} />
            </button>
          ) : (
            <button className="options-btn" onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
              <MoreVertical size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Options Menu for Other Users */}
      {showOptionsMenu && (
        <div className="options-menu">
          <button onClick={() => { alert('Report submitted'); setShowOptionsMenu(false); }}>
            <Flag size={18} />
            <span>Report User</span>
          </button>
          <button onClick={() => { alert('User blocked'); setShowOptionsMenu(false); }} className="danger">
            <Ban size={18} />
            <span>Block User</span>
          </button>
          <button onClick={() => setShowOptionsMenu(false)}>
            Cancel
          </button>
        </div>
      )}

      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-info-section">
          <div className="profile-top">
            <UserAvatar
              uri={profileUser?.avatar || profileUser?.userAvatar}
              name={profileUser?.fullName || profileUser?.name}
              size={120}
            />
          </div>

          <div className="profile-details">
            <h2>{profileUser?.fullName || profileUser?.name || 'Anonymous Chef'}</h2>
            <p className="email">{profileUser?.email || 'No email'}</p>
            <p className="bio">{profileUser?.bio || 'Passionate about cooking and sharing delicious recipes!'}</p>
            
            <div className="profile-meta">
              <div className="meta-item">
                <Calendar size={16} />
                <span>Joined {new Date(profileUser?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-container">
            <div className="stat-item">
              <strong>{stats.postsCount}</strong>
              <span>Recipes</span>
            </div>
            <div className="stat-item">
              <strong>{stats.likesCount}</strong>
              <span>Total Likes</span>
            </div>
            <button 
              className="stat-item"
              onClick={() => navigate(`/profile/followers?userId=${userId}`)}
            >
              <strong>{stats.followersCount}</strong>
              <span>Followers</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {isOwnProfile ? (
              <button className="edit-btn" onClick={() => navigate('/profile/edit')}>
                <User size={18} />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  className={`follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <Loader2 className="spinner" size={18} />
                  ) : isFollowing ? (
                    <><UserMinus size={18} /><span>Unfollow</span></>
                  ) : (
                    <><UserPlus size={18} /><span>Follow</span></>
                  )}
                </button>
                
                <button 
                  className="message-btn" 
                  onClick={handleStartChat}
                  disabled={startingChat}
                >
                  {startingChat ? (
                    <Loader2 className="spinner" size={18} />
                  ) : (
                    <><MessageCircle size={18} /><span>Message</span></>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Quick Actions (Own Profile Only) */}
          {isOwnProfile && (
            <div className="quick-actions">
              <button onClick={() => navigate('/groups')}>
                <Users size={20} />
                <span>My Groups</span>
                <span className="arrow">→</span>
              </button>
              
              <button onClick={() => navigate('/chats')}>
                <MessageCircle size={20} />
                <span>My Chats</span>
                <span className="arrow">→</span>
              </button>
              
              <button onClick={() => navigate(`/profile/statistics?userId=${userId}`)}>
                <BarChart3 size={20} />
                <span>My Statistics</span>
                <span className="arrow">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={selectedTab === 'posts' ? 'active' : ''}
            onClick={() => setSelectedTab('posts')}
          >
            <Grid size={20} />
            <span>All Recipes</span>
          </button>
          <button
            className={selectedTab === 'personal' ? 'active' : ''}
            onClick={() => setSelectedTab('personal')}
          >
            <User size={20} />
            <span>Personal</span>
          </button>
          <button
            className={selectedTab === 'groups' ? 'active' : ''}
            onClick={() => setSelectedTab('groups')}
          >
            <Users size={20} />
            <span>Groups</span>
          </button>
        </div>

        {/* Posts */}
        <div className="posts-section">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <h3>
                {selectedTab === 'posts' ? 'No Recipes Yet' : 
                 selectedTab === 'personal' ? 'No Personal Recipes' : 'No Group Recipes'}
              </h3>
              <p>
                {selectedTab === 'posts' && isOwnProfile ? 
                 'Share your first delicious recipe!' : 
                 selectedTab === 'personal' ? 'Create your first personal recipe!' :
                 'Join groups and start sharing recipes!'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post._id || post.id}>
                {post.postSource === 'group' && (
                  <div className="group-badge">
                    <Users size={14} />
                    <span>Posted in {post.groupName || 'Group'}</span>
                  </div>
                )}
                <PostComponent
                  post={post}
                  navigation={navigate}
                  onRefreshData={handleRefreshData}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button onClick={() => setShowSettingsModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="settings-list">
              <button className="setting-item">
                <Shield size={20} />
                <span>Privacy</span>
                <span className="arrow">→</span>
              </button>

              <button className="setting-item">
                <HelpCircle size={20} />
                <span>Help & Support</span>
                <span className="arrow">→</span>
              </button>

              <button className="setting-item">
                <Info size={20} />
                <span>About</span>
                <span className="arrow">→</span>
              </button>

              <div className="divider" />

              <button className="setting-item danger" onClick={handleDeleteAccount}>
                <Trash2 size={20} />
                <span>Delete Account</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="delete-header">
              <div className="warning-icon">⚠️</div>
              <h3>Delete Account</h3>
              <p>This action cannot be undone. All your recipes, chats, and data will be permanently removed.</p>
            </div>

            <div className="delete-content">
              <label>Enter your password to confirm:</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                disabled={isDeleting}
              />
            </div>

            <div className="delete-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button 
                className="delete-btn"
                onClick={confirmDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="spinner" size={20} /> : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;