import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test'
    },
    
    setupFiles: ['./server/tests/setup.js'],
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 60000,
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'server/tests/',
        'server/socket/',  
        '**/*.test.js',
        '**/*.spec.js',
        '**/vitest.config.js'
      ],
      reportsDirectory: './coverage',
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    globals: true,
    
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
    
    reporters: ['verbose'],
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  }
});