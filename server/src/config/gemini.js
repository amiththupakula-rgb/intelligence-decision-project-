import { GoogleGenAI } from '@google/genai';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let geminiAi = null;

if (config.gemini.apiKey) {
  try {
    geminiAi = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
    });
    logger.info(`[Gemini] Initialized @google/genai client with model: ${config.gemini.model}`);
  } catch (err) {
    logger.error(`[Gemini] Failed to initialize Google Gen AI SDK: ${err.message}`);
  }
} else {
  logger.warn('[Gemini] GEMINI_API_KEY is not configured. AI operations will use deterministic baseline fallback.');
}

export { geminiAi };
