import { describe, it, expect } from 'vitest';
import {
  parseAndSanitizeAnalysis,
  clampScore,
  cleanJsonString,
} from './result-parser';

describe('Result Parser & Sanitizer - Unit Tests', () => {
  describe('cleanJsonString', () => {
    it('removes markdown ```json fences', () => {
      const wrapped = '```json\n{"verdict": "LIKELY AUTHENTIC"}\n```';
      expect(cleanJsonString(wrapped)).toBe('{"verdict": "LIKELY AUTHENTIC"}');
    });

    it('removes plain ``` fences', () => {
      const wrapped = '```\n{"riskScore": 25}\n```';
      expect(cleanJsonString(wrapped)).toBe('{"riskScore": 25}');
    });

    it('leaves raw JSON strings untouched', () => {
      const raw = '{"verdict": "UNCERTAIN"}';
      expect(cleanJsonString(raw)).toBe(raw);
    });
  });

  describe('clampScore', () => {
    it('clamps numbers to the 0-100 range', () => {
      expect(clampScore(120)).toBe(100);
      expect(clampScore(-15)).toBe(0);
      expect(clampScore(42)).toBe(42);
    });

    it('handles non-numeric and NaN values with fallback', () => {
      expect(clampScore('invalid', 50)).toBe(50);
      expect(clampScore(null, 30)).toBe(0);
      expect(clampScore(undefined, 70)).toBe(70);
    });
  });

  describe('parseAndSanitizeAnalysis', () => {
    const validRawJson = JSON.stringify({
      verdict: 'LIKELY AI-GENERATED',
      riskScore: 88,
      aiProbability: 92,
      manipulationProbability: 15,
      confidence: 'High',
      explanation: 'Detected diffusion anomalies in hand anatomy and asymmetrical pupil reflections.',
      evidence: [
        {
          id: 'ev-1',
          title: 'Anatomical Inconsistency',
          severity: 'HIGH',
          category: 'visual',
          description: 'Malformed digits on the left hand.',
        },
      ],
      sourceVerification: {
        sourceUrl: 'No authoritative source found',
        publicationDate: 'Recent',
        matchingMedia: 0,
        contextComparison: 'No related versions detected',
        captionDifferences: 'No matching versions were found.',
        timeline: [],
      },
    });

    it('successfully parses and normalizes a valid Gemini response', () => {
      const result = parseAndSanitizeAnalysis(validRawJson, 'sample_image.png');
      expect(result.verdict).toBe('LIKELY AI-GENERATED');
      expect(result.riskScore).toBe(88);
      expect(result.aiProbability).toBe(92);
      expect(result.manipulationProbability).toBe(15);
      expect(result.confidence).toBe('High');
      expect(result.mediaName).toBe('sample_image.png');
      expect(result.id).toBeDefined();
      expect(result.evidence).toHaveLength(1);
    });

    it('gracefully handles missing evidence array with contextual defaults', () => {
      const missingEvidenceJson = JSON.stringify({
        verdict: 'LIKELY AUTHENTIC',
        riskScore: 12,
        aiProbability: 8,
        manipulationProbability: 5,
        confidence: 'High',
        explanation: 'Natural textures and camera sensor noise detected.',
      });

      const result = parseAndSanitizeAnalysis(missingEvidenceJson, 'authentic.jpg');
      expect(result.verdict).toBe('LIKELY AUTHENTIC');
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence[0].severity).toBe('LOW');
    });

    it('correctly sets source verification defaults when matching media is 0', () => {
      const zeroMatchesJson = JSON.stringify({
        verdict: 'LIKELY AUTHENTIC',
        riskScore: 10,
        sourceVerification: {
          matchingMedia: 0,
        },
      });

      const result = parseAndSanitizeAnalysis(zeroMatchesJson, 'camera_capture.jpg');
      expect(result.sourceVerification.matchingMedia).toBe(0);
      expect(result.sourceVerification.captionDifferences).toBe('No matching versions were found.');
    });

    it('throws descriptive error on empty response string', () => {
      expect(() => parseAndSanitizeAnalysis('', 'test.png')).toThrow(
        'Empty AI response received'
      );
      expect(() => parseAndSanitizeAnalysis('   ', 'test.png')).toThrow(
        'Empty AI response received'
      );
    });

    it('throws descriptive error on corrupted non-JSON response', () => {
      expect(() => parseAndSanitizeAnalysis('Server Error 500 Internal Error', 'test.png')).toThrow(
        'Invalid JSON returned by AI model'
      );
    });

    it('clamps scores that exceed 100 or drop below 0 from hallucinating models', () => {
      const outOfBoundsJson = JSON.stringify({
        verdict: 'LIKELY AI-GENERATED',
        riskScore: 150,
        aiProbability: 250,
        manipulationProbability: -20,
      });

      const result = parseAndSanitizeAnalysis(outOfBoundsJson, 'hallucinated.jpg');
      expect(result.riskScore).toBe(100);
      expect(result.aiProbability).toBe(100);
      expect(result.manipulationProbability).toBe(0);
    });
  });
});
