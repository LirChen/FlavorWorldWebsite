import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  X,
  ChevronDown,
  Clock,
  Users as UsersIcon,
  Loader2,
  Check
} from 'lucide-react';
import './EditPostScreen.css';
import { recipeService } from '../../services/recipeService';
import { groupService } from '../../services/groupService';
import { useAuth } from '../../services/AuthContext';

const RECIPE_CATEGORIES = [
  'Asian', 'Italian', 'Mexican', 'Indian', 'Mediterranean', 
  'American', 'French', 'Chinese', 'Japanese', 'Thai', 
  'Middle Eastern', 'Greek', 'Spanish', 'Korean', 'Vietnamese', 'Dessert'
];

const MEAT_TYPES = [
  'Vegetarian', 'Vegan', 'Chicken', 'Beef', 'Pork', 
  'Fish', 'Seafood', 'Lamb', 'Turkey', 'Mixed'
];

const EditPostScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();
  const { currentUser } = useAuth();
  
  const { postData, isGroupPost = false, groupId = null, groupName = null } = location.state || {};

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('');
  const [meatType, setMeatType] = useState('');
  const [prepTimeHours, setPrepTimeHours] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servings, setServings] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMeatTypeModal, setShowMeatTypeModal] = useState(false);

  useEffect(() => {
    if (postData) {
      setTitle(postData.title || '');
      setDescription(postData.description || '');
      setIngredients(postData.ingredients || '');
      setInstructions(postData.instructions || '');
      setCategory(postData.category || '');
      setMeatType(postData.meatType || '');
      setServings(postData.servings?.toString() || '');
      
      const totalMinutes = postData.prepTime || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setPrepTimeHours(hours > 0 ? hours.toString() : '');
      setPrepTimeMinutes(minutes > 0 ? minutes.toString() : '');
      
      if (postData.image) {
        setOriginalImage(postData.image);
        setImagePreview(postData.image);
      }
    }
  }, [postData]);

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

    if (servings && isNaN(parseInt(servings))) {
      newErrors.servings = 'Servings must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOriginalImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const totalMinutes = (parseInt(prepTimeHours) || 0) * 60 + (parseInt(prepTimeMinutes) || 0);
      
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        category: category,
        meatType: meatType,
        prepTime: totalMinutes,
        servings: parseInt(servings) || 1,
        userId: currentUser?.id || currentUser?._id,
      };

      // Add original image if exists and no new image
      if (!imageFile && originalImage) {
        updateData.image = originalImage;
      }

      let result;

      if (isGroupPost && groupId) {
        result = await groupService.updateGroupPost(groupId, postId, updateData, imageFile);
      } else {
        result = await recipeService.updateRecipe(postId, updateData, imageFile);
      }

      if (result && result.success) {
        const successMessage = isGroupPost 
          ? `Recipe updated in ${groupName}!`
          : 'Recipe updated successfully!';

        alert(successMessage);
        navigate(-1);
      } else {
        alert(result?.message || 'Failed to update recipe. Please try again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Unable to update recipe. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="edit-post-screen">
      {/* Header */}
      <header className="edit-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Edit Recipe</h1>
        <div className="header-placeholder" />
      </header>

      {/* Form */}
      <form className="edit-form" onSubmit={handleSubmit}>
        {/* Group Indicator */}
        {isGroupPost && groupName && (
          <div className="group-indicator">
            <div className="group-icon">
              <UsersIcon size={24} />
            </div>
            <div className="group-text">
              <h3>Editing in {groupName}</h3>
              <p>Update your recipe for the group</p>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="form-group">
          <label>Recipe Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            placeholder="What's cooking?"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError('description');
            }}
            placeholder="Tell us about your recipe..."
            rows={3}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        {/* Category & Type */}
        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <button
              type="button"
              className={`selector ${errors.category ? 'error' : ''}`}
              onClick={() => setShowCategoryModal(true)}
            >
              <span>{category || 'Select cuisine'}</span>
              <ChevronDown size={20} />
            </button>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          <div className="form-group">
            <label>Type *</label>
            <button
              type="button"
              className={`selector ${errors.meatType ? 'error' : ''}`}
              onClick={() => setShowMeatTypeModal(true)}
            >
              <span>{meatType || 'Select type'}</span>
              <ChevronDown size={20} />
            </button>
            {errors.meatType && <span className="error-message">{errors.meatType}</span>}
          </div>
        </div>

        {/* Prep Time & Servings */}
        <div className="form-row">
          <div className="form-group">
            <label>Prep Time *</label>
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
              <span>h</span>
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
              <span>m</span>
            </div>
            {errors.prepTime && <span className="error-message">{errors.prepTime}</span>}
          </div>

          <div className="form-group">
            <label>Servings *</label>
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
              className={errors.servings ? 'error' : ''}
            />
            {errors.servings && <span className="error-message">{errors.servings}</span>}
          </div>
        </div>

        {/* Ingredients */}
        <div className="form-group">
          <label>Ingredients *</label>
          <textarea
            value={ingredients}
            onChange={(e) => {
              setIngredients(e.target.value);
              clearError('ingredients');
            }}
            placeholder="List all ingredients..."
            rows={4}
            className={errors.ingredients ? 'error' : ''}
          />
          {errors.ingredients && <span className="error-message">{errors.ingredients}</span>}
        </div>

        {/* Instructions */}
        <div className="form-group">
          <label>Instructions *</label>
          <textarea
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              clearError('instructions');
            }}
            placeholder="Step by step instructions..."
            rows={5}
            className={errors.instructions ? 'error' : ''}
          />
          {errors.instructions && <span className="error-message">{errors.instructions}</span>}
        </div>

        {/* Image */}
        <div className="form-group">
          <label>Recipe Photo</label>
          
          {imagePreview ? (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <div className="image-actions">
                <label className="change-image-btn">
                  <Camera size={16} />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
                
                <button type="button" className="remove-image-btn" onClick={removeImage}>
                  <X size={16} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <label className="image-picker">
              <Camera size={40} />
              <span>Add a photo</span>
              <p>Make your recipe irresistible!</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="spinner" size={20} />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <Check size={20} />
              <span>Update Recipe</span>
            </>
          )}
        </button>
      </form>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Cuisine</h3>
              <button onClick={() => setShowCategoryModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-list">
              {RECIPE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`modal-item ${category === cat ? 'active' : ''}`}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                    clearError('category');
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meat Type Modal */}
      {showMeatTypeModal && (
        <div className="modal-overlay" onClick={() => setShowMeatTypeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Type</h3>
              <button onClick={() => setShowMeatTypeModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-list">
              {MEAT_TYPES.map(type => (
                <button
                  key={type}
                  className={`modal-item ${meatType === type ? 'active' : ''}`}
                  onClick={() => {
                    setMeatType(type);
                    setShowMeatTypeModal(false);
                    clearError('meatType');
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPostScreen;