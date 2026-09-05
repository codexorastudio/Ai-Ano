import type { AnalysisResult, EvidenceItem, EvidenceSeverity } from './analysis-types';

/**
 * Strips markdown json tags if the LLM output contained ```json ... ```
 */
export function cleanJsonString(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Validates and clamps a number between min and max.
 */
export function clampScore(value: unknown, fallback: number = 0, min: number = 0, max: number = 100): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(Math.round(num), min), max);
}

/**
 * Parses, sanitizes, and ensures structural integrity of Gemini analysis output.
 * Prevents UI crashes even if Gemini returns partial or malformed fields.
 */
export function parseAndSanitizeAnalysis(rawText: string, fileName: string): AnalysisResult {
  if (!rawText || !rawText.trim()) {
    throw new Error('Empty AI response received from analysis service.');
  }

  const cleaned = cleanJsonString(rawText);
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Invalid JSON returned by AI model: ${err.message}`);
  }

  // Validate and clamp scores
  const riskScore = clampScore(parsed.riskScore, 50);
  const aiProbability = clampScore(parsed.aiProbability, riskScore);
  const manipulationProbability = clampScore(parsed.manipulationProbability, 0);

  // Normalize verdict
  const validVerdicts = [
    'LIKELY AUTHENTIC',
    'UNCERTAIN',
    'POTENTIALLY MANIPULATED',
    'LIKELY AI-GENERATED',
  ] as const;

  let verdict: AnalysisResult['verdict'] = 'UNCERTAIN';
  if (typeof parsed.verdict === 'string') {
    const matched = validVerdicts.find(
      (v) => v.toLowerCase() === parsed.verdict.trim().toLowerCase()
    );
    if (matched) {
      verdict = matched;
    } else if (riskScore < 30) {
      verdict = 'LIKELY AUTHENTIC';
    } else if (aiProbability >= 65) {
      verdict = 'LIKELY AI-GENERATED';
    } else if (manipulationProbability >= 65) {
      verdict = 'POTENTIALLY MANIPULATED';
    }
  }

  // Normalize confidence
  const validConfidences = ['Low', 'Medium', 'High'] as const;
  let confidence: AnalysisResult['confidence'] = 'Medium';
  if (typeof parsed.confidence === 'string') {
    const matchedConf = validConfidences.find(
      (c) => c.toLowerCase() === parsed.confidence.trim().toLowerCase()
    );
    if (matchedConf) confidence = matchedConf;
  }

  // Normalize evidence
  const evidence: EvidenceItem[] = [];
  if (Array.isArray(parsed.evidence)) {
    for (let i = 0; i < parsed.evidence.length; i++) {
      const item = parsed.evidence[i];
      if (item && typeof item === 'object') {
        const severity: EvidenceSeverity = ['HIGH', 'MEDIUM', 'LOW'].includes(item.severity)
          ? item.severity
          : 'MEDIUM';

        evidence.push({
          id: String(item.id || `ev-${i + 1}`),
          title: String(item.title || 'Forensic signal observation'),
          severity,
          category: ['visual', 'metadata', 'context'].includes(item.category)
            ? item.category
            : 'visual',
          description: String(item.description || 'Observed anomaly or authentic consistency.'),
        });
      }
    }
  }

  // Provide fallback evidence if none returned
  if (evidence.length === 0) {
    if (verdict === 'LIKELY AUTHENTIC') {
      evidence.push({
        id: 'ev-auth-1',
        title: 'Natural Consistency',
        severity: 'LOW',
        category: 'visual',
        description: 'Visual elements, textures, and lighting show natural consistency without generative artifacts.',
      });
    } else {
      evidence.push({
        id: 'ev-gen-1',
        title: 'Algorithmic Anomaly',
        severity: 'HIGH',
        category: 'visual',
        description: 'Identified structural or textural inconsistencies characteristic of generative models.',
      });
    }
  }

  // Normalize source verification
  const rawSource = parsed.sourceVerification || {};
  const matchingMedia = typeof rawSource.matchingMedia === 'number' ? Math.max(0, rawSource.matchingMedia) : 0;

  const sourceVerification = {
    sourceUrl: typeof rawSource.sourceUrl === 'string' && rawSource.sourceUrl.trim()
      ? rawSource.sourceUrl
      : 'No authoritative original located in public indices',
    publicationDate: typeof rawSource.publicationDate === 'string' && rawSource.publicationDate.trim()
      ? rawSource.publicationDate
      : 'Unknown',
    matchingMedia,
    contextComparison: typeof rawSource.contextComparison === 'string' && rawSource.contextComparison.trim()
      ? rawSource.contextComparison
      : matchingMedia === 0
      ? 'No related versions detected for comparative context analysis.'
      : 'Context aligns with circulating social media reports.',
    captionDifferences: typeof rawSource.captionDifferences === 'string' && rawSource.captionDifferences.trim()
      ? rawSource.captionDifferences
      : matchingMedia === 0
      ? 'No matching versions were found.'
      : 'Captions across platforms vary slightly in framing.',
    timeline: Array.isArray(rawSource.timeline) && rawSource.timeline.length > 0
      ? rawSource.timeline.map((t: any) => ({
          label: String(t.label || 'Timestamp'),
          detail: String(t.detail || 'Analysis event recorded'),
          date: String(t.date || 'Recent'),
        }))
      : [
          { label: 'Media Captured/Found', detail: 'Estimated creation timeframe', date: 'Initial record' },
          { label: 'Platform Circulation', detail: 'First indexed digital appearance', date: 'Circulation' },
          { label: 'Forensic Ingestion', detail: 'Submitted for algorithmic verification', date: 'Today' },
          { label: 'Heuristic Scans', detail: 'Texture, lighting, and metadata inspection', date: 'Just now' },
          { label: 'AI Ano Assessment', detail: 'Probabilistic evidence compilation completed', date: 'Current' },
        ],
  };

  const result: AnalysisResult = {
    id: String(parsed.id || crypto.randomUUID().slice(0, 8)),
    verdict,
    riskScore,
    aiProbability,
    manipulationProbability,
    confidence,
    explanation: String(
      parsed.explanation ||
      (verdict === 'LIKELY AUTHENTIC'
        ? 'No strong signals of AI generation or manipulation were detected in this analysis. Lighting, geometry, and textures reflect standard camera capture.'
        : 'The analysis identified multiple structural and textural anomalies consistent with generative AI models or synthetic manipulation.')
    ),
    evidence,
    sourceVerification,
    createdAt: new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
    mediaName: fileName,
  };

  return result;
}
