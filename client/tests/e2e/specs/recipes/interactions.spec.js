// client/tests/e2e/specs/recipes/interactions.spec.js
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

test.describe('Recipe Interactions E2E Tests', () => {
  
  let testUser1;
  let testUser2;
  let user1Token;
  let user2Token;
  let testRecipe;

  test.beforeAll(async () => {
    await setupE2ETest();
    
    testUser1 = generateTestUser('interaction-user1');
    testUser2 = generateTestUser('interaction-user2');
    
    const register1 = await registerUser(testUser1);
    const register2 = await registerUser(testUser2);
    
    expect(register1.success).toBe(true);
    expect(register2.success).toBe(true);
    
    const login1 = await loginUser(testUser1.email, testUser1.password);
    const login2 = await loginUser(testUser2.email, testUser2.password);
    
    expect(login1.success).toBe(true);
    expect(login2.success).toBe(true);
    
    user1Token = login1.token;
    user2Token = login2.token;
    
    const recipeData = generateTestRecipe('interaction-test');
    const createResult = await createRecipe(recipeData, user1Token);
    expect(createResult.success).toBe(true);
    testRecipe = createResult.recipe;
    
    console.log('✅ Test users and recipe created for interaction tests');
  });

  test.afterAll(async () => {
    await cleanupE2ETest();
  });

  async function loginUserUI(page, user) {
    await page.goto('http://localhost:5173/login');
    await page.locator('input[placeholder*="example@flavorworld.com"]').fill(user.email);
    await page.locator('input[placeholder*="Enter your password"]').fill(user.password);
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForURL('**/home', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }

  // ============================================
  // ❤️ LIKE TESTS
  // ============================================

  test('should display like button on recipe', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const likeButton = recipeCard.locator('button:has-text("Like")');
    
    await expect(likeButton).toBeVisible();
  });

  test('should like a recipe', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const likesText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const initialCount = parseInt(likesText.match(/\d+/)[0]);
    
    console.log('Initial like count:', initialCount);
    
    const likeButton = recipeCard.locator('button:has-text("Like")');
    await likeButton.click();
    
    await page.waitForTimeout(2000);
    
    const newLikesText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const newCount = parseInt(newLikesText.match(/\d+/)[0]);
    
    console.log('New like count:', newCount);
    
    expect(newCount).toBe(initialCount + 1);
  });

  test('should show liked state after liking', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const likeButton = recipeCard.locator('button:has-text("Like")');
    
    await likeButton.click();
    await page.waitForTimeout(1500);
    
    const hasActiveClass = await likeButton.evaluate(el => el.classList.contains('active'));
    expect(hasActiveClass).toBe(true);
  });

  test('should unlike a recipe', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const likeButton = recipeCard.locator('button:has-text("Like")');
    
    await likeButton.click();
    await page.waitForTimeout(1500);
    
    const likedText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const count = parseInt(likedText.match(/\d+/)[0]);
    
    await likeButton.click();
    await page.waitForTimeout(1500);
    
    const newText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const newCount = parseInt(newText.match(/\d+/)[0]);
    
    expect(newCount).toBe(count - 1);
  });

  test('should toggle like multiple times', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const likeButton = recipeCard.locator('button:has-text("Like")');
    
    const initialText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    await likeButton.click();
    await page.waitForTimeout(1000);
    
    await likeButton.click();
    await page.waitForTimeout(1000);
    
    await likeButton.click();
    await page.waitForTimeout(1000);
    
    const finalText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const finalCount = parseInt(finalText.match(/\d+/)[0]);
    
    expect(finalCount).toBe(initialCount + 1);
  });

  test('should prevent double-liking (optimistic update)', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const likeButton = recipeCard.locator('button:has-text("Like")');
    
    const initialText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    await likeButton.click();
    await likeButton.click();
    
    await page.waitForTimeout(2000);
    
    const finalText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const finalCount = parseInt(finalText.match(/\d+/)[0]);
    
    expect(finalCount).toBeLessThanOrEqual(initialCount + 1);
  });

  // ============================================
  // 💬 COMMENT TESTS
  // ============================================

  test('should display comment button on recipe', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await expect(commentButton).toBeVisible();
  });

  test('should open comment section', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentsSection = recipeCard.locator('.post-comments');
    await expect(commentsSection).toBeVisible();
  });

  test('should display comment input field', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await expect(commentInput).toBeVisible();
  });

  test('should add a comment to recipe', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const initialText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    console.log('Initial comment count:', initialCount);
    
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentText = `E2E Test Comment ${Date.now()}`;
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill(commentText);
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2500);
    
    const newText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const newCount = parseInt(newText.match(/\d+/)[0]);
    
    console.log('New comment count:', newCount);
    
    expect(newCount).toBe(initialCount + 1);
  });

  test('should display added comment in list', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentText = `Display Test ${Date.now()}`;
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill(commentText);
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2500);
    
    const commentsList = recipeCard.locator('.comments-list');
    await expect(commentsList.locator(`text=${commentText}`)).toBeVisible();
  });

  test('should display commenter name', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill('Name test comment');
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2500);
    
    const commentsList = recipeCard.locator('.comments-list');
    await expect(commentsList.locator(`text=${testUser2.fullName}`)).toBeVisible();
  });

  test('should clear input after adding comment', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill('Clear input test');
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2000);
    
    const inputValue = await commentInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should not add empty comment', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const initialText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.press('Enter');
    
    await page.waitForTimeout(1500);
    
    const newText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const newCount = parseInt(newText.match(/\d+/)[0]);
    
    expect(newCount).toBe(initialCount);
  });

  test('should add multiple comments', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const initialText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    
    await commentInput.fill('First comment');
    await commentInput.press('Enter');
    await page.waitForTimeout(1500);
    
    await commentInput.fill('Second comment');
    await commentInput.press('Enter');
    await page.waitForTimeout(1500);
    
    await commentInput.fill('Third comment');
    await commentInput.press('Enter');
    await page.waitForTimeout(1500);
    
    const finalText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const finalCount = parseInt(finalText.match(/\d+/)[0]);
    
    expect(finalCount).toBe(initialCount + 3);
  });

  // ============================================
  // 🗑️ DELETE COMMENT TEST
  // ============================================

  test('should delete own comment', async ({ page }) => {
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const initialText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const uniqueComment = `Delete me ${Date.now()}`;
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill(uniqueComment);
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2500);
    
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    const commentsList = recipeCard.locator('.comments-list');
    const deleteButton = commentsList.locator('button:has-text("Delete")').last();
    await deleteButton.click();
    
    await page.waitForTimeout(2500);
    
    const finalText = await recipeCard.locator('text=/\\d+ comments/').textContent();
    const finalCount = parseInt(finalText.match(/\d+/)[0]);
    
    expect(finalCount).toBe(initialCount);
  });

  // ============================================
  // 📱 MOBILE TESTS
  // ============================================

  test('should like recipe on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const initialText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const initialCount = parseInt(initialText.match(/\d+/)[0]);
    
    const likeButton = recipeCard.locator('button:has-text("Like")');
    await likeButton.click();
    
    await page.waitForTimeout(2000);
    
    const newText = await recipeCard.locator('text=/\\d+ likes/').textContent();
    const newCount = parseInt(newText.match(/\d+/)[0]);
    
    expect(newCount).toBe(initialCount + 1);
  });

  test('should add comment on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUserUI(page, testUser2);
    await navigateToHome(page);
    await waitForRecipeInFeed(page, testRecipe.title);
    
    const recipeCard = page.locator('.post-card').filter({ hasText: testRecipe.title });
    
    const commentButton = recipeCard.locator('button:has-text("Comment")');
    await commentButton.click();
    await page.waitForTimeout(500);
    
    const commentInput = recipeCard.locator('input[placeholder*="Write a comment"]');
    await commentInput.fill('Mobile comment test');
    await commentInput.press('Enter');
    
    await page.waitForTimeout(2500);
    
    const commentsList = recipeCard.locator('.comments-list');
    await expect(commentsList.locator('text=Mobile comment test')).toBeVisible();
  });
});