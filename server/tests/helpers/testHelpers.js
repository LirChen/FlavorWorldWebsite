// server/tests/helpers/testHelpers.js
import User from '../../models/User.js';
import PrivateChat from '../../models/PrivateChat.js';
import Message from '../../models/Message.js';
import Group from '../../models/Group.js';
import GroupPost from '../../models/GroupPost.js';
import mongoose from 'mongoose';

/**
 * Create a test user with default or custom values
 */
export const createTestUser = async (overrides = {}) => {
  const defaults = {
    fullName: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test1234!',
    bio: 'Test bio',
    avatar: null,
    followers: [],
    following: []
  };

  return await User.create({ ...defaults, ...overrides });
};

/**
 * Create multiple test users at once
 */
export const createTestUsers = async (count = 3) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      fullName: `Test User ${i + 1}`,
      email: `testuser${i + 1}-${Date.now()}@example.com`
    });
    users.push(user);
  }
  return users;
};

/**
 * Create a private chat between two users
 */
export const createPrivateChat = async (user1, user2, overrides = {}) => {
  const defaults = {
    participants: [
      {
        userId: user1._id.toString(),
        userName: user1.fullName,
        userAvatar: user1.avatar
      },
      {
        userId: user2._id.toString(),
        userName: user2.fullName,
        userAvatar: user2.avatar
      }
    ],
    unreadCount: new Map([
      [user1._id.toString(), 0],
      [user2._id.toString(), 0]
    ])
  };

  return await PrivateChat.create({ ...defaults, ...overrides });
};

/**
 * Create a message in a chat
 */
export const createMessage = async (chatId, sender, content, overrides = {}) => {
  const defaults = {
    chatId: chatId.toString(),
    senderId: sender._id.toString(),
    senderName: sender.fullName,
    content,
    messageType: 'text',
    readBy: [{ userId: sender._id.toString() }]
  };

  return await Message.create({ ...defaults, ...overrides });
};

/**
 * Create multiple messages for testing pagination
 */
export const createMessages = async (chatId, sender, count = 10) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    const message = await createMessage(
      chatId,
      sender,
      `Test message ${i + 1}`
    );
    messages.push(message);
  }
  return messages;
};

/**
 * Create a test group
 */
export const createTestGroup = async (creator, overrides = {}) => {
  const defaults = {
    name: `Test Group ${Date.now()}`,
    description: 'Test group description',
    creatorId: creator._id.toString(),
    isPrivate: false,
    category: 'General',
    members: [{
      userId: creator._id.toString(),
      role: 'admin',
      joinedAt: new Date()
    }],
    settings: {
      allowMemberPosts: true,
      requireApproval: false,
      allowInvites: true
    }
  };

  return await Group.create({ ...defaults, ...overrides });
};

/**
 * Create a group post
 */
export const createGroupPost = async (group, user, overrides = {}) => {
  const defaults = {
    title: `Test Post ${Date.now()}`,
    description: 'Test post description',
    ingredients: 'Test ingredients',
    instructions: 'Test instructions',
    category: 'General',
    meatType: 'Mixed',
    prepTime: 30,
    servings: 4,
    userId: user._id.toString(),
    groupId: group._id.toString(),
    isApproved: true,
    likes: [],
    comments: []
  };

  return await GroupPost.create({ ...defaults, ...overrides });
};

/**
 * Generate a valid MongoDB ObjectId
 */
export const generateObjectId = () => {
  return new mongoose.Types.ObjectId();
};

/**
 * Generate an invalid ObjectId string
 */
export const generateInvalidObjectId = () => {
  return 'invalid-object-id-123';
};

/**
 * Wait for a specified amount of time (for testing timing-dependent features)
 */
export const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Clean all test data from database
 */
export const cleanDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Create a mock request object for testing
 */
export const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  };
};

/**
 * Create a mock response object for testing
 */
export const createMockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    send: function(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

/**
 * Assert that a response has the expected status and structure
 */
export const assertSuccessResponse = (response, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
};

/**
 * Assert that a response is an error with expected message
 */
export const assertErrorResponse = (response, expectedStatus, expectedMessage) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');
  if (expectedMessage) {
    expect(response.body.message).toBe(expectedMessage);
  }
};

/**
 * Create test data for a complete chat scenario
 */
export const setupChatScenario = async () => {
  const [user1, user2, user3] = await createTestUsers(3);
  const chat = await createPrivateChat(user1, user2);
  const messages = await createMessages(chat._id, user1, 5);

  return { user1, user2, user3, chat, messages };
};

/**
 * Create test data for a group scenario
 */
export const setupGroupScenario = async () => {
  const [creator, member1, member2] = await createTestUsers(3);
  const group = await createTestGroup(creator);
  
  // Add members to group
  group.members.push(
    { userId: member1._id.toString(), role: 'member', joinedAt: new Date() },
    { userId: member2._id.toString(), role: 'member', joinedAt: new Date() }
  );
  await group.save();

  const post = await createGroupPost(group, creator);

  return { creator, member1, member2, group, post };
};

/**
 * Verify pagination response structure
 */
export const assertPaginationResponse = (response, expectedLength, maxLength) => {
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBe(expectedLength);
  expect(response.body.length).toBeLessThanOrEqual(maxLength);
};

/**
 * Create a base64 image string for testing
 */
export const createBase64Image = () => {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
};

export default {
  createTestUser,
  createTestUsers,
  createPrivateChat,
  createMessage,
  createMessages,
  createTestGroup,
  createGroupPost,
  generateObjectId,
  generateInvalidObjectId,
  wait,
  cleanDatabase,
  createMockRequest,
  createMockResponse,
  assertSuccessResponse,
  assertErrorResponse,
  setupChatScenario,
  setupGroupScenario,
  assertPaginationResponse,
  createBase64Image
};