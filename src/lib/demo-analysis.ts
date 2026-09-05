import type { AnalysisResult } from "./analysis-types";

export const demoAnalysis: AnalysisResult = {
  id: "demo-7f31",
  verdict: "POTENTIALLY MANIPULATED",
  riskScore: 86,
  aiProbability: 87,
  manipulationProbability: 71,
  confidence: "High",
  createdAt: "September 5, 2026 · 04:08 UTC",
  mediaName: "uploaded-image.jpg",
  explanation: "The analysis detected several visual inconsistencies around facial texture, lighting, and background details. These signals can be associated with synthetic or manipulated media. However, they do not independently prove that the content is fake.",
  evidence: [
    { id: "texture", title: "Facial texture anomaly", severity: "HIGH", category: "visual", description: "Texture transitions around facial features appear less consistent than nearby image regions." },
    { id: "lighting", title: "Lighting inconsistency", severity: "MEDIUM", category: "visual", description: "Light direction and highlight intensity vary across adjacent surfaces." },
    { id: "artifacts", title: "Background artifacts", severity: "HIGH", category: "visual", description: "Repeated edge patterns and local distortions were detected in the background." },
    { id: "metadata", title: "Metadata anomaly", severity: "LOW", category: "metadata", description: "Some expected provenance fields are absent; this can also happen after ordinary editing." },
  ],
  sourceVerification: {
    sourceUrl: "No authoritative original located",
    publicationDate: "First indexed 28 Aug 2026",
    matchingMedia: 4,
    contextComparison: "Two matching versions contain different crops.",
    captionDifferences: "Captions make conflicting claims about location.",
    timeline: [
      { label: "Original source", detail: "Not yet confirmed", date: "Unknown" },
      { label: "First available publication", detail: "Earliest indexed version", date: "28 Aug" },
      { label: "Reposted", detail: "Cropped copy discovered", date: "30 Aug" },
      { label: "Context changed", detail: "Location claim added", date: "2 Sep" },
      { label: "Current version", detail: "Submitted for review", date: "5 Sep" },
    ],
  },
};