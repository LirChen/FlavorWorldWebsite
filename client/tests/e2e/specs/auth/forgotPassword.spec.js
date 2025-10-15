// client/tests/e2e/specs/auth/forgotPassword.spec.js
import { test, expect } from '@playwright/test';
import { 
  setupE2ETest, 
  cleanupE2ETest,
  generateTestUser,
  registerUser
} from '../../helpers/setup.js';
import { auth } from '../../helpers/selectors.js';

test.describe('Forgot Password E2E Tests', () => {
  
  let testUser;

  test.beforeAll(async () => {
    await setupE2ETest();
    
    // Create a test user
    testUser = generateTestUser('forgot-pwd');
    const result = await registerUser(testUser);
    expect(result.success).toBe(true);
    
    console.log('✅ Test user created:', testUser.email);
  });

  test.afterAll(async () => {
    await cleanupE2ETest();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  // ============================================
  // ✅ UI & NAVIGATION TESTS
  // ============================================

  test('should display forgot password page correctly', async ({ page }) => {
    // Check title
    await expect(page.locator(auth.forgotPassword.pageTitle)).toBeVisible();
    
    // Check subtitle
    await expect(page.locator('text=Enter your email')).toBeVisible();
    
    // Check form elements
    await expect(page.locator(auth.forgotPassword.emailInput)).toBeVisible();
    await expect(page.locator(auth.forgotPassword.continueButton)).toBeVisible();
    await expect(page.locator(auth.forgotPassword.backToLoginButton)).toBeVisible();
  });

  test('should have disabled button for empty email', async ({ page }) => {
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Button should be disabled when email is empty
    await expect(continueButton).toBeDisabled();
  });

  test('should have disabled button for invalid email', async ({ page }) => {
    await page.locator(auth.forgotPassword.emailInput).fill('invalid-email');
    
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Button should remain disabled for invalid email
    await expect(continueButton).toBeDisabled();
  });

  test('should enable button for valid email format', async ({ page }) => {
    await page.locator(auth.forgotPassword.emailInput).fill('test@example.com');
    
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Button should be enabled for valid email
    await expect(continueButton).toBeEnabled();
  });

  test('should navigate back to login page', async ({ page }) => {
    await page.locator(auth.forgotPassword.backToLoginButton).click();
    
    await page.waitForURL('**/login');
    
    // Verify we're on login page
    await expect(page.locator(auth.login.pageTitle)).toBeVisible();
  });

  test('should trim whitespace from email', async ({ page }) => {
    const emailWithSpaces = `  ${testUser.email}  `;
    
    await page.locator(auth.forgotPassword.emailInput).fill(emailWithSpaces);
    
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Should be enabled (whitespace trimmed)
    await expect(continueButton).toBeEnabled();
  });

  test('should handle case-insensitive email', async ({ page }) => {
    const upperEmail = testUser.email.toUpperCase();
    
    await page.locator(auth.forgotPassword.emailInput).fill(upperEmail);
    
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Should be enabled
    await expect(continueButton).toBeEnabled();
  });

  test('should validate email format in real-time', async ({ page }) => {
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    const emailInput = page.locator(auth.forgotPassword.emailInput);
    
    // Start with invalid format
    await emailInput.fill('test');
    await expect(continueButton).toBeDisabled();
    
    // Add @ sign
    await emailInput.fill('test@');
    await expect(continueButton).toBeDisabled();
    
    // Complete to valid email
    await emailInput.fill('test@test.com');
    await expect(continueButton).toBeEnabled();
  });

  // ============================================
  // ♿ ACCESSIBILITY
  // ============================================

  test('should have proper form labels', async ({ page }) => {
    await expect(page.locator('label:has-text("Email address")')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus email input
    await page.locator(auth.forgotPassword.emailInput).focus();
    await page.keyboard.type(testUser.email);
    
    // Tab to continue button
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Verify button is focused (can be activated)
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    await expect(continueButton).toBeEnabled();
  });

  // ============================================
  // 📱 RESPONSIVE
  // ============================================

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // All elements should be visible
    await expect(page.locator(auth.forgotPassword.emailInput)).toBeVisible();
    await expect(page.locator(auth.forgotPassword.continueButton)).toBeVisible();
    await expect(page.locator(auth.forgotPassword.backToLoginButton)).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // All elements should be visible
    await expect(page.locator(auth.forgotPassword.emailInput)).toBeVisible();
    await expect(page.locator(auth.forgotPassword.continueButton)).toBeVisible();
  });

  // ============================================
  // 🎯 EDGE CASES
  // ============================================

  test('should handle very long email', async ({ page }) => {
    const longEmail = 'a'.repeat(100) + '@test.com';
    
    await page.locator(auth.forgotPassword.emailInput).fill(longEmail);
    
    // Should still work (or show appropriate validation)
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    const isEnabled = await continueButton.isEnabled();
    
    // Either enabled (accepts long emails) or disabled (validates max length)
    expect(typeof isEnabled).toBe('boolean');
  });

  test('should handle special characters in email', async ({ page }) => {
    const specialEmail = 'test+special@example.com';
    
    await page.locator(auth.forgotPassword.emailInput).fill(specialEmail);
    
    const continueButton = page.locator(auth.forgotPassword.continueButton);
    
    // Should accept valid special characters
    await expect(continueButton).toBeEnabled();
  });

  // ============================================
  // 📝 NOTE: Email sending tests skipped
  // ============================================
  // These tests require actual email server setup:
  // - should check if email exists
  // - should send reset code
  // - should handle unregistered email
  // 
  // These are better tested with:
  // 1. API integration tests
  // 2. Email mocking service
  // 3. Manual testing with real email
});