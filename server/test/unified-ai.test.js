
const assert = require('assert');
const client = require('../lib/unified-ai-client');

async function testInterface() {
    console.log('Testing unified-ai-client interface...');
    
    // Check exports
    assert(typeof client.queryOllama === 'function', 'queryOllama should be a function');
    assert(typeof client.queryGemini === 'function', 'queryGemini should be a function');
    assert(typeof client.getEmbedding === 'function', 'getEmbedding should be a function');
    
    console.log('✅ Interface check passed');
    
    // Test getEmbedding (stubbed)
    const embedding = await client.getEmbedding('hello');
    assert(Array.isArray(embedding), 'Embedding should return an array');
    console.log('✅ Embedding stub test passed');
}

testInterface().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
