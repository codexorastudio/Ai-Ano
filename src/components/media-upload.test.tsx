import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaUpload } from './media-upload';

describe('MediaUpload Component - UI & Interaction Tests', () => {
  it('renders title and media mode selection tabs', () => {
    render(<MediaUpload />);
    expect(screen.getByText('Verify a piece of media')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /image/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /audio/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /video/i })).toBeInTheDocument();
  });

  it('switches media mode when tabs are clicked', async () => {
    render(<MediaUpload />);
    const audioTab = screen.getByRole('tab', { name: /audio/i });
    fireEvent.click(audioTab);

    expect(screen.getByText(/Drop your audio here/i)).toBeInTheDocument();
    expect(screen.getByText(/MP3, WAV, OGG, M4A/i)).toBeInTheDocument();

    const videoTab = screen.getByRole('tab', { name: /video/i });
    fireEvent.click(videoTab);

    expect(screen.getByText(/Drop your video here/i)).toBeInTheDocument();
    expect(screen.getByText(/MP4, WEBM, MOV/i)).toBeInTheDocument();
  });

  it('disables "Start Analysis" button when no file or URL is provided', () => {
    render(<MediaUpload />);
    const submitBtn = screen.getByRole('button', { name: /start analysis/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables "Start Analysis" button when a URL is entered', async () => {
    render(<MediaUpload />);
    const input = screen.getByLabelText(/direct image url/i);
    fireEvent.change(input, { target: { value: 'https://example.com/test.jpg' } });

    const submitBtn = screen.getByRole('button', { name: /start analysis/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('displays error message when an unsupported file type is selected', async () => {
    render(<MediaUpload />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const invalidFile = new File(['text'], 'malicious.exe', { type: 'application/x-msdownload' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/selected file type is not supported/i)).toBeInTheDocument();
  });

  it('displays error message when an oversized file is selected (>10MB)', async () => {
    render(<MediaUpload />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeBuffer = new Uint8Array(11 * 1024 * 1024);
    const oversizedFile = new File([largeBuffer], 'huge.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/media file is too large/i)).toBeInTheDocument();
  });

  it('displays preview and allows file removal when valid image is uploaded', async () => {
    render(<MediaUpload />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const validImage = new File(['fake-png-content'], 'sample.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [validImage] } });

    // Preview should appear
    expect(screen.getByAltText(/sample\.png preview/i)).toBeInTheDocument();
    expect(screen.getByText('sample.png')).toBeInTheDocument();

    // Remove file button
    const removeBtn = screen.getByRole('button', { name: /remove selected media/i });
    fireEvent.click(removeBtn);

    // Dropzone should reappear
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument();
  });

  it('calls onAnalyze with the selected file when Start Analysis is clicked', async () => {
    const handleAnalyze = vi.fn();
    render(<MediaUpload onAnalyze={handleAnalyze} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const validImage = new File(['fake-jpg-content'], 'real.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [validImage] } });

    const submitBtn = screen.getByRole('button', { name: /start analysis/i });
    fireEvent.click(submitBtn);

    expect(handleAnalyze).toHaveBeenCalledTimes(1);
    expect(handleAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({
        file: validImage,
      })
    );
  });
});
