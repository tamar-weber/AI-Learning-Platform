// OpenAI client + embedding generation. Extracted from ragService.js.
const OpenAI = require('openai');
const AppError = require('../../utils/appError');

let openaiClient = null;

const DEFAULT_MODEL = process.env.OPENAI_RAG_MODEL || 'gpt-4o-mini';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

function getOpenAIClient() {
    if (!openaiClient && typeof process.env.OPENAI_API_KEY === 'string' && process.env.OPENAI_API_KEY.trim().startsWith('sk-')) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    return openaiClient;
}
async function getEmbedding(text) {
    const client = getOpenAIClient();

    if (!client) {
        throw new AppError('OpenAI API key is missing for embeddings', 503);
    }

    const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text
    });

    const embedding = response?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new AppError('לא התקבל embedding תקין', 502);
    }

    return embedding;
}

module.exports = {
    getOpenAIClient,
    getEmbedding,
    DEFAULT_MODEL,
    EMBEDDING_MODEL
};
