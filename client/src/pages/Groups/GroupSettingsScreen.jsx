import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Camera,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './GroupSettingsScreen.css';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';

const CATEGORIES = [
  'General', 'Italian', 'Asian', 'Mediterranean', 'Mexican', 
  'Indian', 'French', 'American', 'Vegetarian', 'Vegan', 
  'Desserts', 'Baking', 'Healthy', 'Quick Meals', 'Other'
];

const GroupSettingsScreen = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    rules: '',
    isPrivate: false,
    allowMemberPosts: true,
    requireApproval: false,
    allowInvites: true,
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [groupData, setGroupData] = useState(null);
  
  const isCreator = groupData ? groupService.isCreator(groupData, currentUser?.id || currentUser?._id) : false;
  const isAdmin = groupData ? groupService.isAdmin(groupData, currentUser?.id || currentUser?._id) : false;
  const canEdit = isCreator || isAdmin;

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const result = await groupService.getGroup(groupId);
      
      if (result.success) {
        const group = result.data;
        setGroupData(group);
        
        setFormData({
          name: group.name || '',
          description: group.description || '',
          category: group.category || 'General',
          rules: group.rules || '',
          isPrivate: group.isPrivate || false,
          allowMemberPosts: group.settings?.allowMemberPosts ?? group.allowMemberPosts ?? true,
          requireApproval: group.settings?.requireApproval ?? group.requireApproval ?? false,
          allowInvites: group.settings?.allowInvites ?? group.allowInvites ?? true,
        });
        
        setImagePreview(group.image);
        
        if (!groupService.isCreator(group, currentUser?.id || currentUser?._id) && 
            !groupService.isAdmin(group, currentUser?.id || currentUser?._id)) {
          alert('Only group admins can edit group settings');
          navigate(-1);
        }
      } else {
        alert(result.message || 'Failed to load group');
        navigate(-1);
      }
    } catch (error) {
      console.error('Load group error:', error);
      alert('Failed to load group');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSaveChanges = async () => {
    if (!formData.name.trim()) {
      alert('Group name is required');
      return;
    }

    setSaving(true);
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

      const formDataToSend = new FormData();
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }
      Object.keys(updateData).forEach(key => {
        formDataToSend.append(key, updateData[key]);
      });

      const result = await groupService.updateGroup(groupId, formDataToSend);

      if (result.success) {
        alert('Group settings updated successfully');
        navigate(-1);
      } else {
        alert(result.message || 'Failed to update group settings');
      }
    } catch (error) {
      console.error('Update group error:', error);
      alert('Failed to update group settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!isCreator) {
      alert('Only the group creator can delete the group');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = async () => {
    setShowDeleteConfirm(false);
    setSaving(true);

    try {
      const result = await groupService.deleteGroup(groupId, currentUser?.id || currentUser?._id);

      if (result.success) {
        alert('The group has been permanently deleted');
        navigate('/groups');
      } else {
        alert(result.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Delete group error:', error);
      alert('Failed to delete group');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="group-settings-screen">
        <header className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Group Settings</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="loading-container">
          <Loader2 className="spinner" size={40} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="group-settings-screen">
        <header className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <h1>Group Settings</h1>
          <div className="header-placeholder" />
        </header>
        
        <div className="error-container">
          <AlertCircle size={80} />
          <h2>Access Denied</h2>
          <p>Only group admins can edit settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-settings-screen">
      {/* Header */}
      <header className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>Group Settings</h1>
        
        <button 
          className="save-btn"
          onClick={handleSaveChanges}
          disabled={saving}
        >
          {saving ? <Loader2 className="spinner" size={20} /> : <><Save size={20} /><span>Save</span></>}
        </button>
      </header>

      <div className="settings-content">
        {/* Cover Image */}
        <div className="section">
          <h2>Cover Image</h2>
          <div className="image-container">
            {imagePreview ? (
              <img src={imagePreview} alt="Cover" className="cover-image" />
            ) : (
              <div className="placeholder-image">
                <Camera size={40} />
                <span>Tap to add cover image</span>
              </div>
            )}
            <div className="image-overlay">
              <label>
                <Camera size={24} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagePicker}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          {imagePreview && (
            <button className="remove-image-btn" onClick={handleRemoveImage}>
              <Trash2 size={16} />
              <span>Remove Image</span>
            </button>
          )}
        </div>

        {/* Basic Information */}
        <div className="section">
          <h2>Basic Information</h2>
          
          <div className="input-group">
            <label>Group Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter group name"
              maxLength={50}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your group"
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="input-group">
            <label>Category</label>
            <button
              className="category-button"
              onClick={() => setShowCategoryModal(!showCategoryModal)}
              type="button"
            >
              <span>{formData.category}</span>
              {showCategoryModal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showCategoryModal && (
              <div className="category-dropdown">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    className={`category-item ${formData.category === category ? 'selected' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, category }));
                      setShowCategoryModal(false);
                    }}
                    type="button"
                  >
                    <span>{category}</span>
                    {formData.category === category && <Check size={20} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Group Rules</label>
            <textarea
              value={formData.rules}
              onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
              placeholder="Set rules for your group (optional)"
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        {/* Privacy & Permissions */}
        <div className="section">
          <h2>Privacy & Permissions</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Private Group</h3>
              <p>Only members can see posts and join by invitation</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isPrivate: e.target.checked,
                  requireApproval: e.target.checked ? prev.requireApproval : false
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>

          {formData.isPrivate && (
            <div className="setting-item">
              <div className="setting-info">
                <h3>Require Approval</h3>
                <p>New members need admin approval to join</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            </div>
          )}

          <div className="setting-item">
            <div className="setting-info">
              <h3>Allow Member Posts</h3>
              <p>Members can share recipes in this group</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.allowMemberPosts}
                onChange={(e) => setFormData(prev => ({ ...prev, allowMemberPosts: e.target.checked }))}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Allow Invitations</h3>
              <p>Members can invite others to join the group</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.allowInvites}
                onChange={(e) => setFormData(prev => ({ ...prev, allowInvites: e.target.checked }))}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        {isCreator && (
          <div className="section danger-section">
            <h2 className="danger-title">Danger Zone</h2>
            
            <button
              className="delete-button"
              onClick={handleDeleteGroup}
              disabled={saving}
            >
              <Trash2 size={20} />
              <span>Delete Group</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={48} color="var(--danger)" />
              <h3>Delete Group</h3>
            </div>
            
            <p className="modal-text">
              Are you sure you want to delete "{groupData?.name}"?
            </p>
            <p className="modal-subtext">
              This action cannot be undone. All posts, members, and data will be permanently lost.
            </p>
            
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              
              <button
                className="confirm-delete-btn"
                onClick={confirmDeleteGroup}
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSettingsScreen;