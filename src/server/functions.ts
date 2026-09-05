import { createServerFn } from '@tanstack/react-start';
import { analyzeMediaWithGemini } from './gemini';
import { saveAnalysisResult, getAnalysisResult, getAllResults } from './db';

const MAX_BASE64_LENGTH = 20 * 1024 * 1024; // ~15 MB raw file equivalent

// Server function to process uploaded media
export const analyzeMediaFn = createServerFn({ method: 'POST' })
  .validator((data: { base64Data: string; mimeType: string; fileName: string }) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request payload.');
    }
    if (!data.base64Data || typeof data.base64Data !== 'string') {
      throw new Error('Missing media data payload.');
    }
    if (data.base64Data.length > MAX_BASE64_LENGTH) {
      throw new Error('The media file exceeds the maximum allowed payload size.');
    }
    if (!data.mimeType || typeof data.mimeType !== 'string') {
      throw new Error('Missing media MIME type.');
    }
    const safeName = (data.fileName && typeof data.fileName === 'string')
      ? data.fileName.slice(0, 255)
      : 'media-file';

    return {
      base64Data: data.base64Data,
      mimeType: data.mimeType.toLowerCase(),
      fileName: safeName,
    };
  })
  .handler(async ({ data }) => {
    try {
      console.log(`Analyzing media: ${data.fileName} (${data.mimeType})`);
      const result = await analyzeMediaWithGemini(data.base64Data, data.mimeType, data.fileName);

      // Save to storage
      await saveAnalysisResult(result);

      return { success: true, result };
    } catch (error: any) {
      console.error('Analysis error:', error?.message || error);
      const safeMessage = error?.message || 'Unable to analyze this media right now. Please try again.';
      return { success: false, error: safeMessage };
    }
  });

// Server function to get a result by ID
export const getResultFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => {
    if (!data || !data.id || typeof data.id !== 'string') {
      throw new Error('Valid analysis ID is required.');
    }
    return { id: data.id.trim() };
  })
  .handler(async ({ data }) => {
    const result = await getAnalysisResult(data.id);
    if (!result) {
      throw new Error('Result not found');
    }
    return result;
  });

// Server function to get all results for the history page
export const getHistoryFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getAllResults();
  });
