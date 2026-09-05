import { demoAnalysis } from "./demo-analysis";
import type { MediaAnalysisProvider } from "./analysis-types";

export const demoMediaAnalysisProvider: MediaAnalysisProvider = {
  async analyzeImage() {
    await new Promise((resolve) => setTimeout(resolve, 4200));
    return demoAnalysis;
  },
};