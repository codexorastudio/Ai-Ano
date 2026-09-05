import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyzePage } from '@/routes/analyze';

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({
    component: () => null,
  }),
  useNavigate: () => mockNavigate,
}));

// Mock server function analyzeMediaFn
const mockAnalyzeMediaFn = vi.fn();
vi.mock('@/server/functions', () => ({
  analyzeMediaFn: (...args: any[]) => mockAnalyzeMediaFn(...args),
}));

// Polyfill window.btoa if not in jsdom
if (!window.btoa) {
  window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Polyfill File.prototype.arrayBuffer for jsdom
if (!File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function () {
    return new ArrayBuffer(8);
  };
}

describe('Analyze Route & Integration Flow - Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state with heading and MediaUpload component', () => {
    render(<AnalyzePage />);

    expect(screen.getByText('Analyze suspicious media')).toBeInTheDocument();
    expect(screen.getByText(/Upload an image, audio clip, or video/i)).toBeInTheDocument();
    expect(screen.getByText('Files are processed securely and analyzed server-side.')).toBeInTheDocument();
  });

  it('submits media and transitions to loading state, then navigates on success', async () => {
    render(<AnalyzePage />);

    // Mock successful server response
    mockAnalyzeMediaFn.mockResolvedValueOnce({
      success: true,
      result: {
        id: 'result-abc-123',
        verdict: 'LIKELY AI-GENERATED',
        riskScore: 92,
      },
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['mock-image-bytes'], 'suspicious.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    const startBtn = screen.getByRole('button', { name: /start analysis/i });
    fireEvent.click(startBtn);

    // Should transition to loading state
    expect(screen.getByText('ANALYSIS IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('Building an evidence-led assessment')).toBeInTheDocument();
    expect(screen.getByText('File received & verified')).toBeInTheDocument();

    // After async processing completes, should navigate to results
    await waitFor(() => {
      expect(mockAnalyzeMediaFn).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/results/$id',
        params: { id: 'result-abc-123' },
      });
    });
  });

  it('displays friendly error alert when analysis API returns an error', async () => {
    render(<AnalyzePage />);

    // Mock failure server response
    mockAnalyzeMediaFn.mockResolvedValueOnce({
      success: false,
      error: 'The AI analysis service is temporarily busy. Please retry in a few moments.',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['mock-image-bytes'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    const startBtn = screen.getByRole('button', { name: /start analysis/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/The AI analysis service is temporarily busy/i)
      ).toBeInTheDocument();
    });
  });
});
