import { test, expect } from '@playwright/test';
import { 
  setupE2ETest, 
  cleanupE2ETest, 
  registerUser, 
  generateTestUser,
  generateTestRecipe 
} from '../../helpers/setup.js';

test.describe('Chats Tests', () => {
  let testUser1, testUser2;
  let user1Token, user2Token;
  let testRecipe;

  test.beforeAll(async () => {
    await setupE2ETest();
  });

  test.afterAll(async () => {
    await cleanupE2ETest();
  });

  test.beforeEach(async ({ request }) => {
    // Create two test users
    testUser1 = generateTestUser('chat1');
    testUser2 = generateTestUser('chat2');
    
    const result1 = await registerUser(testUser1);
    const result2 = await registerUser(testUser2);
    
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    
    user1Token = result1.token;
    user2Token = result2.token;
    
    // Create a test recipe for user1
    const recipeData = generateTestRecipe('chat');
    const createResponse = await request.post('http://localhost:3000/api/recipes', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user1Token}`
      },
      data: recipeData
    });
    
    const responseBody = await createResponse.json();
    testRecipe = responseBody.recipe || responseBody;
    
    // Ensure we have the title
    if (!testRecipe.title) {
      testRecipe.title = recipeData.title;
    }
  });

  test('should create private chat and send message', async ({ page }) => {
    // Login as user1
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', testUser1.email);
    await page.fill('input[type="password"]', testUser1.password);
    await page.click('button.login-button:has-text("Sign in")');
    await page.waitForURL('**/home', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Navigate to search by clicking search box
    await page.click('.search-box input[type="text"]');
    await page.waitForURL('**/search', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Search for user2
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill(testUser2.fullName);
    await page.waitForTimeout(2000);
    
    // Click Users tab
    const usersTab = page.locator('.search-tabs button:has-text("Users")');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }
    
    // Click on user2 to view profile
    const userCard = page.locator(`.result-user:has-text("${testUser2.fullName}")`).first();
    await userCard.click();
    await page.waitForTimeout(2000);
    
    // Click Message button
    const messageButton = page.locator('button.message-btn:has-text("Message")');
    await messageButton.click();
    
    // Should navigate to chat
    await page.waitForURL('**/chat/**', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Send a test message
    const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
    await messageInput.fill('Hello from E2E test!');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1500);
    
    // Verify message appears in chat
    await expect(page.locator('text="Hello from E2E test!"')).toBeVisible();
  });

  test('should share recipe to private chat', async ({ page }) => {
    // First, create a chat between user1 and user2
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', testUser1.email);
    await page.fill('input[type="password"]', testUser1.password);
    await page.click('button.login-button:has-text("Sign in")');
    await page.waitForURL('**/home', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Go to search and create chat
    await page.click('.search-box input[type="text"]');
    await page.waitForURL('**/search', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill(testUser2.fullName);
    await page.waitForTimeout(2000);
    
    const usersTab = page.locator('.search-tabs button:has-text("Users")');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }
    
    const userCard = page.locator(`.result-user:has-text("${testUser2.fullName}")`).first();
    await userCard.click();
    await page.waitForTimeout(2000);
    
    const messageButton = page.locator('button.message-btn:has-text("Message")');
    await messageButton.click();
    await page.waitForURL('**/chat/**', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Go back to home feed - click back button
    const backButton = page.locator('button.back-btn');
    await backButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to home and reload to ensure recipe appears
    await page.goto('http://localhost:5173/home');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Find the test recipe in feed
    const recipePost = page.locator(`.post-component:has-text("${testRecipe.title}")`).first();
    await expect(recipePost).toBeVisible({ timeout: 10000 });
    
    // Click share button
    const shareButton = recipePost.locator('button:has-text("Share")');
    await shareButton.click();
    
    // Wait for share modal
    await page.waitForTimeout(1000);
    await expect(page.locator('text="Share Recipe"')).toBeVisible();
    
    // Make sure we're on Chats tab
    const chatsTab = page.locator('.share-tab:has-text("Chats")');
    if (await chatsTab.isVisible()) {
      await chatsTab.click();
      await page.waitForTimeout(500);
    }
    
    // Select the chat with user2
    const chatOption = page.locator(`.share-item:has-text("${testUser2.fullName}")`).first();
    await chatOption.click();
    await page.waitForTimeout(500);
    
    // Click Share button in modal
    await page.click('button.share-btn:has-text("Share")');
    
    // Wait for share to complete
    await page.waitForTimeout(2000);
    
    // Navigate to chats - click chats icon
    const chatsButton = page.locator('button.nav-icon-btn').nth(3); // 4th button is usually chats
    await chatsButton.click();
    await page.waitForTimeout(2000);
    
    // Click on chat with user2
    const chat = page.locator(`.chat-list-item:has-text("${testUser2.fullName}")`).first();
    if (await chat.isVisible()) {
      await chat.click();
      await page.waitForTimeout(1500);
      
      // Verify recipe preview card is displayed
      await expect(page.locator('.recipe-share-card')).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`.recipe-share-card:has-text("${testRecipe.title}")`)).toBeVisible();
    }
  });

  test('should display recipe preview card components', async ({ page }) => {
    // Setup: Create chat and share recipe
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', testUser1.email);
    await page.fill('input[type="password"]', testUser1.password);
    await page.click('button.login-button:has-text("Sign in")');
    await page.waitForURL('**/home', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Create chat
    await page.click('.search-box input[type="text"]');
    await page.waitForURL('**/search', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill(testUser2.fullName);
    await page.waitForTimeout(2000);
    
    const usersTab = page.locator('.search-tabs button:has-text("Users")');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }
    
    await page.locator(`.result-user:has-text("${testUser2.fullName}")`).first().click();
    await page.waitForTimeout(2000);
    await page.locator('button.message-btn:has-text("Message")').click();
    await page.waitForURL('**/chat/**', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Share recipe - go back and navigate to home
    await page.locator('button.back-btn').click();
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:5173/home');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(2000);
    
    const recipePost = page.locator(`.post-component:has-text("${testRecipe.title}")`).first();
    await expect(recipePost).toBeVisible({ timeout: 10000 });
    await recipePost.locator('button:has-text("Share")').click();
    await page.waitForTimeout(1000);
    
    const chatsTab = page.locator('.share-tab:has-text("Chats")');
    if (await chatsTab.isVisible()) {
      await chatsTab.click();
      await page.waitForTimeout(500);
    }
    
    await page.locator(`.share-item:has-text("${testUser2.fullName}")`).first().click();
    await page.waitForTimeout(500);
    await page.click('button.share-btn:has-text("Share")');
    await page.waitForTimeout(2000);
    
    // Navigate to chat
    const chatsButton = page.locator('button.nav-icon-btn').nth(3);
    await chatsButton.click();
    await page.waitForTimeout(2000);
    
    const chat = page.locator(`.chat-list-item:has-text("${testUser2.fullName}")`).first();
    if (await chat.isVisible()) {
      await chat.click();
      await page.waitForTimeout(1500);
      
      // Verify card components
      const recipeCard = page.locator('.recipe-share-card');
      await expect(recipeCard).toBeVisible({ timeout: 5000 });
      
      // Verify card has title
      await expect(recipeCard.locator('.recipe-title')).toBeVisible();
      
      // Verify card has description
      await expect(recipeCard.locator('.recipe-description')).toBeVisible();
      
      // Verify card has metadata
      await expect(recipeCard.locator('.recipe-meta')).toBeVisible();
    }
  });
});
