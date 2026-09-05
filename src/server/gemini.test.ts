import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the @google/genai module
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      apiKey: string;
      models = {
        generateContent: mockGenerateContent,
      };
      constructor(opts: { apiKey: string }) {
        this.apiKey = opts.apiKey;
      }
    },
  };
});

describe('Gemini Analysis Integration - Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws an informative error if neither primary nor backup API key is set', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_BACKUP;

    // Dynamically re-import to test missing keys
    const { analyzeMediaWithGemini } = await import('./gemini');

    await expect(
      analyzeMediaWithGemini('base64bytes', 'image/jpeg', 'test.jpg')
    ).rejects.toThrow(/temporarily unavailable.*API key/i);
  });

  it('successfully generates analysis when primary key succeeds', async () => {
    process.env.GEMINI_API_KEY = 'test-primary-key';

    const mockResponseJson = JSON.stringify({
      verdict: 'LIKELY AI-GENERATED',
      riskScore: 85,
      aiProbability: 90,
      manipulationProbability: 10,
      confidence: 'High',
      explanation: 'Diffusion pattern detected in eye reflection.',
      evidence: [
        {
          id: '1',
          title: 'Pupil Geometry',
          severity: 'HIGH',
          category: 'visual',
          description: 'Non-circular iris with jagged boundaries.',
        },
      ],
      sourceVerification: {
        sourceUrl: 'None',
        publicationDate: 'Unknown',
        matchingMedia: 0,
        contextComparison: 'No matches',
        captionDifferences: 'No matching versions were found.',
        timeline: [],
      },
    });

    mockGenerateContent.mockResolvedValueOnce({
      text: mockResponseJson,
    });

    const { analyzeMediaWithGemini } = await import('./gemini');
    const result = await analyzeMediaWithGemini('fakebase64', 'image/png', 'suspicious_photo.png');

    expect(result).toBeDefined();
    expect(result.verdict).toBe('LIKELY AI-GENERATED');
    expect(result.riskScore).toBe(85);
    expect(result.mediaName).toBe('suspicious_photo.png');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('automatically falls back to BACKUP key when primary key hits a rate limit', async () => {
    process.env.GEMINI_API_KEY = 'rate-limited-primary';
    process.env.GEMINI_API_KEY_BACKUP = 'healthy-backup';

    // Primary fails with 429 / RESOURCE_EXHAUSTED
    mockGenerateContent.mockRejectedValueOnce(
      new Error('429 RESOURCE_EXHAUSTED: Quota exceeded')
    );

    // Backup succeeds
    const mockBackupResponse = JSON.stringify({
      verdict: 'LIKELY AUTHENTIC',
      riskScore: 15,
      aiProbability: 5,
      manipulationProbability: 5,
      confidence: 'High',
      explanation: 'Sensor grain and camera aperture traits verified.',
      evidence: [],
      sourceVerification: {
        sourceUrl: 'Original news photo',
        publicationDate: '2024',
        matchingMedia: 0,
        contextComparison: '',
        captionDifferences: '',
        timeline: [],
      },
    });

    mockGenerateContent.mockResolvedValueOnce({
      text: mockBackupResponse,
    });

    const { analyzeMediaWithGemini } = await import('./gemini');
    const result = await analyzeMediaWithGemini('fakebase64', 'image/jpeg', 'camera.jpg');

    expect(result.verdict).toBe('LIKELY AUTHENTIC');
    expect(result.riskScore).toBe(15);
    // Should have called generateContent twice (1 primary failure + 1 backup success)
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('handles 503 high demand by reporting temporary unavailability if no backup', async () => {
    process.env.GEMINI_API_KEY = 'busy-primary';
    delete process.env.GEMINI_API_KEY_BACKUP;

    mockGenerateContent.mockRejectedValueOnce(
      new Error('503 UNAVAILABLE: This model is currently experiencing high demand.')
    );

    const { analyzeMediaWithGemini } = await import('./gemini');

    await expect(
      analyzeMediaWithGemini('fakebase64', 'image/jpeg', 'test.jpg')
    ).rejects.toThrow(/experiencing high demand/i);
  });

  it('rejects with safe message when model returns invalid non-JSON output', async () => {
    process.env.GEMINI_API_KEY = 'valid-key';
    delete process.env.GEMINI_API_KEY_BACKUP;

    mockGenerateContent.mockResolvedValueOnce({
      text: 'I am an AI and I cannot output JSON right now.',
    });

    const { analyzeMediaWithGemini } = await import('./gemini');

    await expect(
      analyzeMediaWithGemini('fakebase64', 'image/jpeg', 'test.jpg')
    ).rejects.toThrow(/Invalid JSON/i);
  });
});
