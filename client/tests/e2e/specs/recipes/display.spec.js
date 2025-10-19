// client/tests/e2e/specs/recipes/display.spec.js
import { test, expect } from '@playwright/test';
import { 
  setupE2ETest, 
  cleanupE2ETest,
  generateTestUser,
  registerUser,
  loginUser
} from '../../helpers/setup.js';
import { 
  generateTestRecipe,
  createRecipe,
  navigateToHome,
  waitForRecipeInFeed
} from '../../helpers/recipes.js';

test.describe('Recipe Display E2E Tests', () => {
  
  let testUser;
  let userToken;
  let testRecipe;

  test.beforeAll(async () => {
    await setupE2ETest();
    
    // Create test user
    testUser = generateTestUser('recipe-viewer');
    const registerResult = await registerUser(testUser);
    expect(registerResult.success).toBe(true);
    
    const loginResult = await loginUser(testUser.email, testUser.password);
    expect(loginResult.success).toBe(true);
    userToken = loginResult.token;
    
    // Create a test recipe via API
    const recipeData = generateTestRecipe('display-test');
    const createResult = await createRecipe(recipeData, userToken);
    expect(createResult.success).toBe(true);
    testRecipe = createResult.recipe;
    
    console.log('✅ Test user and recipe created for display tests');
  });

  test.afterAll(async () => {
    await cleanupE2ETest();
  });

  test.beforeEach(async ({ page }) => {
    // Login via UI
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example@flavorworld.com"]').fill(testUser.email);
    await page.locator('input[placeholder*="Enter your password"]').fill(testUser.password);
    
    // Global dialog handler
    page.on('dialog', async dialog => {
      console.log('Dialog:', dialog.message());
      await dialog.accept();
    });
    
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForURL('**/home', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  // ============================================
  // ✅ BASIC DISPLAY TESTS
  // ============================================

  test('should display recipe in feed', async ({ page }) => {
    await navigateToHome(page);
    
    // Wait for recipe to appear
    const recipeInFeed = await waitForRecipeInFeed(page, testRecipe.title, 10000);
    expect(recipeInFeed).toBe(true);
    
    // Verify recipe card is visible
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    await expect(recipeCard).toBeVisible();
  });

  test('should display recipe title', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check title is visible and correct
    await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible();
  });

  test('should display recipe description', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check if description is visible
    const description = testRecipe.description;
    if (description && description.length > 0) {
      // Description might be truncated, so check for first part
      const firstPart = description.substring(0, 30);
      await expect(page.locator(`text=${firstPart}`).first()).toBeVisible();
    }
  });

  test('should display author information', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check if author name is visible (should be test user's name)
    await expect(page.locator(`text=${testUser.fullName}`).first()).toBeVisible();
  });

  test('should display prep time', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check for time indicator (could be "30 min", "1h 30m", etc.)
    // Look for clock icon or time text
    const timePattern = /\d+\s*(min|h|hour|minute)/i;
    const pageContent = await page.content();
    
    // Should have some time indication
    expect(pageContent).toMatch(timePattern);
  });

  test('should display servings count', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check for servings (e.g., "4 servings", "Serves 4")
    const servingsPattern = /\d+\s*(serving|serve)/i;
    const pageContent = await page.content();
    
    expect(pageContent).toMatch(servingsPattern);
  });

  test('should display category badge', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check if category is visible
    await expect(page.locator(`text=${testRecipe.category}`).first()).toBeVisible();
  });

  test('should display meat type badge', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check if meat type is visible
    await expect(page.locator(`text=${testRecipe.meatType}`).first()).toBeVisible();
  });

  // ============================================
  // 🖼️ MEDIA DISPLAY TESTS
  // ============================================

  test('should display placeholder when no image', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Since we created recipe without media, should have placeholder
    // Check for default food emoji or placeholder image
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Look for placeholder indicators (emoji, icon, or placeholder class)
    const hasPlaceholder = await recipeCard.locator('text=🍽️').count() > 0 ||
                           await recipeCard.locator('.placeholder').count() > 0 ||
                           await recipeCard.locator('[alt*="placeholder"]').count() > 0;
    
    expect(hasPlaceholder).toBeTruthy();
  });

  // ============================================
  // 📊 INTERACTION COUNTERS
  // ============================================

  test('should display like counter', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check for heart icon or like counter
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Look for like button/counter (could be "0 likes", heart icon, etc.)
    const likeElements = await recipeCard.locator('[class*="like"]').count() +
                         await recipeCard.locator('text=/\\d+\\s*like/i').count();
    
    expect(likeElements).toBeGreaterThan(0);
  });

  test('should display comment counter', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Check for comment icon or counter
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Look for comment button/counter
    const commentElements = await recipeCard.locator('[class*="comment"]').count() +
                            await recipeCard.locator('text=/\\d+\\s*comment/i').count();
    
    expect(commentElements).toBeGreaterThan(0);
  });

  test('should display initial like count as zero', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // New recipe should have 0 likes
    const zeroLikes = await recipeCard.locator('text=/^0$|0\\s*like/i').first();
    await expect(zeroLikes).toBeVisible({ timeout: 5000 });
  });

  test('should display initial comment count as zero', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // New recipe should have 0 comments
    const zeroComments = await recipeCard.locator('text=/^0$|0\\s*comment/i').first();
    await expect(zeroComments).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // 🎨 RECIPE CARD STRUCTURE
  // ============================================

  test('should have clickable recipe card', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeTitle = page.locator(`text=${testRecipe.title}`).first();
    
    // Card should be clickable
    await expect(recipeTitle).toBeVisible();
    
    // Try to click (don't navigate, just verify it's clickable)
    const isClickable = await recipeTitle.evaluate(el => {
      return window.getComputedStyle(el).cursor === 'pointer' ||
             el.closest('a') !== null ||
             el.onclick !== null;
    });
    
    // Should be clickable or within clickable element
    expect(isClickable).toBeTruthy();
  });

  test('should display action buttons', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Should have like button
    const likeButton = recipeCard.locator('button[class*="like"]').first();
    await expect(likeButton).toBeVisible({ timeout: 5000 });
    
    // Should have comment button
    const commentButton = recipeCard.locator('button[class*="comment"]').first();
    await expect(commentButton).toBeVisible({ timeout: 5000 });
  });

  test('should display menu button for own recipe', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Should have 3-dot menu (Edit/Delete) since it's user's own recipe
    const menuButton = recipeCard.locator('button[class*="menu"]').first();
    await expect(menuButton).toBeVisible({ timeout: 5000 });
  });

  // ============================================
  // 📱 RESPONSIVE TESTS
  // ============================================

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Recipe should be visible
    await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible();
    
    // Title should be visible
    const title = page.locator(`text=${testRecipe.title}`);
    await expect(title).toBeVisible();
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    const avatar = recipeCard.locator('.post-author img, [class*="avatar"]').first();
    await expect(avatar).toBeVisible({ timeout: 5000 });
    });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Recipe should be visible
    await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Recipe should be visible
    await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible();
  });

  // ============================================
  // 🔄 MULTIPLE RECIPES
  // ============================================

  test('should display multiple recipes in feed', async ({ page }) => {
    // Create second recipe
    const recipe2Data = generateTestRecipe('second-recipe');
    const createResult = await createRecipe(recipe2Data, userToken);
    expect(createResult.success).toBe(true);
    
    await navigateToHome(page);
    await page.waitForTimeout(2000);
    
    // Both recipes should be visible
    await expect(page.locator(`text=${testRecipe.title}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${createResult.recipe.title}`)).toBeVisible({ timeout: 10000 });
  });

  test('should display recipes in chronological order', async ({ page }) => {
    // Create third recipe
    const recipe3Data = generateTestRecipe('third-recipe');
    const createResult = await createRecipe(recipe3Data, userToken);
    expect(createResult.success).toBe(true);
    
    await navigateToHome(page);
    await page.waitForTimeout(2000);
    
    // Get all recipe titles
    const recipeTitles = await page.locator('[class*="recipe-title"], [class*="post-title"], h2, h3').allTextContents();
    
    // Newest recipe should appear first (if sorted by date descending)
    const newestIndex = recipeTitles.findIndex(title => title.includes(createResult.recipe.title));
    const oldestIndex = recipeTitles.findIndex(title => title.includes(testRecipe.title));
    
    // Newest should be before oldest (smaller index)
    if (newestIndex !== -1 && oldestIndex !== -1) {
      expect(newestIndex).toBeLessThan(oldestIndex);
    }
  });

  // ============================================
  // 🎯 EDGE CASES
  // ============================================

  test('should handle long recipe title', async ({ page }) => {
    const longTitleRecipe = generateTestRecipe('long-title');
    longTitleRecipe.title = 'A'.repeat(100) + ' ' + Date.now(); // Very long title
    
    const createResult = await createRecipe(longTitleRecipe, userToken);
    expect(createResult.success).toBe(true);
    
    await navigateToHome(page);
    await page.waitForTimeout(2000);
    
    // Should display (possibly truncated)
    const titleElement = page.locator(`text=${longTitleRecipe.title.substring(0, 50)}`).first();
    await expect(titleElement).toBeVisible({ timeout: 10000 });
  });

  test('should handle long description', async ({ page }) => {
    const longDescRecipe = generateTestRecipe('long-desc');
    longDescRecipe.description = 'B'.repeat(500); // Very long description
    
    const createResult = await createRecipe(longDescRecipe, userToken);
    expect(createResult.success).toBe(true);
    
    await navigateToHome(page);
    await page.waitForTimeout(2000);
    
    // Recipe should be visible
    await expect(page.locator(`text=${createResult.recipe.title}`)).toBeVisible({ timeout: 10000 });
  });

  test('should handle special characters in title', async ({ page }) => {
    const specialRecipe = generateTestRecipe('special');
    specialRecipe.title = `Test Recipe with "Quotes" & Symbols! 🍕 ${Date.now()}`;
    
    const createResult = await createRecipe(specialRecipe, userToken);
    expect(createResult.success).toBe(true);
    
    await navigateToHome(page);
    await page.waitForTimeout(2000);
    
    // Should display correctly
    await expect(page.locator(`text=/Test Recipe with.*Symbols/`)).toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // ⏱️ TIMESTAMP TESTS
  // ============================================

  test('should display post timestamp', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    // Should show "just now", "1 min ago", "2 hours ago", etc.
    const timePattern = /just now|ago|\d+\s*(second|minute|hour|day)/i;
    const pageContent = await page.content();
    
    expect(pageContent).toMatch(timePattern);
  });

  test('should update relative time format', async ({ page }) => {
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator(`text=${testRecipe.title}`).locator('..').locator('..');
    
    // Should have timestamp element
    const timestamp = recipeCard.locator('text=/ago|just now/i').first();
    await expect(timestamp).toBeVisible({ timeout: 5000 });
  });
});