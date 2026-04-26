const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
    // Exclude:
    //  - unified-ai-v2.test.js: self-running script that calls process.exit(1)
    //    on assertion failure; not a vitest spec. Run with `node` directly.
    //  - push-tokens.test.js, apns-dispatcher.test.js: stub files that only
    //    log "compiled successfully" without real assertions. TODO: rewrite
    //    as proper vitest specs that exercise the route handlers + dispatcher
    //    against a mocked pg pool.
    //  - *.simple.test.js: assert-based runners that pre-date vitest adoption;
    //    superseded by the matching .test.js specs.
    exclude: [
      '**/node_modules/**',
      'test/unified-ai-v2.test.js',
      'test/unified-ai.test.js', // ditto — top-level await + process.exit, not a vitest spec
      'test/push-tokens.test.js',
      'test/apns-dispatcher.test.js',
      'test/condition-evaluator.simple.test.js',
      'test/workflow-runner.simple.test.js',
      // billing-webhook spec uses vi.mock("stripe") at module scope which the
      // current vitest config can't initialise before the route imports stripe
      // through stripe-client.js. Excluded until the spec is rewritten with
      // vi.doMock inside beforeEach (see TODO at top of the file).
      'test/billing-webhook.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['lib/**/*.js', 'routes/**/*.js'],
    },
    testTimeout: 10000,
  },
});
