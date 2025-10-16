// client/tests/e2e/helpers/recipes.js

const API_URL = 'http://localhost:3000/api';

/**
 * Generate test recipe data
 */
export function generateTestRecipe(prefix = 'e2e') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    title: `${prefix.toUpperCase()} Test Recipe ${random}`,
    description: `A delicious test recipe created at ${timestamp}`,
    ingredients: `Test ingredient 1\nTest ingredient 2\nTest ingredient 3`,
    instructions: `Step 1: Test step\nStep 2: Another test step\nStep 3: Final step`,
    category: 'Italian',
    meatType: 'Mixed',
    prepTime: 30,
    servings: 4
  };
}

/**
 * Create recipe via API
 */
export async function createRecipe(recipeData, token) {
  try {
    const response = await fetch(`${API_URL}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(recipeData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Create recipe failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to create recipe'
      };
    }
    
    console.log('Recipe created successfully:', data.recipe?._id);
    
    return {
      success: true,
      recipe: data.recipe
    };
  } catch (error) {
    console.error('Create recipe error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all recipes
 */
export async function getAllRecipes() {
  try {
    const response = await fetch(`${API_URL}/recipes`);
    const data = await response.json();
    
    return {
      success: response.ok,
      recipes: data
    };
  } catch (error) {
    console.error('Get recipes error:', error);
    return {
      success: false,
      recipes: []
    };
  }
}

/**
 * Get recipe by ID
 */
export async function getRecipeById(recipeId) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`);
    const data = await response.json();
    
    return {
      success: response.ok,
      recipe: data
    };
  } catch (error) {
    console.error('Get recipe error:', error);
    return {
      success: false,
      recipe: null
    };
  }
}

/**
 * Update recipe via API
 */
export async function updateRecipe(recipeId, updateData, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      recipe: data.recipe
    };
  } catch (error) {
    console.error('Update recipe error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete recipe via API
 */
export async function deleteRecipe(recipeId, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: response.ok
    };
  } catch (error) {
    console.error('Delete recipe error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Like recipe via API
 */
export async function likeRecipe(recipeId, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      data
    };
  } catch (error) {
    console.error('Like recipe error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Unlike recipe via API
 */
export async function unlikeRecipe(recipeId, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/like`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      data
    };
  } catch (error) {
    console.error('Unlike recipe error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Add comment to recipe via API
 */
export async function addComment(recipeId, commentText, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText })
    });
    
    const data = await response.json();
    
    return {
      success: response.ok,
      data: data.data || data
    };
  } catch (error) {
    console.error('Add comment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete comment from recipe via API
 */
export async function deleteComment(recipeId, commentId, token) {
  try {
    const response = await fetch(`${API_URL}/recipes/${recipeId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: response.ok
    };
  } catch (error) {
    console.error('Delete comment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Wait for recipe to appear in feed
 */
export async function waitForRecipeInFeed(page, recipeTitle, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const recipeExists = await page.locator(`text=${recipeTitle}`).count() > 0;
      if (recipeExists) {
        console.log(`Recipe "${recipeTitle}" found in feed`);
        return true;
      }
      await page.waitForTimeout(500);
    } catch (error) {
      // Continue waiting
    }
  }
  
  console.error(`Recipe "${recipeTitle}" not found in feed after ${timeout}ms`);
  return false;
}

/**
 * Navigate to home and wait for load
 */
export async function navigateToHome(page) {
  await page.goto('http://localhost:5173/home');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for feed to load
}

/**
 * Open create recipe modal
 */
export async function openCreateRecipeModal(page) {
  // Click on create post button
  const createButton = page.locator('button:has-text("What\'s cooking today?")');
  await createButton.click();
  
  // Wait for modal to open
  await page.waitForSelector('.modal-container', { state: 'visible' });
  await page.waitForTimeout(500);
}

/**
 * Fill recipe form
 */
export async function fillRecipeForm(page, recipeData) {
  console.log('Filling recipe form with:', recipeData);
  
  // Title
  await page.locator('input[placeholder="What\'s cooking?"]').fill(recipeData.title);
  
  // Description
  await page.locator('textarea[placeholder*="Tell us about"]').first().fill(recipeData.description);
  
  // Ingredients
  await page.locator('textarea[placeholder*="ingredients"]').fill(recipeData.ingredients);
  
  // Instructions
  await page.locator('textarea[placeholder*="instructions"]').fill(recipeData.instructions);
  
  // Category
  const categoryButton = page.locator('.dropdown-button').first();
  await categoryButton.click();
  await page.waitForTimeout(300);
  await page.locator(`.dropdown-item:has-text("${recipeData.category}")`).click();
  await page.waitForTimeout(300);
  
  // Meat Type
  const meatTypeButton = page.locator('.dropdown-button').last();
  await meatTypeButton.click();
  await page.waitForTimeout(300);
  await page.locator(`.dropdown-item:has-text("${recipeData.meatType}")`).click();
  await page.waitForTimeout(300);
  
  // Prep Time
  const hours = Math.floor(recipeData.prepTime / 60);
  const minutes = recipeData.prepTime % 60;
  
  if (hours > 0) {
    await page.locator('input.time-input').first().fill(hours.toString());
  }
  if (minutes > 0) {
    await page.locator('input.time-input').last().fill(minutes.toString());
  }
  
  // Servings
  await page.locator('input[placeholder="4"]').fill(recipeData.servings.toString());
  
  console.log('Recipe form filled successfully');
}

/**
 * Submit recipe form
 */
export async function submitRecipeForm(page) {
  const submitButton = page.locator('button:has-text("Share Recipe")');
  await submitButton.click();
  
  // Wait for alert
  let alertShown = false;
  page.once('dialog', async dialog => {
    console.log('Alert:', dialog.message());
    alertShown = true;
    await dialog.accept();
  });
  
  await page.waitForTimeout(2000);
  
  return alertShown;
}

export default {
  generateTestRecipe,
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  unlikeRecipe,
  addComment,
  deleteComment,
  waitForRecipeInFeed,
  navigateToHome,
  openCreateRecipeModal,
  fillRecipeForm,
  submitRecipeForm
};