import express from 'express';
import Recipe from '../models/Recipe.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import upload from '../middleware/upload.js';
import { isMongoConnected } from '../config/database.js';

const router = express.Router();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// ✅ CREATE RECIPE
router.post('/', authenticateToken, upload.any(), async (req, res) => {
  try {
    console.log('=== Recipe Creation Debug ===');
    console.log('MongoDB connected:', isMongoConnected());
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      category,
      meatType,
      prepTime,
      servings
    } = req.body;

    if (!title || !description || !ingredients || !instructions || !category || !meatType || !prepTime || !servings) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const recipeData = {
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      category,
      meatType,
      prepTime: parseInt(prepTime),
      servings: parseInt(servings),
      userId: req.user._id.toString(),
      userName: req.user.fullName,
      userAvatar: req.user.avatar || null,
      likes: [],
      comments: []
    };

    // ✅ Handle image/video upload
    let mediaData = null;
    if (req.files && req.files.length > 0) {
      const mediaFile = req.files.find(file => 
        file.fieldname === 'image' || 
        file.fieldname === 'video' ||
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/')
      );
      
      if (mediaFile) {
        const base64Data = mediaFile.buffer.toString('base64');
        mediaData = `data:${mediaFile.mimetype};base64,${base64Data}`;
        console.log('✅ Media converted to base64:', mediaFile.mimetype);
      }
    }

    // Check if media already in body (base64)
    if (!mediaData && req.body.image) {
      mediaData = req.body.image;
    }

    if (mediaData) {
      recipeData.image = mediaData;
    }

    const recipe = new Recipe(recipeData);
    const savedRecipe = await recipe.save();
    
    console.log('✅ Recipe saved successfully:', savedRecipe._id);

    // ✅ Return complete recipe
    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: savedRecipe.toObject()
    });

  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET ALL RECIPES
router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE RECIPE
router.get('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ UPDATE RECIPE
router.put('/:id', authenticateToken, upload.any(), async (req, res) => {
  try {
    console.log('=== Recipe Update Debug ===');
    console.log('Recipe ID:', req.params.id);
    
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this recipe' });
    }

    // Build update data
    const updateData = {
      title: req.body.title || recipe.title,
      description: req.body.description || recipe.description,
      ingredients: req.body.ingredients || recipe.ingredients,
      instructions: req.body.instructions || recipe.instructions,
      category: req.body.category || recipe.category,
      meatType: req.body.meatType || recipe.meatType,
      prepTime: req.body.prepTime ? parseInt(req.body.prepTime) : recipe.prepTime,
      servings: req.body.servings ? parseInt(req.body.servings) : recipe.servings
    };

    // ✅ Handle media update
    if (req.files && req.files.length > 0) {
      const mediaFile = req.files.find(file => 
        file.fieldname === 'image' || 
        file.fieldname === 'video' ||
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/')
      );
      
      if (mediaFile) {
        const base64Data = mediaFile.buffer.toString('base64');
        updateData.image = `data:${mediaFile.mimetype};base64,${base64Data}`;
        console.log('✅ Media updated to base64');
      }
    } else if (req.body.image) {
      // Keep existing or use provided base64
      updateData.image = req.body.image;
    } else if (req.body.existingImage) {
      updateData.image = req.body.existingImage;
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Recipe updated successfully:', updatedRecipe._id);

    res.json({
      message: 'Recipe updated successfully',
      recipe: updatedRecipe.toObject()
    });
  } catch (error) {
    console.error('❌ Error updating recipe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE RECIPE
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (recipe.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ LIKE RECIPE
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const userId = req.user._id.toString();
    
    if (!recipe.likes) recipe.likes = [];
    
    if (recipe.likes.includes(userId)) {
      return res.status(400).json({ message: 'Recipe already liked' });
    }

    recipe.likes.push(userId);
    await recipe.save();

    console.log('✅ Recipe liked');

    res.json({ 
      message: 'Recipe liked successfully', 
      likesCount: recipe.likes.length,
      likes: recipe.likes
    });
  } catch (error) {
    console.error('Error liking recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ UNLIKE RECIPE
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const userId = req.user._id.toString();
    
    if (!recipe.likes || !recipe.likes.includes(userId)) {
      return res.status(400).json({ message: 'Recipe not liked yet' });
    }

    recipe.likes = recipe.likes.filter(id => id.toString() !== userId);
    await recipe.save();

    console.log('✅ Recipe unliked');

    res.json({ 
      message: 'Like removed successfully', 
      likesCount: recipe.likes.length,
      likes: recipe.likes
    });
  } catch (error) {
    console.error('Error removing like:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ ADD COMMENT
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = {
      userId: req.user._id.toString(),
      userName: req.user.fullName,
      userAvatar: req.user.avatar || null,
      text: text.trim(),
      createdAt: new Date()
    };

    if (!recipe.comments) recipe.comments = [];
    recipe.comments.push(comment);
    await recipe.save();

    const savedComment = recipe.comments[recipe.comments.length - 1];

    console.log('✅ Comment added');

    res.status(201).json({
      message: 'Comment added successfully',
      data: {
        comment: {
          ...savedComment.toObject(),
          _id: savedComment._id.toString()
        },
        comments: recipe.comments,
        commentsCount: recipe.comments.length
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ DELETE COMMENT
router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    recipe.comments.pull({ _id: req.params.commentId });
    await recipe.save();

    console.log('✅ Comment deleted');

    res.json({ 
      message: 'Comment deleted successfully',
      commentsCount: recipe.comments.length
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    recipe.comments.pull({ _id: req.params.commentId });
    await recipe.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const user = await User.findById(req.user._id);
    const savedItem = user.savedRecipes.find(item => item.recipeId.toString() === req.params.id);
    
    if (savedItem) {
      return res.status(400).json({ message: 'Recipe already saved' });
    }

    user.savedRecipes.push({ recipeId: req.params.id, savedAt: new Date() });
    await user.save();

    res.json({ message: 'Recipe saved successfully' });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id/save', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.savedRecipes = user.savedRecipes.filter(item => item.recipeId.toString() !== req.params.id);
    await user.save();

    res.json({ message: 'Recipe unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/saved/all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.savedRecipes || user.savedRecipes.length === 0) {
      return res.json([]);
    }

    const recipeIds = user.savedRecipes.map(item => item.recipeId);
    
    const recipes = await Recipe.find({
      _id: { $in: recipeIds }
    });

    const enrichedRecipes = await Promise.all(
      recipes.map(async (recipe) => {
        try {
          const recipeUser = await User.findById(recipe.userId);
          const savedItem = user.savedRecipes.find(
            item => item.recipeId.toString() === recipe._id.toString()
          );
          
          return {
            ...recipe.toObject(),
            userName: recipeUser ? recipeUser.fullName : 'Unknown User',
            userAvatar: recipeUser ? recipeUser.avatar : null,
            savedAt: savedItem ? savedItem.savedAt : new Date()
          };
        } catch (error) {
          const savedItem = user.savedRecipes.find(
            item => item.recipeId.toString() === recipe._id.toString()
          );
          return {
            ...recipe.toObject(),
            userName: 'Unknown User',
            userAvatar: null,
            savedAt: savedItem ? savedItem.savedAt : new Date()
          };
        }
      })
    );

    enrichedRecipes.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.json(enrichedRecipes);
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;