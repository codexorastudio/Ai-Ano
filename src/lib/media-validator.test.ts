import { describe, it, expect } from 'vitest';
import {
  validateMediaFile,
  validateMediaUrl,
  MAX_FILE_SIZE_BYTES,
} from './media-validator';

describe('Media Validator - Unit Tests', () => {
  describe('validateMediaFile', () => {
    it('accepts supported image formats (JPEG, PNG, WEBP)', () => {
      const jpg = new File(['fake-data'], 'photo.jpg', { type: 'image/jpeg' });
      const png = new File(['fake-data'], 'photo.png', { type: 'image/png' });
      const webp = new File(['fake-data'], 'photo.webp', { type: 'image/webp' });

      expect(validateMediaFile(jpg, 'image').valid).toBe(true);
      expect(validateMediaFile(png, 'image').valid).toBe(true);
      expect(validateMediaFile(webp, 'image').valid).toBe(true);
    });

    it('accepts supported video formats (MP4, WEBM, MOV)', () => {
      const mp4 = new File(['fake-video-bytes'], 'clip.mp4', { type: 'video/mp4' });
      const webm = new File(['fake-video-bytes'], 'clip.webm', { type: 'video/webm' });
      const mov = new File(['fake-video-bytes'], 'clip.mov', { type: 'video/quicktime' });

      expect(validateMediaFile(mp4, 'video').valid).toBe(true);
      expect(validateMediaFile(webm, 'video').valid).toBe(true);
      expect(validateMediaFile(mov, 'video').valid).toBe(true);
    });

    it('accepts supported audio formats (MP3, WAV, OGG, M4A)', () => {
      const mp3 = new File(['fake-audio-bytes'], 'audio.mp3', { type: 'audio/mpeg' });
      const wav = new File(['fake-audio-bytes'], 'audio.wav', { type: 'audio/wav' });
      const ogg = new File(['fake-audio-bytes'], 'audio.ogg', { type: 'audio/ogg' });

      expect(validateMediaFile(mp3, 'audio').valid).toBe(true);
      expect(validateMediaFile(wav, 'audio').valid).toBe(true);
      expect(validateMediaFile(ogg, 'audio').valid).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const pdf = new File(['pdf-data'], 'doc.pdf', { type: 'application/pdf' });
      const exe = new File(['exe-data'], 'malware.exe', { type: 'application/x-msdownload' });
      const txt = new File(['text'], 'notes.txt', { type: 'text/plain' });

      expect(validateMediaFile(pdf, 'image').valid).toBe(false);
      expect(validateMediaFile(pdf, 'image').error).toContain('not supported');

      expect(validateMediaFile(exe, 'video').valid).toBe(false);
      expect(validateMediaFile(txt, 'audio').valid).toBe(false);
    });

    it('rejects cross-type mismatches (e.g. video uploaded under image mode)', () => {
      const videoInImageMode = new File(['video-data'], 'video.mp4', { type: 'video/mp4' });
      const result = validateMediaFile(videoInImageMode, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPG, JPEG, PNG, or WEBP');
    });

    it('rejects files larger than 10MB', () => {
      const hugeBuffer = new Uint8Array(MAX_FILE_SIZE_BYTES + 1024);
      const hugeFile = new File([hugeBuffer], 'large-photo.jpg', { type: 'image/jpeg' });

      const result = validateMediaFile(hugeFile, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('10 MB');
    });

    it('rejects empty (0 byte) files', () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const result = validateMediaFile(emptyFile, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('handles null or undefined file gracefully', () => {
      expect(validateMediaFile(null, 'image').valid).toBe(false);
      expect(validateMediaFile(undefined, 'image').valid).toBe(false);
    });
  });

  describe('validateMediaUrl', () => {
    it('accepts valid https and http URLs', () => {
      expect(validateMediaUrl('https://example.com/image.jpg').valid).toBe(true);
      expect(validateMediaUrl('http://cdn.news.org/media/deepfake.mp4').valid).toBe(true);
    });

    it('rejects empty or whitespace strings', () => {
      expect(validateMediaUrl('').valid).toBe(false);
      expect(validateMediaUrl('   ').valid).toBe(false);
      expect(validateMediaUrl(null).valid).toBe(false);
      expect(validateMediaUrl(undefined).valid).toBe(false);
    });

    it('rejects malformed or non-http protocols (e.g. ftp, javascript, file)', () => {
      expect(validateMediaUrl('not-a-url').valid).toBe(false);
      expect(validateMediaUrl('ftp://example.com/img.jpg').valid).toBe(false);
      expect(validateMediaUrl('javascript:alert(1)').valid).toBe(false);
    });
  });
});
