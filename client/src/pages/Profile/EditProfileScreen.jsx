import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  Lock, 
  ChevronRight, 
  Check, 
  X, 
  Loader 
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import UserAvatar from '../../common/UserAvatar';
import PasswordInput from '../../common/PasswordInput';
import { userService } from '../../../services/userService';
import './EditProfileScreen.css';

const EditProfileScreen = ({ navigation }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setNewAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = currentUser?.avatar;

      if (newAvatarFile) {
        setIsUploadingAvatar(true);
        const avatarResult = await userService.updateAvatar(newAvatarFile);
        
        if (avatarResult.success) {
          avatarUrl = avatarResult.data.url;
          console.log('Avatar uploaded successfully');
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

      console.log('Sending profile update');

      const result = await userService.updateProfile(profileData);

      if (result.success) {
        await updateUserProfile({
          fullName: fullName.trim(),
          name: fullName.trim(),
          bio: bio.trim(),
          avatar: avatarUrl,
        });

        alert('Your profile has been updated successfully');
        navigation.goBack();
      } else {
        alert(result.message || 'Failed to update profile');
        return;
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
        setIsLoading(false);
        
        alert('Your password has been changed successfully');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.message || 'Failed to change password');
        return;
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Change password error occurred');
      alert(error.message || 'Failed to change password');
    }
  };

  const renderPasswordModal = () => (
    showPasswordModal && (
      <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Change Password</h2>
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="modal-close-button"
            >
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="input-group">
              <label className="label">Current Password</label>
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
                className="password-input-style"
              />
            </div>

            <div className="input-group">
              <label className="label">New Password</label>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                className="password-input-style"
              />
            </div>

            <div className="input-group">
              <label className="label">Confirm New Password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                className="password-input-style"
              />
            </div>

            <button
              className={`save-button ${isLoading ? 'disabled' : ''}`}
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size={20} className="loading-spinner" />
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="edit-profile-screen">
      <div className="header">
        <button 
          className="back-button" 
          onClick={() => navigation.goBack()}
        >
          <ArrowLeft size={24} />
        </button>
        
        <h1 className="header-title">Edit Profile</h1>
        
        <button
          className={`save-header-button ${isLoading ? 'disabled' : ''}`}
          onClick={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader size={20} className="loading-spinner" />
          ) : (
            'Save'
          )}
        </button>
      </div>

      <div className="content">
        <div className="avatar-section">
          <div className="avatar-container">
            <UserAvatar
              uri={avatarPreview || currentUser?.avatar}
              name={currentUser?.fullName || currentUser?.name}
              size={120}
            />
            
            {isUploadingAvatar && (
              <div className="uploading-overlay">
                <Loader size={40} className="loading-spinner" />
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          
          <button 
            className="change-photo-button"
            onClick={handlePickImage}
            disabled={isUploadingAvatar}
          >
            <Camera size={20} />
            <span>Change Photo</span>
          </button>
        </div>

        <div className="form-section">
          <h2 className="section-title">Profile Information</h2>
          
          <div className="input-group">
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="input-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input input-disabled"
              value={currentUser?.email || ''}
              readOnly
              placeholder="Email address"
            />
            <span className="help-text">Email cannot be changed</span>
          </div>

          <div className="input-group">
            <label className="label">Bio</label>
            <textarea
              className="input text-area"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself and your cooking passion..."
              rows={4}
              maxLength={500}
            />
            <span className="character-count">{bio.length}/500</span>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">Security</h2>
          
          <button 
            className="password-button"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="password-button-content">
              <Lock size={20} />
              <span className="password-button-text">Change Password</span>
            </div>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="button-section">
          <button
            className={`save-button ${isLoading ? 'disabled' : ''}`}
            onClick={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader size={20} className="loading-spinner" />
            ) : (
              <>
                <Check size={20} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {renderPasswordModal()}
    </div>
  );
};

export default EditProfileScreen;