import { describe, it, expect, beforeEach } from 'vitest';
import { saveAnalysisResult, getAnalysisResult, getAllResults } from './db';
import type { AnalysisResult } from '../lib/analysis-types';

describe('Storage DB - Unit Tests', () => {
  const sampleResult: AnalysisResult = {
    id: 'test-db-1',
    verdict: 'LIKELY AUTHENTIC',
    riskScore: 15,
    aiProbability: 10,
    manipulationProbability: 5,
    confidence: 'High',
    explanation: 'Test explanation',
    evidence: [],
    sourceVerification: {
      sourceUrl: 'N/A',
      publicationDate: 'Today',
      matchingMedia: 0,
      contextComparison: 'None',
      captionDifferences: 'None',
      timeline: [],
    },
    createdAt: 'September 5, 2026',
    mediaName: 'test.jpg',
  };

  it('saves and retrieves an analysis result by ID', async () => {
    await saveAnalysisResult(sampleResult);
    const fetched = await getAnalysisResult('test-db-1');
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe('test-db-1');
    expect(fetched?.verdict).toBe('LIKELY AUTHENTIC');
  });

  it('returns undefined for a non-existent ID without throwing', async () => {
    const fetched = await getAnalysisResult('non-existent-id-999');
    expect(fetched).toBeUndefined();
  });

  it('retrieves all saved analysis results', async () => {
    const secondResult: AnalysisResult = {
      ...sampleResult,
      id: 'test-db-2',
      verdict: 'LIKELY AI-GENERATED',
    };
    await saveAnalysisResult(secondResult);

    const all = await getAllResults();
    expect(Array.isArray(all)).toBe(true);
    expect(all.some((r) => r.id === 'test-db-1')).toBe(true);
    expect(all.some((r) => r.id === 'test-db-2')).toBe(true);
  });
});
