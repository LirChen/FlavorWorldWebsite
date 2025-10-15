// client/tests/e2e/helpers/selectors.js

/**
 * E2E Selectors - Based on EXACT code from RegisterScreen.jsx, LoginScreen.jsx, etc.
 */

export const auth = {
  register: {
    // Inputs - exact placeholders from RegisterScreen.jsx
    fullNameInput: 'input[placeholder="Chef\'s Name"]',
    emailInput: 'input[placeholder="chef@FlavorWorld.com"]',
    passwordInput: 'input[placeholder="Create a strong password"]',
    confirmPasswordInput: 'input[placeholder="Confirm your password"]',
    
    // Buttons
    submitButton: 'button:has-text("Join the Community")',
    togglePasswordBtn: 'button.visibility-icon',
    
    // Links
    loginLink: 'button.form-footer-button',
    
    // Error messages (appear as span.error-text)
    errorText: '.error-text',
    
    // Page elements
    title: '.title',
    titleHighlight: '.title-highlight',
  },

  login: {
    // Inputs - exact placeholders from LoginScreen.jsx
    emailInput: 'input[placeholder="example@flavorworld.com"]',
    passwordInput: 'input[placeholder="Enter your password"]',
    
    // Buttons
    submitButton: 'button:has-text("Sign in")',
    togglePasswordBtn: 'button.password-toggle',
    
    // Links
    forgotPasswordLink: 'button:has-text("Forgot password?")',
    registerLink: 'button.register-link-container',
    
    // Error messages
    errorMessage: '.error-message',
    
    // Page elements
    pageTitle: 'text=Welcome Back',
    heroTitle: 'text=Share Your',
  },

  forgotPassword: {
    emailInput: 'input[placeholder*="example@FlavorWorld.com"]',
    continueButton: 'button:has-text("Continue")',
    sendResetButton: 'button:has-text("Send Reset Code")',
    backToLoginButton: 'button:has-text("Back to Login")',
    emailStatusValid: '.email-status-valid',
    emailStatusInvalid: '.email-status-invalid',
    pageTitle: 'text=Reset Password',
  },

  resetCode: {
    codeInputs: '.code-input',
    verifyButton: 'button:has-text("Verify Code")',
    resendButton: 'button:has-text("Resend")',
    backButton: 'button:has-text("Back to Email")',
    pageTitle: 'text=Enter Reset Code',
  },
};

export const common = {
  spinner: '.spinner',
  loading: 'text=Loading',
  button: 'button',
  input: 'input',
};

export const recipe = {
  create: {
    titleInput: 'input[placeholder="What\'s cooking?"]',
    descriptionTextarea: 'textarea[placeholder="Tell us about your recipe..."]',
    ingredientsTextarea: 'textarea[placeholder="List all ingredients..."]',
    instructionsTextarea: 'textarea[placeholder="Step by step instructions..."]',
    categoryDropdown: '.dropdown-button',
    meatTypeDropdown: '.dropdown-button',
    prepTimeHoursInput: 'input[placeholder="0"]',
    prepTimeMinutesInput: 'input[placeholder="30"]',
    servingsInput: 'input[placeholder="4"]',
    photoButton: 'button:has-text("Photo")',
    videoButton: 'button:has-text("Video")',
    submitButton: 'button:has-text("Share Recipe")',
    errorMessage: '.error-message'
  },
  
  post: {
    title: '.post-title',
    description: '.post-description',
    likeButton: 'button:has-text("Like")',
    commentButton: 'button:has-text("Comment")',
    shareButton: 'button:has-text("Share")',
    commentInput: 'input[placeholder="Write a comment..."]',
    commentSendButton: 'button:has(svg)', // Send icon
    deleteButton: 'button:has-text("Delete")',
    editButton: 'button:has-text("Edit")',
  },
  
  edit: {
    titleInput: 'input[type="text"]',
    updateButton: 'button:has-text("Update Recipe")',
  }
};

export default { auth, common , recipe };