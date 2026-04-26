const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    // Exclude:
    //  - unified-ai-v2.test.js: self-running script that calls process.exit(1)
    //    on assertion failure; not a vitest spec. Run with `node` directly.
    //  - *.simple.test.js: assert-based runners that pre-date vitest adoption;
    //    superseded by the matching .test.js specs.
    exclude: [
      '**/node_modules/**',
      'test/unified-ai-v2.test.js',
      'test/unified-ai.test.js', // ditto — top-level await + process.exit, not a vitest spec
      'test/condition-evaluator.simple.test.js',
      'test/workflow-runner.simple.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['lib/**/*.js', 'routes/**/*.js'],
    },
    testTimeout: 10000,
  },
});
