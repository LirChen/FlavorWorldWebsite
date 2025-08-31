import axios from 'axios';

class UserService {
  constructor() {
    this.baseURL = 'http://localhost:3000'; // Changed to localhost
    
    // Create axios instance with base configurations
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add auth token interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add user ID if exists
        const currentUser = this.getCurrentUser();
        if (currentUser?.id) {
          config.headers['x-user-id'] = currentUser.id;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Helper function to get current user
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing current user:', error);
      return null;
    }
  }

  async searchUsers(query, currentUserId = null) {
    try {
      console.log('UserService: Searching users for:', query);
      
      // If currentUserId not provided, try to get from localStorage
      if (!currentUserId) {
        const currentUser = this.getCurrentUser();
        currentUserId = currentUser?.id || 'temp-user-id';
      }
      
      const response = await this.api.get('/api/users/search', {
        params: { q: query },
        headers: {
          'x-user-id': currentUserId,
        },
      });

      console.log('UserService: Search successful, found:', response.data.length, 'users');
      return response.data;
      
    } catch (error) {
      console.error('UserService: Search error:', error);
      return [];
    }
  }

  async deleteUserAccount(userId, password) {
    try {
      console.log('UserService: Deleting user account for ID:', userId);
      
      const deleteData = {
        userId: userId,
        password: password, 
        confirmDelete: true
      };

      const endpoints = [
        { url: '/api/auth/delete-account', method: 'delete' },
        { url: '/api/user/delete', method: 'delete' },
        { url: '/api/auth/delete-user', method: 'delete' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying delete endpoint: ${endpoint.url}`);
          
          const response = await this.api({
            method: endpoint.method,
            url: endpoint.url,
            data: deleteData,
            headers: {
              'x-user-id': userId,
            },
            timeout: 15000, 
          });

          if (response.data.success || response.status === 200) {
            console.log('User account deleted successfully via:', endpoint.url);
            
            // Clear localStorage after account deletion
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            return {
              success: true,
              message: 'Account deleted successfully',
              data: response.data
            };
          }
        } catch (error) {
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            throw new Error(error.response.data.message || 'Authentication failed. Please check your password.');
          }
          
          console.log(`Delete endpoint ${endpoint.url} error:`, error.message);
          continue;
        }
      }

      throw new Error('Account deletion endpoint not available. Please contact support.');
      
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete account'
      };
    }
  }

  async changePassword(passwordData) {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        return {
          success: false,
          message: 'Current password and new password are required'
        };
      }
      
      const endpoints = [
        { url: '/api/auth/change-password', method: 'put' },
        { url: '/api/auth/change-password', method: 'patch' },
        { url: '/api/user/change-password', method: 'put' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.api({
            method: endpoint.method,
            url: endpoint.url,
            data: passwordData,
          });

          return {
            success: true,
            message: 'Password changed successfully',
            data: response.data
          };
          
        } catch (error) {
          if (error.response) {
            const status = error.response.status;
            const errorMessage = error.response.data?.message || '';
            
            if (status === 400) {
              if (errorMessage.includes('Invalid password') || 
                  errorMessage.includes('Wrong password') ||
                  errorMessage.includes('current password') ||
                  errorMessage.includes('incorrect')) {
                return {
                  success: false,
                  message: 'Current password is incorrect'
                };
              }
              
              if (errorMessage.includes('weak') || 
                  errorMessage.includes('strong') ||
                  errorMessage.includes('password requirements')) {
                return {
                  success: false,
                  message: 'New password is too weak. Use letters, numbers and symbols'
                };
              }

              if (errorMessage.includes('same') || 
                  errorMessage.includes('identical')) {
                return {
                  success: false,
                  message: 'New password must be different from current password'
                };
              }
              
              return {
                success: false,
                message: errorMessage || 'Invalid password data provided'
              };
            }

            if (status === 401) {
              return {
                success: false,
                message: 'Current password is incorrect'
              };
            }

            if (status === 403) {
              return {
                success: false,
                message: 'You are not authorized to change this password'
              };
            }

            if (status === 404) {
              return {
                success: false,
                message: 'User account not found'
              };
            }

            if (status >= 500) {
              return {
                success: false,
                message: 'Server error. Please try again later.'
              };
            }

            return {
              success: false,
              message: errorMessage || 'Password change failed. Please try again.'
            };
          }

          if (error.code === 'ECONNABORTED' || error.request) {
            continue;
          }

          continue;
        }
      }

      return {
        success: false,
        message: 'Password change service is currently unavailable. Please contact support.'
      };
      
    } catch (error) {      
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      };
    }
  }

  async updateAvatar(imageFile) {
    try {
      console.log('Uploading avatar...');
      
      if (!imageFile || !(imageFile instanceof File)) {
        return {
          success: false,
          message: 'No image file selected'
        };
      }

      // Validate image file
      const validation = this.validateImageFile(imageFile);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }
      
      const formData = new FormData();
      formData.append('avatar', imageFile);

      const endpoints = [
        '/api/upload/avatar',
        '/api/user/upload-avatar', 
        '/api/auth/avatar'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          
          const response = await this.api.post(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
          });

          if (response.data.success) {
            console.log('Avatar uploaded successfully via:', endpoint);
            
            // Update user details in localStorage
            const currentUser = this.getCurrentUser();
            if (currentUser && response.data.avatarUrl) {
              currentUser.avatar = response.data.avatarUrl;
              localStorage.setItem('user', JSON.stringify(currentUser));
            }
            
            return {
              success: true,
              message: 'Profile picture updated successfully',
              data: response.data
            };
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} error:`, error.message);
          continue;
        }
      }

      return {
        success: false,
        message: 'Image upload is not supported yet. Profile will be updated without image.'
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while uploading the image'
      };
    }
  }

  async updateProfile(profileData) {
    try {
      console.log('Updating profile...');
      
      if (!profileData || Object.keys(profileData).length === 0) {
        return {
          success: false,
          message: 'No data to update'
        };
      }
      
      const endpoints = [
        { url: '/api/auth/update-profile', method: 'put' },
        { url: '/api/auth/profile', method: 'patch' },
        { url: '/api/user/profile', method: 'put' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint.url}`);
          
          const response = await this.api({
            method: endpoint.method,
            url: endpoint.url,
            data: profileData,
          });

          console.log('Profile updated successfully via:', endpoint.url);
          
          // Update user details in localStorage
          const currentUser = this.getCurrentUser();
          if (currentUser && response.data.user) {
            const updatedUser = { ...currentUser, ...response.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          
          return {
            success: true,
            message: 'Profile updated successfully',
            data: response.data
          };
        } catch (error) {
          console.log(`Endpoint ${endpoint.url} error:`, error.message);
          
          if (error.response?.status === 400) {
            return {
              success: false,
              message: error.response.data?.message || 'Invalid data provided'
            };
          }
          
          continue;
        }
      }

      return {
        success: false,
        message: 'Profile update service is currently unavailable. Please contact support.'
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred while updating profile'
      };
    }
  }

  async getUserProfile(userId) {
    try {
      if (!userId) {
        return {
          success: false,
          message: 'User ID is required'
        };
      }
      
      const response = await this.api.get(`/api/user/profile/${userId}`);

      return {
        success: true,
        data: response.data.user
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while loading profile'
      };
    }
  }

  // New functions for React

  // Image file validation
  validateImageFile(file) {
    if (!file) return { valid: false, message: 'No file selected' };
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        message: 'Please select a valid image file (JPEG, PNG, GIF)' 
      };
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        message: 'Image size should be less than 5MB' 
      };
    }
    
    return { valid: true };
  }

  // Create avatar preview
  createAvatarPreview(file) {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          url: e.target.result,
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Compress avatar image
  compressAvatar(file, maxSize = 150) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Create square image
        const size = Math.min(img.width, img.height);
        canvas.width = maxSize;
        canvas.height = maxSize;

        // Crop to square and resize
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);

        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Strong password validation
  validatePassword(password) {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    let strength = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 3) strength = 'medium';

    return {
      isValid: score >= 3,
      strength,
      score,
      requirements,
      message: this.getPasswordMessage(requirements, strength)
    };
  }

  getPasswordMessage(requirements, strength) {
    const missing = [];
    if (!requirements.minLength) missing.push('8 characters');
    if (!requirements.hasUpperCase) missing.push('uppercase letter');
    if (!requirements.hasLowerCase) missing.push('lowercase letter');
    if (!requirements.hasNumbers) missing.push('number');
    if (!requirements.hasSpecialChars) missing.push('special character');

    if (missing.length === 0) {
      return `Password strength: ${strength}`;
    }

    return `Password needs: ${missing.join(', ')}`;
  }

  // Cache for user profiles
  cacheUserProfile(userId, profileData) {
    try {
      const cacheKey = `userProfile_${userId}`;
      const cacheData = {
        data: profileData,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching user profile:', error);
    }
  }

  getCachedUserProfile(userId, maxAge = 10 * 60 * 1000) { // 10 minutes
    try {
      const cacheKey = `userProfile_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > maxAge;
        
        if (!isExpired) {
          return {
            success: true,
            data: cacheData.data,
            fromCache: true
          };
        }
      }
    } catch (error) {
      console.error('Error reading cached user profile:', error);
    }
    
    return {
      success: false,
      data: null,
      fromCache: false
    };
  }

  async getUserProfileWithCache(userId, useCache = true) {
    // Try to get from cache first
    if (useCache) {
      const cached = this.getCachedUserProfile(userId);
      if (cached.success) {
        console.log('Using cached user profile');
        return cached;
      }
    }

    // If no cache or expired, get from server
    const result = await this.getUserProfile(userId);
    
    // Save to cache if successful
    if (result.success) {
      this.cacheUserProfile(userId, result.data);
    }
    
    return result;
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear all user-related data
  clearUserData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear cached profiles
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('userProfile_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Subscribe to profile updates
  subscribeToProfileUpdates(userId, callback) {
    const interval = setInterval(async () => {
      const result = await this.getUserProfile(userId);
      if (result.success && callback) {
        callback(result.data);
      }
    }, 60000); // Update every minute

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

export const userService = new UserService();