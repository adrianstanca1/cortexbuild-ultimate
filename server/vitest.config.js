const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['lib/**/*.js', 'routes/**/*.js'],
    },
    testTimeout: 10000,
  },
});
