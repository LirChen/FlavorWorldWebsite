import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';
import './GroupSettingsScreen.css';

const CATEGORIES = [
  'General', 'Italian', 'Asian', 'Mediterranean', 'Mexican', 
  'Indian', 'French', 'American', 'Vegetarian', 'Vegan', 
  'Desserts', 'Baking', 'Healthy', 'Quick Meals', 'Other'
];

const GroupSettingsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { groupId, groupData } = location.state || {};
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: groupData?.name || '',
    description: groupData?.description || '',
    category: groupData?.category || 'General',
    rules: groupData?.rules || '',
    isPrivate: groupData?.isPrivate || false,
    allowMemberPosts: groupData?.settings?.allowMemberPosts ?? groupData?.allowMemberPosts ?? true,
    requireApproval: groupData?.settings?.requireApproval ?? groupData?.requireApproval ?? false,
    allowInvites: groupData?.settings?.allowInvites ?? groupData?.allowInvites ?? true,
  });
  
  const [selectedImage, setSelectedImage] = useState(groupData?.image || null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isCreator = groupData ? groupService.isCreator(groupData, currentUser?.id || currentUser?._id) : false;
  const isAdmin = groupData ? groupService.isAdmin(groupData, currentUser?.id || currentUser?._id) : false;
  const canEdit = isCreator || isAdmin;
  
  useEffect(() => {
    if (!groupId || !groupData) {
      navigate('/groups');
      return;
    }
    
    if (!canEdit) {
      alert('Access Denied: Only group admins can edit group settings');
      navigate(-1);
    }
  }, [canEdit, groupId, groupData, navigate]);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Error: Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Error: Please select a valid image file');
        return;
      }
      
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    const choice = window.prompt(
      'Image Options:\n1. Select New Image\n2. Remove Current Image\n\nEnter 1 or 2:'
    );
    
    if (choice === '1') {
      fileInputRef.current?.click();
    } else if (choice === '2') {
      setSelectedImage(null);
      setSelectedImageFile(null);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.name.trim()) {
      alert('Error: Group name is required');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        rules: formData.rules.trim(),
        isPrivate: formData.isPrivate,
        allowMemberPosts: formData.allowMemberPosts,
        requireApproval: formData.isPrivate ? formData.requireApproval : false,
        allowInvites: formData.allowInvites,
        updatedBy: currentUser?.id || currentUser?._id
      };

      // Use the selected image file if it's different from the original
      const imageFile = selectedImage !== groupData?.image ? selectedImageFile : null;

      const result = await groupService.updateGroup(groupId, updateData, imageFile);

      if (result.success) {
        alert('Success: Group settings updated successfully');
        navigate(-1);
      } else {
        alert('Error: ' + (result.message || 'Failed to update group settings'));
      }
    } catch (error) {
      console.error('Update group error:', error);
      alert('Error: Failed to update group settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isCreator) {
      alert('Permission Denied: Only the group creator can delete the group');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);

    try {
      const result = await groupService.deleteGroup(groupId, currentUser?.id || currentUser?._id);

      if (result.success) {
        alert('Group Deleted: The group has been permanently deleted');
        navigate('/groups');
      } else {
        alert('Error: ' + (result.message || 'Failed to delete group'));
      }
    } catch (error) {
      console.error('Delete group error:', error);
      alert('Error: Failed to delete group');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryModal = () => (
    showCategoryModal && (
      <div className="group-settings-modal-overlay" onClick={() => setShowCategoryModal(false)}>
        <div className="group-settings-modal-container" onClick={e => e.stopPropagation()}>
          <div className="group-settings-modal-header">
            <button 
              onClick={() => setShowCategoryModal(false)}
              className="group-settings-modal-close"
            >
              ✕
            </button>
            <h2 className="group-settings-modal-title">Select Category</h2>
            <div className="group-settings-modal-placeholder" />
          </div>
          
          <div className="group-settings-category-list">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`group-settings-category-item ${formData.category === category ? 'selected' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, category }));
                  setShowCategoryModal(false);
                }}
              >
                <span className={`group-settings-category-text ${formData.category === category ? 'selected' : ''}`}>
                  {category}
                </span>
                {formData.category === category && (
                  <span className="group-settings-category-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  );

  const renderDeleteConfirmModal = () => (
    showDeleteConfirm && (
      <div className="group-settings-delete-modal-overlay">
        <div className="group-settings-delete-modal-container">
          <div className="group-settings-delete-modal-header">
            <span className="group-settings-delete-modal-icon">⚠️</span>
            <h2 className="group-settings-delete-modal-title">Delete Group</h2>
          </div>
          
          <p className="group-settings-delete-modal-text">
            Are you sure you want to delete "{groupData?.name}"?
          </p>
          <p className="group-settings-delete-modal-subtext">
            This action cannot be undone. All posts, members, and data will be permanently lost.
          </p>
          
          <div className="group-settings-delete-modal-actions">
            <button
              className="group-settings-delete-modal-cancel"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            
            <button
              className="group-settings-delete-modal-confirm"
              onClick={confirmDeleteGroup}
            >
              Delete Group
            </button>
          </div>
        </div>
      </div>
    )
  );

  if (!canEdit) {
    return (
      <div className="group-settings-container">
        <div className="group-settings-error">
          <span className="group-settings-error-icon">🔒</span>
          <h2 className="group-settings-error-title">Access Denied</h2>
          <p className="group-settings-error-subtitle">Only group admins can edit settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-settings-container">
      <div className="group-settings-header">
        <button 
          className="group-settings-header-back" 
          onClick={() => navigate(-1)}
        >
          <span className="group-settings-back-icon">←</span>
        </button>
        
        <h1 className="group-settings-header-title">Group Settings</h1>
        
        <button 
          className={`group-settings-header-save ${loading ? 'disabled' : ''}`}
          onClick={handleSaveChanges}
          disabled={loading}
        >
          {loading ? (
            <div className="group-settings-spinner-small"></div>
          ) : (
            <span className="group-settings-save-text">Save</span>
          )}
        </button>
      </div>

      <div className="group-settings-content">
        {/* Cover Image Section */}
        <div className="group-settings-section">
          <h2 className="group-settings-section-title">Cover Image</h2>
          <div className="group-settings-image-container" onClick={handleImageClick}>
            {selectedImage ? (
              <img src={selectedImage} alt="Group cover" className="group-settings-cover-image" />
            ) : (
              <div className="group-settings-placeholder-image">
                <span className="group-settings-camera-icon">📷</span>
                <span className="group-settings-placeholder-text">Tap to add cover image</span>
              </div>
            )}
            <div className="group-settings-image-overlay">
              <span className="group-settings-overlay-icon">📷</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {/* Basic Information Section */}
        <div className="group-settings-section">
          <h2 className="group-settings-section-title">Basic Information</h2>
          
          <div className="group-settings-input-group">
            <label className="group-settings-input-label">Group Name *</label>
            <input
              type="text"
              className="group-settings-text-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          <div className="group-settings-input-group">
            <label className="group-settings-input-label">Description</label>
            <textarea
              className="group-settings-textarea"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your group"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="group-settings-input-group">
            <label className="group-settings-input-label">Category</label>
            <button
              type="button"
              className="group-settings-category-button"
              onClick={() => setShowCategoryModal(true)}
            >
              <span className="group-settings-category-button-text">{formData.category}</span>
              <span className="group-settings-category-arrow">▼</span>
            </button>
          </div>

          <div className="group-settings-input-group">
            <label className="group-settings-input-label">Group Rules</label>
            <textarea
              className="group-settings-textarea"
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Set rules for your group (optional)"
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        {/* Privacy & Permissions Section */}
        <div className="group-settings-section">
          <h2 className="group-settings-section-title">Privacy & Permissions</h2>
          
          <div className="group-settings-setting-item">
            <div className="group-settings-setting-info">
              <h3 className="group-settings-setting-title">Private Group</h3>
              <p className="group-settings-setting-description">
                Only members can see posts and join by invitation
              </p>
            </div>
            <label className="group-settings-switch">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isPrivate: e.target.checked,
                  requireApproval: e.target.checked ? prev.requireApproval : false
                }))}
              />
              <span className="group-settings-switch-slider"></span>
            </label>
          </div>

          {formData.isPrivate && (
            <div className="group-settings-setting-item">
              <div className="group-settings-setting-info">
                <h3 className="group-settings-setting-title">Require Approval</h3>
                <p className="group-settings-setting-description">
                  New members need admin approval to join
                </p>
              </div>
              <label className="group-settings-switch">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                />
                <span className="group-settings-switch-slider"></span>
              </label>
            </div>
          )}

          <div className="group-settings-setting-item">
            <div className="group-settings-setting-info">
              <h3 className="group-settings-setting-title">Allow Member Posts</h3>
              <p className="group-settings-setting-description">
                Members can share recipes in this group
              </p>
            </div>
            <label className="group-settings-switch">
              <input
                type="checkbox"
                checked={formData.allowMemberPosts}
                onChange={(e) => setFormData(prev => ({ ...prev, allowMemberPosts: e.target.checked }))}
              />
              <span className="group-settings-switch-slider"></span>
            </label>
          </div>

          <div className="group-settings-setting-item">
            <div className="group-settings-setting-info">
              <h3 className="group-settings-setting-title">Allow Invitations</h3>
              <p className="group-settings-setting-description">
                Members can invite others to join the group
              </p>
            </div>
            <label className="group-settings-switch">
              <input
                type="checkbox"
                checked={formData.allowInvites}
                onChange={(e) => setFormData(prev => ({ ...prev, allowInvites: e.target.checked }))}
              />
              <span className="group-settings-switch-slider"></span>
            </label>
          </div>
        </div>

        {/* Danger Zone Section */}
        {isCreator && (
          <div className="group-settings-section group-settings-danger-section">
            <h2 className="group-settings-section-title group-settings-danger-title">Danger Zone</h2>
            
            <button
              className="group-settings-delete-button"
              onClick={handleDeleteGroup}
              disabled={loading}
            >
              <span className="group-settings-delete-icon">🗑️</span>
              <span className="group-settings-delete-text">Delete Group</span>
            </button>
          </div>
        )}
      </div>

      {renderCategoryModal()}
      {renderDeleteConfirmModal()}
    </div>
  );
};

export default GroupSettingsScreen;