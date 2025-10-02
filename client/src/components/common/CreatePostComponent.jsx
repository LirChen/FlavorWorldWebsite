import React, { useState } from 'react';
import { 
  ChefHat, 
  Camera, 
  Video, 
  X, 
  ChevronDown, 
  Clock,
  Utensils,
  Loader2
} from 'lucide-react';
import './CreatePostComponent.css';
import { recipeService } from '../../services/recipeService';
import { groupService } from '../../services/groupService';

const FLAVORWORLD_COLORS = {
  primary: '#F5A623',
  secondary: '#4ECDC4',
  accent: '#1F3A93',
  background: '#F0F2F5',
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E4E6EB',
  success: '#27AE60',
  danger: '#E74C3C',
};

const RECIPE_CATEGORIES = [
  'Asian', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 
  'American', 'French', 'Chinese', 'Japanese', 'Thai', 
  'Middle Eastern', 'Greek', 'Spanish', 'Korean', 'Vietnamese', 'Dessert'
];

const MEAT_TYPES = [
  'Vegetarian', 'Vegan', 'Chicken', 'Beef', 'Pork', 
  'Fish', 'Seafood', 'Lamb', 'Turkey', 'Mixed'
];

const CreatePostComponent = ({ 
  onPostCreated, 
  currentUser, 
  groupId = null, 
  groupName = null 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('');
  const [meatType, setMeatType] = useState('');
  const [prepTimeHours, setPrepTimeHours] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('none');

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showMeatTypeDropdown, setShowMeatTypeDropdown] = useState(false);

  const isGroupPost = !!groupId;

  const validateForm = () => {
    const newErrors = {};

    if (!title?.trim()) newErrors.title = 'Recipe title is required';
    if (!description?.trim()) newErrors.description = 'Recipe description is required';
    if (!ingredients?.trim()) newErrors.ingredients = 'Ingredients list is required';
    if (!instructions?.trim()) newErrors.instructions = 'Cooking instructions are required';
    if (!category?.trim()) newErrors.category = 'Recipe category is required';
    if (!meatType?.trim()) newErrors.meatType = 'Meat type is required';
    if (!servings?.trim()) newErrors.servings = 'Number of servings is required';
    
    const hours = parseInt(prepTimeHours) || 0;
    const minutes = parseInt(prepTimeMinutes) || 0;
    if (hours === 0 && minutes === 0) {
      newErrors.prepTime = 'Preparation time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = async (type = 'image') => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'video' ? 'video/*' : 'image/*';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setMedia({ uri: url, file: file });
          setMediaType(type);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Media picker error:', error);
      alert(`Failed to pick ${type}`);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const totalMinutes = (parseInt(prepTimeHours) || 0) * 60 + (parseInt(prepTimeMinutes) || 0);
      
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        category: category,
        meatType: meatType,
        prepTime: totalMinutes,
        servings: parseInt(servings) || 1,
        userId: currentUser?.id || currentUser?._id,
        userName: currentUser?.fullName || currentUser?.name || 'Anonymous',
        userAvatar: currentUser?.avatar || currentUser?.userAvatar || null,
        mediaType: mediaType,
        media: media ? media.uri : null
      };

      let result;

      if (isGroupPost) {
        result = await groupService.createGroupPost(groupId, recipeData, media?.uri);
      } else {
        result = await recipeService.createRecipe(recipeData);
      }

      if (result?.success) {
        alert(isGroupPost 
          ? `Recipe shared with ${groupName}!`
          : 'Recipe shared successfully!');
        
        // Reset form
        setTitle('');
        setDescription('');
        setIngredients('');
        setInstructions('');
        setCategory('');
        setMeatType('');
        setPrepTimeHours('');
        setPrepTimeMinutes('');
        setServings('');
        setMedia(null);
        setMediaType('none');
        setErrors({});
        
        onPostCreated?.(result.data);
      } else {
        alert(result?.message || 'Failed to share recipe');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Unable to share recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const CustomDropdown = ({ 
    value, 
    placeholder, 
    options, 
    onChange, 
    isOpen, 
    setIsOpen, 
    error 
  }) => (
    <div className="dropdown-wrapper">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-button ${error ? 'error' : ''}`}
      >
        <span className={value ? 'selected' : 'placeholder'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`chevron ${isOpen ? 'rotate' : ''}`} size={20} />
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`dropdown-item ${value === option ? 'active' : ''}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="create-post-component">
      {isGroupPost && (
        <div className="group-indicator">
          <div className="group-icon">
            <ChefHat size={20} />
          </div>
          <div>
            <h4>Sharing with {groupName}</h4>
            <p>This recipe will be visible to group members</p>
          </div>
        </div>
      )}

      <div className="form-section">
        <label className="form-label">Recipe Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError('title');
          }}
          placeholder="What's cooking?"
          className={`form-input ${errors.title ? 'error' : ''}`}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-section">
        <label className="form-label">Description *</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            clearError('description');
          }}
          placeholder="Tell us about your recipe..."
          rows={3}
          className={`form-textarea ${errors.description ? 'error' : ''}`}
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      <div className="form-row">
        <div className="form-section">
          <label className="form-label">Category *</label>
          <CustomDropdown
            value={category}
            placeholder="Select cuisine"
            options={RECIPE_CATEGORIES}
            onChange={(value) => {
              setCategory(value);
              clearError('category');
            }}
            isOpen={showCategoryDropdown}
            setIsOpen={setShowCategoryDropdown}
            error={errors.category}
          />
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        <div className="form-section">
          <label className="form-label">Type *</label>
          <CustomDropdown
            value={meatType}
            placeholder="Select type"
            options={MEAT_TYPES}
            onChange={(value) => {
              setMeatType(value);
              clearError('meatType');
            }}
            isOpen={showMeatTypeDropdown}
            setIsOpen={setShowMeatTypeDropdown}
            error={errors.meatType}
          />
          {errors.meatType && <span className="error-message">{errors.meatType}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-section">
          <label className="form-label">Prep Time *</label>
          <div className="time-inputs">
            <input
              type="number"
              value={prepTimeHours}
              onChange={(e) => {
                setPrepTimeHours(e.target.value);
                clearError('prepTime');
              }}
              placeholder="0"
              min="0"
              max="24"
              className={`time-input ${errors.prepTime ? 'error' : ''}`}
            />
            <span className="time-label">h</span>
            <input
              type="number"
              value={prepTimeMinutes}
              onChange={(e) => {
                setPrepTimeMinutes(e.target.value);
                clearError('prepTime');
              }}
              placeholder="30"
              min="0"
              max="59"
              className={`time-input ${errors.prepTime ? 'error' : ''}`}
            />
            <span className="time-label">m</span>
          </div>
          {errors.prepTime && <span className="error-message">{errors.prepTime}</span>}
        </div>

        <div className="form-section">
          <label className="form-label">Servings *</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => {
              setServings(e.target.value);
              clearError('servings');
            }}
            placeholder="4"
            min="1"
            max="50"
            className={`form-input ${errors.servings ? 'error' : ''}`}
          />
          {errors.servings && <span className="error-message">{errors.servings}</span>}
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">Ingredients *</label>
        <textarea
          value={ingredients}
          onChange={(e) => {
            setIngredients(e.target.value);
            clearError('ingredients');
          }}
          placeholder="List all ingredients..."
          rows={4}
          className={`form-textarea ${errors.ingredients ? 'error' : ''}`}
        />
        {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
      </div>

      <div className="form-section">
        <label className="form-label">Instructions *</label>
        <textarea
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            clearError('instructions');
          }}
          placeholder="Step by step instructions..."
          rows={5}
          className={`form-textarea ${errors.instructions ? 'error' : ''}`}
        />
        {errors.instructions && <span className="error-message">{errors.instructions}</span>}
      </div>

      <div className="form-section">
        <label className="form-label">Recipe Photo/Video</label>
        
        <div className="media-buttons">
          <button
            type="button"
            onClick={() => handleFileSelect('image')}
            className={`media-button ${mediaType === 'image' ? 'active' : ''}`}
          >
            <Camera size={20} />
            <span>Photo</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleFileSelect('video')}
            className={`media-button ${mediaType === 'video' ? 'active' : ''}`}
          >
            <Video size={20} />
            <span>Video</span>
          </button>
        </div>

        {media && (
          <div className="media-preview">
            {mediaType === 'image' ? (
              <img src={media.uri} alt="Preview" />
            ) : (
              <video src={media.uri} controls />
            )}
            <button
              type="button"
              onClick={() => {
                setMedia(null);
                setMediaType('none');
              }}
              className="remove-media"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className={`submit-button ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="spin" size={20} />
            <span>Sharing...</span>
          </>
        ) : (
          <>
            <ChefHat size={20} />
            <span>{isGroupPost ? `Share with ${groupName}` : 'Share Recipe'}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CreatePostComponent;