export type Verdict = "LIKELY AUTHENTIC" | "UNCERTAIN" | "POTENTIALLY MANIPULATED" | "LIKELY AI-GENERATED";
export type EvidenceSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface Evidence {
  id: string;
  title: string;
  severity: EvidenceSeverity;
  description: string;
  category: "visual" | "metadata" | "context";
}

export interface SourceVerification {
  sourceUrl: string;
  publicationDate: string;
  matchingMedia: number;
  contextComparison: string;
  captionDifferences: string;
  timeline: Array<{ label: string; detail: string; date: string }>;
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  riskScore: number;
  aiProbability: number;
  manipulationProbability: number;
  confidence: "Low" | "Medium" | "High";
  evidence: Evidence[];
  explanation: string;
  sourceVerification: SourceVerification;
  createdAt: string;
  mediaName: string;
}

export interface MediaAnalysisProvider {
  analyzeImage(input: { file?: File; url?: string }): Promise<AnalysisResult>;
}