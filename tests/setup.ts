import '@testing-library/jest-dom/vitest';

// Polyfill for URL.createObjectURL and revokeObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:http://localhost/mock-blob-uuid';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}

// Polyfill matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Polyfill HTMLCanvasElement getContext
if (!HTMLCanvasElement.prototype.getContext) {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {},
  })) as any;
}

if (!HTMLCanvasElement.prototype.toBlob) {
  HTMLCanvasElement.prototype.toBlob = function (cb, type, quality) {
    const blob = new Blob(['mock-data'], { type: type || 'image/jpeg' });
    cb(blob);
  };
}
