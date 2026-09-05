import { GoogleGenAI } from '@google/genai';
import type { AnalysisResult } from '../lib/analysis-types';
import { parseAndSanitizeAnalysis } from '../lib/result-parser';

let primaryClient: GoogleGenAI | null = null;
let backupClient: GoogleGenAI | null = null;

function getClient(keyName: 'primary' | 'backup'): GoogleGenAI | null {
  if (keyName === 'primary') {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    if (!primaryClient) primaryClient = new GoogleGenAI({ apiKey: key });
    return primaryClient;
  } else {
    const key = process.env.GEMINI_API_KEY_BACKUP;
    if (!key) return null;
    if (!backupClient) backupClient = new GoogleGenAI({ apiKey: key });
    return backupClient;
  }
}

export async function analyzeMediaWithGemini(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<AnalysisResult> {
  const primary = getClient('primary');
  const backup = getClient('backup');

  if (!primary && !backup) {
    throw new Error('The AI analysis service is temporarily unavailable. Please verify API key configuration.');
  }

  const prompt = `
You are a highly advanced forensic media analyst AI named AI Ano. 
Your job is to inspect the provided media (image, audio, or video) and determine if it is authentic, potentially manipulated, or likely AI-generated.

File Name: "${fileName}"
(Analyze the file name for clues! Names containing 'midjourney', 'dall-e', 'stable-diffusion', 'whatsapp', 'wa', etc. can be strong metadata evidence of AI generation or social media compression).

Analyze lighting, textures, background artifacts, metadata traces (if visual), anatomical consistency (e.g., hands, eyes), audio glitches, and consistency.

You MUST respond with a valid JSON object matching this exact TypeScript structure:
{
  "verdict": "LIKELY AUTHENTIC" | "UNCERTAIN" | "POTENTIALLY MANIPULATED" | "LIKELY AI-GENERATED",
  "riskScore": number (0 to 100, where 100 is definitely fake),
  "aiProbability": number (0 to 100),
  "manipulationProbability": number (0 to 100),
  "confidence": "Low" | "Medium" | "High",
  "explanation": "A clear, human-readable paragraph explaining WHY you reached this verdict based on visual/audio evidence.",
  "evidence": [
    {
      "id": "unique-id",
      "title": "Short title of the evidence",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "category": "visual" | "metadata" | "context",
      "description": "Detailed description of the anomaly or authentic signal found"
    }
  ],
  "sourceVerification": {
    "sourceUrl": "String (e.g., 'No authoritative original located' or 'Search needed')",
    "publicationDate": "String (e.g., 'Unknown' or date)",
    "matchingMedia": number (e.g., 0),
    "contextComparison": "String",
    "captionDifferences": "String",
    "timeline": [
      { "label": "String", "detail": "String", "date": "String" }
    ]
  }
}

Important rules:
1. ONLY return JSON. Do not include markdown \`\`\`json wrappers.
2. Ensure it strictly matches the schema.
3. Be brutally honest. If you see AI artifacts (weird fingers, illogical lighting, background blurring), flag them as HIGH severity evidence.
`;

  const requestPayload = {
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  let responseText: string | undefined;

  // Try primary client first if available
  if (primary) {
    try {
      const resp = await primary.models.generateContent(requestPayload);
      responseText = resp.text;
    } catch (primaryErr: any) {
      console.warn('Primary Gemini client error:', primaryErr?.message || primaryErr);
      if (backup) {
        console.info('Switching to BACKUP Gemini client...');
        try {
          const resp = await backup.models.generateContent(requestPayload);
          responseText = resp.text;
        } catch (backupErr: any) {
          console.error('Backup Gemini client also failed:', backupErr?.message || backupErr);
          throw new Error('The AI analysis service is temporarily busy. Please retry in a few moments.');
        }
      } else {
        const msg = String(primaryErr?.message || '');
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('Analysis request limit reached. Please try again shortly.');
        } else if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
          throw new Error('The AI model is experiencing high demand. Please retry in a few seconds.');
        }
        throw new Error('Unable to analyze this media right now. Please try again.');
      }
    }
  } else if (backup) {
    // Only backup available
    try {
      const resp = await backup.models.generateContent(requestPayload);
      responseText = resp.text;
    } catch (backupErr: any) {
      console.error('Backup Gemini client error:', backupErr?.message || backupErr);
      throw new Error('Unable to analyze this media right now. Please try again.');
    }
  }

  if (!responseText) {
    throw new Error('Empty AI response received from media analysis service.');
  }

  // Parse and sanitize the response into a guaranteed valid AnalysisResult
  return parseAndSanitizeAnalysis(responseText, fileName);
}
