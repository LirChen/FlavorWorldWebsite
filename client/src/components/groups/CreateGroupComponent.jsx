import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2
} from 'lucide-react';
import './CreateGroupComponent.css';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';

const CATEGORIES = [
  'General',
  'Baking & Desserts',
  'Main Courses',
  'Appetizers',
  'Salads',
  'Soups',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Quick Meals',
  'Holiday Recipes',
  'International Cuisine'
];

const CreateGroupComponent = ({ onGroupCreated }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [rules, setRules] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handlePickImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (groupName.length < 3) {
      alert('Group name must be at least 3 characters');
      return;
    }

    if (groupName.length > 50) {
      alert('Group name must be less than 50 characters');
      return;
    }

    setIsLoading(true);

    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim(),
        category,
        rules: rules.trim(),
        creatorId: currentUser?.id || currentUser?._id,
        isPrivate,
        allowMemberPosts,
        requireApproval,
        allowInvites
      };

      const result = await groupService.createGroup(groupData, groupImage);

      if (result.success) {
        alert('Your group has been created successfully!');
        if (onGroupCreated) {
          onGroupCreated(result.data);
        }
        navigate('/groups');
      } else {
        throw new Error(result.message || 'Failed to create group');
      }

    } catch (error) {
      console.error('Create group error:', error);
      alert(error.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-group-screen">
      {/* Header */}
      <header className="create-group-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        
        <h1>Create Group</h1>
        
        <button
          className="create-btn-header"
          onClick={handleCreateGroup}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="spinner" size={20} /> : 'Create'}
        </button>
      </header>

      <div className="create-group-content">
        {/* Cover Image Section */}
        <div className="section">
          <h2>Group Cover Image</h2>
          <label className="image-container">
            {imagePreview ? (
              <img src={imagePreview} alt="Cover" className="cover-image" />
            ) : (
              <div className="placeholder-image">
                <Camera size={40} />
                <span>Add Cover Photo</span>
              </div>
            )}
            <div className="image-overlay">
              <Camera size={20} />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePickImage}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Basic Information */}
        <div className="section">
          <h2>Basic Information</h2>
          
          <div className="input-group">
            <label>Group Name *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name (e.g., Italian Cooking Masters)"
              maxLength={50}
            />
            <span className="char-count">{groupName.length}/50</span>
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your group is about, what kind of recipes you'll share..."
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

          <div className="input-group">
            <label>Category</label>
            <button 
              className="category-selector"
              onClick={() => setShowCategoryPicker(!showCategoryPicker)}
              type="button"
            >
              <span>{category}</span>
              {showCategoryPicker ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {showCategoryPicker && (
              <div className="category-picker">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`category-item ${category === cat ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    type="button"
                  >
                    <span>{cat}</span>
                    {category === cat && <Check size={20} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Group Settings */}
        <div className="section">
          <h2>Group Settings</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Private Group</h3>
              <p>Only members can see posts and member list</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Allow Member Posts</h3>
              <p>Members can create and share their own recipes</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={allowMemberPosts}
                onChange={(e) => setAllowMemberPosts(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Require Post Approval</h3>
              <p>Admin must approve posts before they're visible</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Allow Member Invites</h3>
              <p>Members can invite others to join the group</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={allowInvites}
                onChange={(e) => setAllowInvites(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Group Rules */}
        <div className="section">
          <h2>Group Rules (Optional)</h2>
          <div className="input-group">
            <label>Community Guidelines</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Set some ground rules for your group members..."
              rows={4}
              maxLength={1000}
            />
            <span className="char-count">{rules.length}/1000</span>
          </div>
        </div>

        {/* Create Button */}
        <div className="button-section">
          <button
            className="create-full-button"
            onClick={handleCreateGroup}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              <>
                <Users size={20} />
                <span>Create Group</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupComponent;