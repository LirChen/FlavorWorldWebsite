import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js'; 
import Recipe from '../../src/models/Recipe.js';
import User from '../../src/models/User.js';

describe('Recipes API', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    });

    authToken = 'Bearer fake-token-for-testing';
  });

  describe('POST /api/recipes', () => {
    it('should create a new recipe successfully', async () => {
      const newRecipe = {
        title: 'Spaghetti Carbonara',
        description: 'Classic Italian pasta',
        ingredients: 'Pasta, eggs, bacon, cheese',
        instructions: 'Cook pasta, mix with eggs and bacon',
        category: 'Italian',
        meatType: 'Pork',
        prepTime: 30,
        servings: 4,
        userId: testUser._id.toString(),
        userName: testUser.fullName,
        mediaType: 'none'
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', authToken)
        .send(newRecipe)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Spaghetti Carbonara');
      expect(response.body.category).toBe('Italian');
      expect(response.body.userId).toBe(testUser._id.toString());

      const savedRecipe = await Recipe.findById(response.body._id);
      expect(savedRecipe).toBeTruthy();
      expect(savedRecipe.title).toBe('Spaghetti Carbonara');
    });

    it('should return 400 if title is missing', async () => {
      const invalidRecipe = {
        description: 'No title recipe',
        userId: testUser._id.toString()
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', authToken)
        .send(invalidRecipe)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('title');
    });

    it('should return 400 if userId is missing', async () => {
      const recipeWithoutUser = {
        title: 'Test Recipe',
        description: 'Test'
      };

      await request(app)
        .post('/api/recipes')
        .set('Authorization', authToken)
        .send(recipeWithoutUser)
        .expect(400);
    });

    it('should set default values for optional fields', async () => {
      const minimalRecipe = {
        title: 'Minimal Recipe',
        userId: testUser._id.toString(),
        userName: testUser.fullName
      };

      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', authToken)
        .send(minimalRecipe)
        .expect(201);

      expect(response.body.servings).toBe(1);
      expect(response.body.prepTime).toBe(0);
      expect(response.body.category).toBeDefined();
    });
  });

  describe('GET /api/recipes', () => {
    beforeEach(async () => {
      await Recipe.create([
        {
          title: 'Recipe 1',
          description: 'First recipe',
          userId: testUser._id,
          userName: testUser.fullName,
          category: 'Italian',
          meatType: 'Chicken'
        },
        {
          title: 'Recipe 2',
          description: 'Second recipe',
          userId: testUser._id,
          userName: testUser.fullName,
          category: 'Asian',
          meatType: 'Vegetarian'
        },
        {
          title: 'Recipe 3',
          description: 'Third recipe',
          userId: testUser._id,
          userName: testUser.fullName,
          category: 'Italian',
          meatType: 'Beef'
        }
      ]);
    });

    it('should return all recipes', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
    });

    it('should return recipes sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      const dates = response.body.map(r => new Date(r.createdAt));
      
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });
  });

  describe('GET /api/recipes/:id', () => {
    let testRecipe;

    beforeEach(async () => {
      testRecipe = await Recipe.create({
        title: 'Test Recipe',
        description: 'For testing',
        userId: testUser._id,
        userName: testUser.fullName,
        category: 'Italian'
      });
    });

    it('should return a recipe by ID', async () => {
      const response = await request(app)
        .get(`/api/recipes/${testRecipe._id}`)
        .expect(200);

      expect(response.body.title).toBe('Test Recipe');
      expect(response.body._id).toBe(testRecipe._id.toString());
    });

    it('should return 404 for non-existent recipe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .get(`/api/recipes/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app)
        .get('/api/recipes/invalid-id')
        .expect(400);
    });
  });

  describe('PUT /api/recipes/:id', () => {
    let testRecipe;

    beforeEach(async () => {
      testRecipe = await Recipe.create({
        title: 'Original Title',
        description: 'Original description',
        userId: testUser._id,
        userName: testUser.fullName,
        category: 'Italian',
        prepTime: 30
      });
    });

    it('should update a recipe successfully', async () => {
      const updates = {
        title: 'Updated Title',
        prepTime: 45
      };

      const response = await request(app)
        .put(`/api/recipes/${testRecipe._id}`)
        .set('Authorization', authToken)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.prepTime).toBe(45);
      expect(response.body.description).toBe('Original description'); // לא השתנה
    });

    it('should return 404 for non-existent recipe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .put(`/api/recipes/${fakeId}`)
        .set('Authorization', authToken)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    let testRecipe;

    beforeEach(async () => {
      testRecipe = await Recipe.create({
        title: 'Recipe to Delete',
        userId: testUser._id,
        userName: testUser.fullName
      });
    });

    it('should delete a recipe successfully', async () => {
      await request(app)
        .delete(`/api/recipes/${testRecipe._id}`)
        .set('Authorization', authToken)
        .expect(200);

      const deletedRecipe = await Recipe.findById(testRecipe._id);
      expect(deletedRecipe).toBeNull();
    });

    it('should return 404 when deleting non-existent recipe', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      await request(app)
        .delete(`/api/recipes/${fakeId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('POST /api/recipes/:id/like', () => {
    let testRecipe;

    beforeEach(async () => {
      testRecipe = await Recipe.create({
        title: 'Recipe to Like',
        userId: testUser._id,
        userName: testUser.fullName,
        likes: []
      });
    });

    it('should add a like to a recipe', async () => {
      const response = await request(app)
        .post(`/api/recipes/${testRecipe._id}/like`)
        .set('Authorization', authToken)
        .send({ userId: testUser._id.toString() })
        .expect(200);

      expect(response.body.likes).toHaveLength(1);
      expect(response.body.likes[0]).toBe(testUser._id.toString());
    });

    it('should not add duplicate like from same user', async () => {
      await request(app)
        .post(`/api/recipes/${testRecipe._id}/like`)
        .send({ userId: testUser._id.toString() })
        .expect(200);

      const response = await request(app)
        .post(`/api/recipes/${testRecipe._id}/like`)
        .send({ userId: testUser._id.toString() })
        .expect(400);

      expect(response.body.message).toContain('already liked');
    });
  });

  describe('DELETE /api/recipes/:id/like', () => {
    let testRecipe;

    beforeEach(async () => {
      testRecipe = await Recipe.create({
        title: 'Recipe with Like',
        userId: testUser._id,
        userName: testUser.fullName,
        likes: [testUser._id.toString()]
      });
    });

    it('should remove a like from a recipe', async () => {
      const response = await request(app)
        .delete(`/api/recipes/${testRecipe._id}/like`)
        .set('Authorization', authToken)
        .send({ userId: testUser._id.toString() })
        .expect(200);

      expect(response.body.likes).toHaveLength(0);
    });

    it('should return 400 when unliking non-liked recipe', async () => {
      const anotherUser = await User.create({
        fullName: 'Another User',
        email: 'another@example.com',
        password: 'Pass123!'
      });

      const response = await request(app)
        .delete(`/api/recipes/${testRecipe._id}/like`)
        .send({ userId: anotherUser._id.toString() })
        .expect(400);

      expect(response.body.message).toContain('not liked');
    });
  });
});