import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult } from "../lib/analysis-types";

// We'll initialize it lazily so the app doesn't crash on startup if the key is missing
let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function analyzeMediaWithGemini(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<AnalysisResult> {
  const aiClient = getAI();

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

  let response;
  try {
    response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
  } catch (error: any) {
    console.warn("Primary API key failed or rate limited:", error?.message);
    const backupKey = process.env.GEMINI_API_KEY_BACKUP;
    if (backupKey) {
      console.log("Switching to BACKUP API KEY...");
      const backupAi = new GoogleGenAI({ apiKey: backupKey });
      response = await backupAi.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType } },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });
    } else {
      throw error;
    }
  }

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini API");
  }

  try {
    const json = JSON.parse(text);
    
    // Add required fields that we generate on the server
    const result: AnalysisResult = {
      ...json,
      id: crypto.randomUUID().slice(0, 8),
      createdAt: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
      mediaName: fileName,
    };
    
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("The AI returned invalid JSON. Please try again.");
  }
}
