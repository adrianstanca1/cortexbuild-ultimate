
const assert = require('assert');
const { queryOllama, getEmbedding } = require('../lib/unified-ai-client');

async function runTests() {
    console.log('Running tests for unified-ai-client...');
    
    // Test 1: Embedding check
    const embedding = await getEmbedding('hello world');
    assert(Array.isArray(embedding), 'Embedding should return an array');
    console.log('✅ Embedding test passed');
    
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
