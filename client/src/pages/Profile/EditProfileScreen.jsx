import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Camera,
  Loader2,
  Lock,
  X,
  Check
} from 'lucide-react';
import './EditProfileScreen.css';
import { useAuth } from '../../services/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import { userService } from '../../services/userService';

const EditProfileScreen = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile } = useAuth();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [newAvatar, setNewAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setNewAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = currentUser?.avatar;

      if (newAvatar) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', newAvatar);
        
        const avatarResult = await userService.updateAvatar(formData);
        
        if (avatarResult.success) {
          avatarUrl = avatarResult.data.url;
        } else {
          alert(avatarResult.message || 'Failed to upload avatar');
          return;
        }
        setIsUploadingAvatar(false);
      }

      const profileData = {
        userId: currentUser?.id || currentUser?._id,
        fullName: fullName.trim(),
        bio: bio.trim(),
      };

      if (avatarUrl && avatarUrl !== currentUser?.avatar) {
        profileData.avatar = avatarUrl;
      }

      const result = await userService.updateProfile(profileData);

      if (result.success) {
        await updateUserProfile({
          fullName: fullName.trim(),
          name: fullName.trim(),
          bio: bio.trim(),
          avatar: avatarUrl,
        });

        alert('Your profile has been updated successfully');
        navigate(-1);
      } else {
        alert(result.message || 'Failed to update profile');
      }
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      alert('Password must contain at least 8 characters, including uppercase and lowercase letters, a number and a special character');
      return;
    }

    setIsLoading(true);

    try {
      const result = await userService.changePassword({
        userId: currentUser?.id || currentUser?._id,
        currentPassword,
        newPassword
      });

      if (result.success) {
        alert('Your password has been changed successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.message || 'Failed to change password');
      }
    } catch (error) {
      alert(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-profile-screen">
      {/* Header */}
      <header className="edit-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>Edit Profile</h1>
        
        <button
          className="save-header-btn"
          onClick={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Save'}
        </button>
      </header>

      <div className="edit-content">
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-container">
            <UserAvatar
              uri={avatarPreview || currentUser?.avatar}
              name={currentUser?.fullName || currentUser?.name}
              size={120}
            />
            
            {isUploadingAvatar && (
              <div className="uploading-overlay">
                <Loader2 className="spinner" size={40} />
              </div>
            )}
          </div>
          
          <label className="change-photo-btn">
            <Camera size={20} />
            <span>Change Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              disabled={isUploadingAvatar}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Form Section */}
        <div className="form-section">
          <h2>Profile Information</h2>
          
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="input-disabled"
            />
            <span className="help-text">Email cannot be changed</span>
          </div>

          <div className="input-group">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your cooking passion..."
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{bio.length}/500</span>
          </div>
        </div>

        {/* Security Section */}
        <div className="form-section">
          <h2>Security</h2>
          
          <button 
            className="password-btn"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="password-btn-content">
              <Lock size={20} />
              <span>Change Password</span>
            </div>
            <span className="arrow">→</span>
          </button>
        </div>

        {/* Save Button */}
        <div className="button-section">
          <button
            className="save-btn"
            onClick={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <>
                <Check size={20} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                className="modal-save-btn"
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="spinner" size={20} />
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfileScreen;