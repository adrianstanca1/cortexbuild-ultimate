
const assert = require('assert');
const client = require('../lib/unified-ai-client');

async function runExpandedTests() {
    console.log('Running expanded integration tests...');
    
    // 1. Interface contract
    assert(typeof client.queryOllama === 'function', 'queryOllama missing');
    assert(typeof client.getEmbedding === 'function', 'getEmbedding missing');
    
    // 2. Mocking response structure test
    // Assuming the client will eventually wrap API responses in a standardized way
    // For now, testing the contract
    const embedding = await client.getEmbedding('test');
    assert(Array.isArray(embedding), 'Embedding contract failed');
    assert(embedding.length > 0, 'Embedding array empty');
    
    console.log('✅ Integration tests passed');
}

runExpandedTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
