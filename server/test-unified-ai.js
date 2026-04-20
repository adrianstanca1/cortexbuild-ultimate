
const { queryOllama, getEmbedding } = require('./lib/unified-ai-client');

async function test() {
    try {
        console.log('Testing embedding...');
        const emb = await getEmbedding('test text');
        console.log('Embedding successful');
        process.exit(0);
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}
test();
