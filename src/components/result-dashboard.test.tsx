import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultDashboard, ScoreRing } from './result-dashboard';
import type { AnalysisResult } from '@/lib/analysis-types';

describe('ResultDashboard Component - Tests', () => {
  const mockAuthenticResult: AnalysisResult = {
    id: 'auth123',
    verdict: 'LIKELY AUTHENTIC',
    riskScore: 12,
    aiProbability: 8,
    manipulationProbability: 5,
    confidence: 'High',
    explanation: 'Lighting and skin pore textures demonstrate genuine optical camera traits.',
    evidence: [
      {
        id: 'ev-1',
        title: 'Sensor Noise Consistency',
        severity: 'LOW',
        category: 'visual',
        description: 'Sensor noise distribution is uniform across all color channels.',
      },
    ],
    sourceVerification: {
      sourceUrl: 'https://news.example.com/original-article',
      publicationDate: 'March 14, 2024',
      matchingMedia: 0,
      contextComparison: 'No related versions detected',
      captionDifferences: 'No matching versions were found.',
      timeline: [
        { label: 'Ingested', detail: 'Uploaded to AI ANO', date: 'Today' },
      ],
    },
    createdAt: 'September 5, 2026',
    mediaName: 'press_conference.jpg',
  };

  const mockAiResult: AnalysisResult = {
    id: 'fake456',
    verdict: 'LIKELY AI-GENERATED',
    riskScore: 94,
    aiProbability: 97,
    manipulationProbability: 40,
    confidence: 'High',
    explanation: 'Severe diffusion artifacts detected around teeth and ear structures.',
    evidence: [
      {
        id: 'ev-1',
        title: 'Diffusion Texture Anomaly',
        severity: 'HIGH',
        category: 'visual',
        description: 'Unnatural smoothing on skin with irregular background geometry.',
      },
      {
        id: 'ev-2',
        title: 'Metadata Signature',
        severity: 'MEDIUM',
        category: 'metadata',
        description: 'Exif tags stripped, consistent with web-generated synthetic exports.',
      },
    ],
    sourceVerification: {
      sourceUrl: 'Circulating across Telegram & X',
      publicationDate: 'September 2026',
      matchingMedia: 4,
      contextComparison: 'Framing changed to alter narrative context.',
      captionDifferences: 'Captions differ significantly across social platforms.',
      timeline: [
        { label: 'Generation', detail: 'Synthetic output', date: 'Yesterday' },
      ],
    },
    createdAt: 'September 5, 2026',
    mediaName: 'politician_deepfake.png',
  };

  describe('ScoreRing', () => {
    it('renders risk score out of 100 with progressbar role', () => {
      render(<ScoreRing value={75} />);
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });
  });

  describe('Low-Risk Authentic Media (Requirement 5)', () => {
    it('displays authentic verdict and correct explanation', () => {
      render(<ResultDashboard result={mockAuthenticResult} />);
      expect(screen.getByText('LIKELY AUTHENTIC')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('displays "No strong signals of AI generation..." and NOT "Multiple signals warrant closer review"', () => {
      render(<ResultDashboard result={mockAuthenticResult} />);
      expect(
        screen.getByText('No strong signals of AI generation or manipulation were detected in this analysis.')
      ).toBeInTheDocument();
      expect(screen.queryByText(/Multiple signals warrant closer review/i)).not.toBeInTheDocument();
    });

    it('handles matching media = 0 by showing "No matching versions were found" and hiding media comparison', () => {
      render(<ResultDashboard result={mockAuthenticResult} />);
      // Should show no matching versions
      expect(screen.getByText('No matching versions were found.')).toBeInTheDocument();
      // Should NOT show "Matching versions use different crops and captions"
      expect(screen.queryByText(/Matching versions use different crops and captions/i)).not.toBeInTheDocument();
      // Media comparison section should indicate no matches
      expect(screen.getByText(/No matching external versions were found/i)).toBeInTheDocument();
    });
  });

  describe('High-Risk Manipulated / AI Media (Requirement 5)', () => {
    it('displays elevated risk review prompt for high-risk media', () => {
      render(<ResultDashboard result={mockAiResult} />);
      expect(screen.getByText('LIKELY AI-GENERATED')).toBeInTheDocument();
      expect(screen.getByText(/Multiple signals warrant closer review/i)).toBeInTheDocument();
    });

    it('renders media comparison section when matching media > 0', () => {
      render(<ResultDashboard result={mockAiResult} />);
      expect(screen.getByText('Versions differ in framing and context')).toBeInTheDocument();
      expect(screen.getByText(/4 matching external version\(s\) detected/i)).toBeInTheDocument();
      expect(screen.getByText('Submitted media')).toBeInTheDocument();
      expect(screen.getByText('Earliest match')).toBeInTheDocument();
    });

    it('renders evidence cards with correct severity badges', () => {
      render(<ResultDashboard result={mockAiResult} />);
      expect(screen.getByText('Diffusion Texture Anomaly')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('Metadata Signature')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });
  });

  describe('Report Generation', () => {
    it('triggers report generation when "Generate Report" is clicked', () => {
      render(<ResultDashboard result={mockAiResult} />);
      const generateBtn = screen.getByRole('button', { name: /generate report/i });
      expect(generateBtn).toBeInTheDocument();

      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
      fireEvent.click(generateBtn);
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
