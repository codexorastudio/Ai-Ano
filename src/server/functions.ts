import { createServerFn } from '@tanstack/react-start';
import { analyzeMediaWithGemini } from './gemini';
import { saveAnalysisResult, getAnalysisResult, getAllResults } from './db';

// Server function to process uploaded media
export const analyzeMediaFn = createServerFn({ method: 'POST' })
  .validator((data: { base64Data: string; mimeType: string; fileName: string }) => data)
  .handler(async ({ data }) => {
    try {
      console.log(`Analyzing media: ${data.fileName} (${data.mimeType})`);
      const result = await analyzeMediaWithGemini(data.base64Data, data.mimeType, data.fileName);
      
      // Save it to our local DB
      await saveAnalysisResult(result);
      
      return { success: true, result };
    } catch (error: any) {
      console.error('Analysis error:', error);
      return { success: false, error: error.message };
    }
  });

// Server function to get a result by ID
export const getResultFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const result = await getAnalysisResult(data.id);
    if (!result) {
      throw new Error("Result not found");
    }
    return result;
  });

// Server function to get all results for the history page
export const getHistoryFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getAllResults();
  });
