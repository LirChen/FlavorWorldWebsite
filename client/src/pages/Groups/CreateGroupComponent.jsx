import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  ImageIcon,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { groupService } from '../../services/groupService';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#FFF8F0',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E8E8E8',
  success: '#27AE60',
  danger: '#E74C3C',
};

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

const CreateGroupComponent = ({ navigation, onGroupCreated }) => {
  const { currentUser } = useAuth();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [rules, setRules] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowInvites, setAllowInvites] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handlePickImage = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setGroupImage({ uri: url, file: file });
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to pick image');
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

      console.log('Creating group with data:', groupData);

      const result = await groupService.createGroup(groupData, groupImage?.uri);

      if (result.success) {
        alert('Success! Your group has been created successfully!');
        
        if (onGroupCreated) {
          onGroupCreated(result.data);
        }
        if (navigation) {
          navigation.goBack();
        }
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

  const ToggleSwitch = ({ value, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ 
        backgroundColor: value ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border 
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const CategoryPicker = () => (
    <div className="mt-2 border border-gray-300 rounded-xl bg-white max-h-48 overflow-y-auto">
      <div className="p-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategory(cat);
              setShowCategoryPicker(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-colors ${
              category === cat 
                ? 'hover:opacity-90' 
                : 'hover:bg-gray-50'
            }`}
            style={{ 
              backgroundColor: category === cat ? FLAVORWORLD_COLORS.background : 'transparent'
            }}
          >
            <span 
              className={`text-left ${category === cat ? 'font-semibold' : ''}`}
              style={{ 
                color: category === cat ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.text 
              }}
            >
              {cat}
            </span>
            {category === cat && (
              <Check className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.primary }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: FLAVORWORLD_COLORS.background }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          backgroundColor: FLAVORWORLD_COLORS.white,
          borderColor: FLAVORWORLD_COLORS.border 
        }}
      >
        <button 
          onClick={() => navigation?.goBack()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
        >
          <ArrowLeft className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.accent }} />
        </button>
        
        <h1 className="text-xl font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
          Create Group
        </h1>
        
        <button
          onClick={handleCreateGroup}
          disabled={isLoading}
          className={`px-4 py-2 rounded-full border transition-colors ${
            isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.background,
            borderColor: FLAVORWORLD_COLORS.primary,
            color: FLAVORWORLD_COLORS.primary
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="font-semibold">Create</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4 pb-12">
          {/* Group Cover Image */}
          <div 
            className="mt-4 mx-4 p-6 rounded-lg"
            style={{ backgroundColor: FLAVORWORLD_COLORS.white }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: FLAVORWORLD_COLORS.text }}>
              Group Cover Image
            </h2>
            <div className="relative mb-4">
              <button
                type="button"
                onClick={handlePickImage}
                className="w-full h-40 rounded-xl overflow-hidden relative group hover:opacity-90 transition-opacity"
              >
                {groupImage ? (
                  <img 
                    src={groupImage.uri} 
                    alt="Group cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center"
                    style={{ 
                      backgroundColor: FLAVORWORLD_COLORS.background,
                      borderColor: FLAVORWORLD_COLORS.border 
                    }}
                  >
                    <ImageIcon className="w-10 h-10 mb-2" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                    <span className="text-lg font-medium" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                      Add Cover Photo
                    </span>
                  </div>
                )}
                <div 
                  className="absolute bottom-2 right-2 p-2 rounded-full shadow-lg"
                  style={{ backgroundColor: FLAVORWORLD_COLORS.primary }}
                >
                  <Camera className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.white }} />
                </div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div 
            className="mx-4 p-6 rounded-lg"
            style={{ backgroundColor: FLAVORWORLD_COLORS.white }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: FLAVORWORLD_COLORS.text }}>
              Basic Information
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name (e.g., Italian Cooking Masters)"
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  style={{ 
                    borderColor: FLAVORWORLD_COLORS.border,
                    color: FLAVORWORLD_COLORS.text,
                    backgroundColor: FLAVORWORLD_COLORS.white
                  }}
                />
                <div className="text-right mt-1">
                  <span className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    {groupName.length}/50
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what your group is about, what kind of recipes you'll share..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 resize-none"
                  style={{ 
                    borderColor: FLAVORWORLD_COLORS.border,
                    color: FLAVORWORLD_COLORS.text,
                    backgroundColor: FLAVORWORLD_COLORS.white
                  }}
                />
                <div className="text-right mt-1">
                  <span className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    {description.length}/500
                  </span>
                </div>
              </div>

              <div className="relative">
                <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                  style={{ 
                    borderColor: FLAVORWORLD_COLORS.border,
                    backgroundColor: FLAVORWORLD_COLORS.white
                  }}
                >
                  <span style={{ color: FLAVORWORLD_COLORS.text }}>{category}</span>
                  {showCategoryPicker ? (
                    <ChevronUp className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.textLight }} />
                  )}
                </button>
                {showCategoryPicker && <CategoryPicker />}
              </div>
            </div>
          </div>

          {/* Group Settings */}
          <div 
            className="mx-4 p-6 rounded-lg"
            style={{ backgroundColor: FLAVORWORLD_COLORS.white }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: FLAVORWORLD_COLORS.text }}>
              Group Settings
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: FLAVORWORLD_COLORS.border }}>
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Private Group
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Only members can see posts and member list
                  </p>
                </div>
                <ToggleSwitch value={isPrivate} onChange={setIsPrivate} />
              </div>

              <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: FLAVORWORLD_COLORS.border }}>
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Allow Member Posts
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Members can create and share their own recipes
                  </p>
                </div>
                <ToggleSwitch value={allowMemberPosts} onChange={setAllowMemberPosts} />
              </div>

              <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: FLAVORWORLD_COLORS.border }}>
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Require Post Approval
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Admin must approve posts before they're visible
                  </p>
                </div>
                <ToggleSwitch value={requireApproval} onChange={setRequireApproval} />
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: FLAVORWORLD_COLORS.text }}>
                    Allow Member Invites
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                    Members can invite others to join the group
                  </p>
                </div>
                <ToggleSwitch value={allowInvites} onChange={setAllowInvites} />
              </div>
            </div>
          </div>

          {/* Group Rules */}
          <div 
            className="mx-4 p-6 rounded-lg"
            style={{ backgroundColor: FLAVORWORLD_COLORS.white }}
          >
            <h2 className="text-xl font-bold mb-5" style={{ color: FLAVORWORLD_COLORS.text }}>
              Group Rules (Optional)
            </h2>
            
            <div>
              <label className="block text-lg font-semibold mb-2" style={{ color: FLAVORWORLD_COLORS.text }}>
                Community Guidelines
              </label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Set some ground rules for your group members..."
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 resize-none"
                style={{ 
                  borderColor: FLAVORWORLD_COLORS.border,
                  color: FLAVORWORLD_COLORS.text,
                  backgroundColor: FLAVORWORLD_COLORS.white
                }}
              />
              <div className="text-right mt-1">
                <span className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                  {rules.length}/1000
                </span>
              </div>
            </div>
          </div>

          {/* Create Button */}
          <div className="mx-4 p-6">
            <button
              onClick={handleCreateGroup}
              disabled={isLoading}
              className={`w-full flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold transition-all ${
                isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:opacity-90 transform hover:scale-[1.02]'
              }`}
              style={{ 
                backgroundColor: isLoading ? FLAVORWORLD_COLORS.textLight : FLAVORWORLD_COLORS.primary,
                color: FLAVORWORLD_COLORS.white 
              }}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Users className="w-6 h-6 mr-2" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close category picker */}
      {showCategoryPicker && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  );
};

export default CreateGroupComponent;