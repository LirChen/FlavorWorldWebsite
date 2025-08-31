import React, { useState, useEffect, useRef } from 'react';
import { 
 ArrowLeft, 
 ChevronDown, 
 Camera, 
 Trash2, 
 Check, 
 X, 
 Users,
 Loader
} from 'lucide-react';
import { recipeService } from '../../../services/recipeService';
import { groupService } from '../../../services/groupService';
import { useAuth } from '../../../contexts/AuthContext';
import './EditPostScreen.css';

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
 'Middle Eastern', 'Greek', 'Spanish', 'Korean', 'Vietnamese'
];

const MEAT_TYPES = [
 'Vegetarian', 'Vegan', 'Chicken', 'Beef', 'Pork', 
 'Fish', 'Seafood', 'Lamb', 'Turkey', 'Mixed'
];

const EditPostScreen = ({ route, navigation }) => {
 const { currentUser } = useAuth();
 const fileInputRef = useRef(null);
 
 const { postId, postData, isGroupPost = false, groupId = null, groupName = null } = route.params || {};

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
     console.log('Loading existing post data for editing:', postData.title);
     
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

   setImageFile(file);

   const reader = new FileReader();
   reader.onload = (e) => {
     setImagePreview(e.target.result);
   };
   reader.readAsDataURL(file);
 };

 const pickImage = () => {
   fileInputRef.current?.click();
 };

 const removeImage = () => {
   setImageFile(null);
   setImagePreview(null);
   setOriginalImage(null);
   if (fileInputRef.current) {
     fileInputRef.current.value = '';
   }
 };

 const handleSubmit = async () => {
   console.log('Updating post...');
   
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
       userId: currentUser?.id || currentUser?._id || currentUser?.userId || 'unknown',
     };

     console.log('Update data:', {
       ...updateData,
       isGroupPost,
       groupId,
       hasNewImage: !!imageFile,
       hasOriginalImage: !!originalImage
     });

     let result;
     
     let mediaToSend = imageFile;
     if (!imageFile && originalImage) {
       updateData.image = originalImage;
     }

     if (isGroupPost && groupId) {
       console.log('Updating group post...');
       result = await groupService.updateGroupPost(groupId, postId, updateData, mediaToSend);
     } else {
       console.log('Updating regular post...');
       result = await recipeService.updateRecipe(postId, updateData, mediaToSend);
     }

     if (result && result.success) {
       const successMessage = isGroupPost 
         ? `Recipe updated in ${groupName}! ✏️`
         : 'Recipe updated successfully! ';

       alert(successMessage);
       navigation.goBack();
     } else {
       alert(result ? result.message : 'Failed to update recipe. Please try again.');
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

 const renderModalList = (data, onSelect, selectedValue, onClose) => (
   <div className="modal-list">
     {data.map((item) => (
       <div
         key={item}
         className={`modal-item ${selectedValue === item ? 'selected' : ''}`}
         onClick={() => {
           onSelect(item);
           onClose();
         }}
       >
         <span className={`modal-item-text ${selectedValue === item ? 'selected' : ''}`}>
           {item}
         </span>
       </div>
     ))}
   </div>
 );

 const getCurrentImage = () => {
   return imagePreview;
 };

 return (
   <div className="edit-post-screen">
     <div className="header">
       <button 
         className="back-button" 
         onClick={() => navigation.goBack()}
       >
         <ArrowLeft size={24} color={FLAVORWORLD_COLORS.accent} />
       </button>
       
       <h1 className="header-title">Edit Recipe</h1>
       
       <div className="placeholder" />
     </div>

     <div className="scroll-container">
       {isGroupPost && groupName && (
         <div className="group-header">
           <div className="group-header-icon">
             <Users size={24} color={FLAVORWORLD_COLORS.secondary} />
           </div>
           <div className="group-header-text">
             <h3 className="group-header-title">Editing in {groupName}</h3>
             <p className="group-header-subtitle">Update your recipe for the group</p>
           </div>
         </div>
       )}

       <div className="form">
         <div className="input-group">
           <label className="label">Recipe Title *</label>
           <input
             type="text"
             className={`input ${errors.title ? 'error' : ''}`}
             value={title}
             onChange={(e) => {
               setTitle(e.target.value);
               clearError('title');
             }}
             placeholder="What's cooking? Give your recipe a delicious name..."
           />
           {errors.title && <span className="error-text">{errors.title}</span>}
         </div>

         <div className="input-group">
           <label className="label">Description *</label>
           <textarea
             className={`textarea ${errors.description ? 'error' : ''}`}
             value={description}
             onChange={(e) => {
               setDescription(e.target.value);
               clearError('description');
             }}
             placeholder="Tell us about your recipe... What makes it special?"
             rows={3}
           />
           {errors.description && <span className="error-text">{errors.description}</span>}
         </div>

         <div className="row-container">
           <div className="half-width">
             <label className="label">Category *</label>
             <div
               className={`selector ${errors.category ? 'error' : ''}`}
               onClick={() => setShowCategoryModal(true)}
             >
               <span className={category ? 'selector-text' : 'placeholder-text'}>
                 {category || 'Select cuisine'}
               </span>
               <ChevronDown size={20} color={FLAVORWORLD_COLORS.accent} />
             </div>
             {errors.category && <span className="error-text">{errors.category}</span>}
           </div>

           <div className="half-width">
             <label className="label">Type *</label>
             <div
               className={`selector ${errors.meatType ? 'error' : ''}`}
               onClick={() => setShowMeatTypeModal(true)}
             >
               <span className={meatType ? 'selector-text' : 'placeholder-text'}>
                 {meatType || 'Select type'}
               </span>
               <ChevronDown size={20} color={FLAVORWORLD_COLORS.accent} />
             </div>
             {errors.meatType && <span className="error-text">{errors.meatType}</span>}
           </div>
         </div>

         <div className="row-container">
           <div className="half-width">
             <label className="label">Prep Time *</label>
             <div className="time-container">
               <input
                 type="number"
                 className={`time-input ${errors.prepTime ? 'error' : ''}`}
                 value={prepTimeHours}
                 onChange={(e) => {
                   setPrepTimeHours(e.target.value);
                   clearError('prepTime');
                 }}
                 placeholder="0"
                 max={23}
                 min={0}
               />
               <span className="time-label">h</span>
               <input
                 type="number"
                 className={`time-input ${errors.prepTime ? 'error' : ''}`}
                 value={prepTimeMinutes}
                 onChange={(e) => {
                   setPrepTimeMinutes(e.target.value);
                   clearError('prepTime');
                 }}
                 placeholder="30"
                 max={59}
                 min={0}
               />
               <span className="time-label">m</span>
             </div>
             {errors.prepTime && <span className="error-text">{errors.prepTime}</span>}
           </div>

           <div className="half-width">
             <label className="label">Servings *</label>
             <input
               type="number"
               className={`input ${errors.servings ? 'error' : ''}`}
               value={servings}
               onChange={(e) => {
                 setServings(e.target.value);
                 clearError('servings');
               }}
               placeholder="4"
               min={1}
               max={99}
             />
             {errors.servings && <span className="error-text">{errors.servings}</span>}
           </div>
         </div>

         <div className="input-group">
           <label className="label">Ingredients *</label>
           <textarea
             className={`textarea ${errors.ingredients ? 'error' : ''}`}
             value={ingredients}
             onChange={(e) => {
               setIngredients(e.target.value);
               clearError('ingredients');
             }}
             placeholder="List all ingredients and quantities..."
             rows={4}
           />
           {errors.ingredients && <span className="error-text">{errors.ingredients}</span>}
         </div>

         <div className="input-group">
           <label className="label">Instructions *</label>
           <textarea
             className={`textarea ${errors.instructions ? 'error' : ''}`}
             value={instructions}
             onChange={(e) => {
               setInstructions(e.target.value);
               clearError('instructions');
             }}
             placeholder="Share your cooking secrets... Step by step instructions"
             rows={5}
           />
           {errors.instructions && <span className="error-text">{errors.instructions}</span>}
         </div>

         <div className="input-group">
           <label className="label">Recipe Photo</label>
           
           <input
             ref={fileInputRef}
             type="file"
             accept="image/*"
             onChange={handleImageSelect}
             style={{ display: 'none' }}
           />
           
           {getCurrentImage() ? (
             <div className="image-container">
               <img src={getCurrentImage()} alt="Recipe" className="selected-image" />
               <div className="image-actions">
                 <button
                   className="change-image-button"
                   onClick={pickImage}
                 >
                   <Camera size={16} color={FLAVORWORLD_COLORS.primary} />
                   <span>Change Photo</span>
                 </button>
                 
                 <button
                   className="remove-image-button"
                   onClick={removeImage}
                 >
                   <Trash2 size={16} color={FLAVORWORLD_COLORS.danger} />
                   <span>Remove</span>
                 </button>
               </div>
             </div>
           ) : (
             <div className="image-picker" onClick={pickImage}>
               <div className="image-picker-placeholder">
                 <Camera size={40} color={FLAVORWORLD_COLORS.secondary} />
                 <h3 className="image-picker-text">Add a mouth-watering photo</h3>
                 <p className="image-picker-subtext">Make your recipe irresistible!</p>
               </div>
             </div>
           )}
         </div>

         <button
           className={`submit-button ${isLoading ? 'disabled' : ''}`}
           onClick={handleSubmit}
           disabled={isLoading}
         >
           {isLoading ? (
             <Loader size={20} color={FLAVORWORLD_COLORS.white} className="loading-spinner" />
           ) : (
             <>
               <Check size={20} color={FLAVORWORLD_COLORS.white} />
               <span>Update Recipe</span>
             </>
           )}
         </button>
       </div>
     </div>

     {showCategoryModal && (
       <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
         <div className="modal-content" onClick={e => e.stopPropagation()}>
           <div className="modal-header">
             <h2 className="modal-title">Select Cuisine</h2>
             <button onClick={() => setShowCategoryModal(false)}>
               <X size={24} color={FLAVORWORLD_COLORS.accent} />
             </button>
           </div>
           {renderModalList(RECIPE_CATEGORIES, (selectedCategory) => {
             setCategory(selectedCategory);
             clearError('category');
           }, category, () => setShowCategoryModal(false))}
         </div>
       </div>
     )}

     {showMeatTypeModal && (
       <div className="modal-overlay" onClick={() => setShowMeatTypeModal(false)}>
         <div className="modal-content" onClick={e => e.stopPropagation()}>
           <div className="modal-header">
             <h2 className="modal-title">Select Type</h2>
             <button onClick={() => setShowMeatTypeModal(false)}>
               <X size={24} color={FLAVORWORLD_COLORS.accent} />
             </button>
           </div>
           {renderModalList(MEAT_TYPES, (selectedType) => {
             setMeatType(selectedType);
             clearError('meatType');
           }, meatType, () => setShowMeatTypeModal(false))}
         </div>
       </div>
     )}
   </div>
 );
};

export default EditPostScreen;