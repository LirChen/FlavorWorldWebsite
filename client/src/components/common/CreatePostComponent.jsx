import React, { useState } from 'react';
import { 
  ChefHat, 
  Camera, 
  Video, 
  X, 
  ChevronDown, 
  Users, 
  Clock,
  Utensils,
  PlusCircle,
  Loader2
} from 'lucide-react';
import { recipeService } from '../../services/recipeService';
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

    if (!title || title.trim() === '') {
      newErrors.title = 'Recipe title is required';
    }
    
    if (!description || description.trim() === '') {
      newErrors.description = 'Recipe description is required';
    }
    
    if (!ingredients || ingredients.trim() === '') {
      newErrors.ingredients = 'Ingredients list is required';
    }
    
    if (!instructions || instructions.trim() === '') {
      newErrors.instructions = 'Cooking instructions are required';
    }
    
    if (!category || category.trim() === '') {
      newErrors.category = 'Recipe category is required';
    }
    
    if (!meatType || meatType.trim() === '') {
      newErrors.meatType = 'Meat type is required';
    }
    
    if (!servings || servings.trim() === '') {
      newErrors.servings = 'Number of servings is required';
    }
    
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
          console.log(`Selected ${type}:`, url);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Media picker error:', error);
      alert(`Failed to pick ${type}`);
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting form...');
    console.log('Is group post:', isGroupPost, 'Group ID:', groupId);
    
    if (!validateForm()) {
      alert('Please fill in all required fields to share your delicious recipe!');
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
        userId: currentUser?.id || currentUser?._id || currentUser?.userId || 'unknown',
        userName: currentUser?.fullName || currentUser?.name || currentUser?.displayName || currentUser?.username || 'Anonymous Chef',
        userAvatar: currentUser?.avatar || currentUser?.userAvatar || null,
        mediaType: mediaType,
        media: media ? media.uri : null
      };

      console.log('Recipe data with user info:', {
        userId: recipeData.userId,
        userName: recipeData.userName,
        userAvatar: recipeData.userAvatar,
        mediaType: recipeData.mediaType,
        hasMedia: !!recipeData.media,
        isGroupPost,
        groupId
      });

      let result;

      if (isGroupPost) {
        console.log('Creating group post...');
        result = await groupService.createGroupPost(groupId, recipeData, media?.uri);
      } else {
        console.log('Creating regular post...');
        const regularRecipeData = {
          ...recipeData,
          mediaType: mediaType,
          media: media ? media.uri : null
        };
        result = await recipeService.createRecipe(regularRecipeData);
      }

      if (result && result.success) {
        const successMessage = isGroupPost 
          ? `Recipe shared with ${groupName}!`
          : 'Recipe Shared!';
          
        const successDescription = isGroupPost
          ? `Your delicious recipe has been shared with the ${groupName} group!`
          : 'Your delicious recipe has been shared with the FlavorWorld community!';

        alert(`${successMessage} ${successDescription}`);
        
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
        
        if (onPostCreated) {
          onPostCreated(result.data);
        }
      } else {
        alert(result ? result.message : 'Failed to share recipe. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Unable to share recipe. Please check your connection and try again.');
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border-2 rounded-xl bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 transition-colors ${
          error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
        }`}
        style={{ 
          borderColor: error ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
          color: value ? FLAVORWORLD_COLORS.text : FLAVORWORLD_COLORS.textLight 
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                value === option ? 'font-semibold' : ''
              }`}
              style={{ 
                backgroundColor: value === option ? `${FLAVORWORLD_COLORS.primary}20` : 'transparent',
                color: value === option ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.text
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const getHeaderInfo = () => {
    if (isGroupPost) {
      return {
        title: `Share with ${groupName}`,
        subtitle: `Share your recipe with the ${groupName} group`,
        icon: Users
      };
    }
    return {
      title: 'Share Recipe',
      subtitle: 'Share your recipe with the FlavorWorld community',
      icon: ChefHat
    };
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
      {/* Group Header */}
      {isGroupPost && (
        <div 
          className="flex items-center p-6 mb-6 mx-6 mt-6 rounded-xl border-2"
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.white,
            borderColor: FLAVORWORLD_COLORS.secondary 
          }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
            style={{ backgroundColor: FLAVORWORLD_COLORS.background }}
          >
            <Users className="w-6 h-6" style={{ color: FLAVORWORLD_COLORS.secondary }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>
              Sharing with {groupName}
            </h3>
            <p className="text-sm" style={{ color: FLAVORWORLD_COLORS.textLight }}>
              This recipe will be visible to group members
            </p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Recipe Title */}
        <div>
          <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
            Recipe Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            placeholder="What's cooking? Give your recipe a delicious name..."
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
              errors.title 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
            }`}
            style={{ 
              borderColor: errors.title ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
              color: FLAVORWORLD_COLORS.text 
            }}
          />
          {errors.title && (
            <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError('description');
            }}
            placeholder="Tell us about your recipe... What makes it special?"
            rows={3}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
              errors.description 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
            }`}
            style={{ 
              borderColor: errors.description ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
              color: FLAVORWORLD_COLORS.text 
            }}
          />
          {errors.description && (
            <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
              {errors.description}
            </p>
          )}
        </div>

        {/* Category and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
              Category *
            </label>
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
            {errors.category && (
              <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
              Type *
            </label>
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
            {errors.meatType && (
              <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
                {errors.meatType}
              </p>
            )}
          </div>
        </div>

        {/* Time and Servings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
              Prep Time *
            </label>
            <div className="flex items-center space-x-3">
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
                className={`w-20 px-3 py-3 border-2 rounded-xl text-center focus:outline-none focus:ring-2 transition-colors ${
                  errors.prepTime 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
                }`}
                style={{ 
                  borderColor: errors.prepTime ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
                  color: FLAVORWORLD_COLORS.text 
                }}
              />
              <span className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>h</span>
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
                className={`w-20 px-3 py-3 border-2 rounded-xl text-center focus:outline-none focus:ring-2 transition-colors ${
                  errors.prepTime 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
                }`}
                style={{ 
                  borderColor: errors.prepTime ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
                  color: FLAVORWORLD_COLORS.text 
                }}
              />
              <span className="text-lg font-semibold" style={{ color: FLAVORWORLD_COLORS.text }}>m</span>
            </div>
            {errors.prepTime && (
              <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
                {errors.prepTime}
              </p>
            )}
          </div>

          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
              Servings *
            </label>
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
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.servings 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
              }`}
              style={{ 
                borderColor: errors.servings ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
                color: FLAVORWORLD_COLORS.text 
              }}
            />
            {errors.servings && (
              <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
                {errors.servings}
              </p>
            )}
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
            Ingredients *
          </label>
          <textarea
            value={ingredients}
            onChange={(e) => {
              setIngredients(e.target.value);
              clearError('ingredients');
            }}
            placeholder="List all ingredients and quantities..."
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
              errors.ingredients 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
            }`}
            style={{ 
              borderColor: errors.ingredients ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
              color: FLAVORWORLD_COLORS.text 
            }}
          />
          {errors.ingredients && (
            <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
              {errors.ingredients}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
            Instructions *
          </label>
          <textarea
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              clearError('instructions');
            }}
            placeholder="Share your cooking secrets... Step by step instructions"
            rows={5}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
              errors.instructions 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:ring-orange-200 focus:border-orange-500'
            }`}
            style={{ 
              borderColor: errors.instructions ? FLAVORWORLD_COLORS.danger : FLAVORWORLD_COLORS.border,
              color: FLAVORWORLD_COLORS.text 
            }}
          />
          {errors.instructions && (
            <p className="mt-2 text-sm font-medium" style={{ color: FLAVORWORLD_COLORS.danger }}>
              {errors.instructions}
            </p>
          )}
        </div>

        {/* Media Picker */}
        <div>
          <label className="block text-lg font-semibold mb-3" style={{ color: FLAVORWORLD_COLORS.text }}>
            Recipe Media
          </label>
          
          {/* Media Type Selector */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => handleFileSelect('image')}
              className={`flex-1 flex items-center justify-center px-6 py-3 border-2 rounded-xl transition-colors ${
                mediaType === 'image' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              style={{ 
                borderColor: mediaType === 'image' ? FLAVORWORLD_COLORS.primary : FLAVORWORLD_COLORS.border,
                backgroundColor: mediaType === 'image' ? `${FLAVORWORLD_COLORS.primary}20` : FLAVORWORLD_COLORS.background
              }}
            >
              <Camera className="w-5 h-5 mr-2" style={{ color: FLAVORWORLD_COLORS.primary }} />
              <span className="font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>Photo</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleFileSelect('video')}
              className={`flex-1 flex items-center justify-center px-6 py-3 border-2 rounded-xl transition-colors ${
                mediaType === 'video' 
                  ? 'border-teal-500 bg-teal-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              style={{ 
                borderColor: mediaType === 'video' ? FLAVORWORLD_COLORS.secondary : FLAVORWORLD_COLORS.border,
                backgroundColor: mediaType === 'video' ? `${FLAVORWORLD_COLORS.secondary}20` : FLAVORWORLD_COLORS.background
              }}
            >
              <Video className="w-5 h-5 mr-2" style={{ color: FLAVORWORLD_COLORS.secondary }} />
              <span className="font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>Video</span>
            </button>
          </div>

          {/* Media Preview */}
          {media && (
            <div className="relative inline-block mt-4">
              {mediaType === 'image' ? (
                <img 
                  src={media.uri} 
                  alt="Recipe preview" 
                  className="w-64 h-48 object-cover rounded-xl"
                />
              ) : mediaType === 'video' ? (
                <video 
                  src={media.uri} 
                  controls 
                  className="w-64 h-48 object-cover rounded-xl"
                />
              ) : null}
              
              <button
                type="button"
                onClick={() => {
                  setMedia(null);
                  setMediaType('none');
                }}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-50"
              >
                <X className="w-5 h-5" style={{ color: FLAVORWORLD_COLORS.danger }} />
              </button>
            </div>
          )}

          {/* Placeholder when no media */}
          {!media && (
            <div 
              className="border-2 border-dashed rounded-xl p-8 text-center"
              style={{ 
                borderColor: FLAVORWORLD_COLORS.border,
                backgroundColor: FLAVORWORLD_COLORS.background 
              }}
            >
              <PlusCircle className="w-12 h-12 mx-auto mb-3" style={{ color: FLAVORWORLD_COLORS.textLight }} />
              <p className="text-lg font-medium" style={{ color: FLAVORWORLD_COLORS.text }}>
                Add a photo or video
              </p>
              <p className="text-sm mt-1" style={{ color: FLAVORWORLD_COLORS.textLight }}>
                Make your recipe come alive!
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
            isLoading 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:opacity-90 transform hover:scale-[1.02]'
          }`}
          style={{ 
            backgroundColor: FLAVORWORLD_COLORS.primary,
            color: FLAVORWORLD_COLORS.white 
          }}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          ) : (
            <HeaderIcon className="w-6 h-6 mr-3" />
          )}
          {isLoading 
            ? 'Sharing...' 
            : isGroupPost 
              ? `Share with ${groupName}` 
              : 'Share Recipe'
          }
        </button>
      </div>
    </div>
  );
};

export default CreatePostComponent;