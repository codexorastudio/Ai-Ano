export type MediaMode = 'image' | 'audio' | 'video';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_MIME_TYPES: Record<MediaMode, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
} as const;

export const ACCEPTED_EXTENSIONS: Record<MediaMode, readonly string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.webp'],
  video: ['.mp4', '.webm', '.mov'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an uploaded media file against mode, MIME type, and size limits.
 */
export function validateMediaFile(file: File | undefined | null, mode: MediaMode): ValidationResult {
  if (!file) {
    return { valid: false, error: 'Please select a file to analyze.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `The media file is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
    };
  }

  const allowedMimes = ACCEPTED_MIME_TYPES[mode];
  // Some browsers might not set file.type for certain extensions, so check extension as fallback
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ACCEPTED_EXTENSIONS[mode];

  const mimeMatches = file.type ? allowedMimes.includes(file.type) : false;
  const extMatches = allowedExtensions.includes(fileExtension);

  if (!mimeMatches && !extMatches) {
    const formatLabels: Record<MediaMode, string> = {
      image: 'JPG, JPEG, PNG, or WEBP image',
      video: 'MP4, WEBM, or MOV video',
      audio: 'MP3, WAV, OGG, or M4A audio file',
    };
    return {
      valid: false,
      error: `The selected file type is not supported. Please choose a ${formatLabels[mode]}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a direct media URL.
 */
export function validateMediaUrl(url: string | undefined | null): ValidationResult {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Please provide a valid media URL.' };
  }

  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid, well-formed URL.' };
  }
}
