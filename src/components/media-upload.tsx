import { Camera, FileImage, Film, Link2, Music2, UploadCloud, X } from "lucide-react";
import { useRef, useState, useEffect, type DragEvent, type KeyboardEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  type MediaMode,
  validateMediaFile,
  validateMediaUrl,
  ACCEPTED_EXTENSIONS,
} from "@/lib/media-validator";

export function MediaUpload({
  compact = false,
  onAnalyze,
}: {
  compact?: boolean;
  onAnalyze?: (payload: { file?: File; url?: string }) => void;
}) {
  const [mode, setMode] = useState<MediaMode>("image");
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setError("");
    } catch {
      setError("Could not access camera. Please allow camera permissions in your browser.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], "camera_capture.jpg", {
            type: "image/jpeg",
          });
          choose(capturedFile);
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }

  useEffect(() => {
    return () => {
      stopCamera();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function choose(next: File) {
    const validation = validateMediaFile(next, mode);
    if (!validation.valid) {
      setError(validation.error || "Invalid file.");
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setError("");
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const next = event.dataTransfer.files[0];
    if (next) choose(next);
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview(undefined);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleKeyDownDropzone(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  function handleStartAnalysis() {
    if (!file && !url.trim()) {
      setError("Please choose a media file or provide a URL.");
      return;
    }

    if (url.trim()) {
      const urlValidation = validateMediaUrl(url);
      if (!urlValidation.valid) {
        setError(urlValidation.error || "Invalid URL.");
        return;
      }
    }

    setError("");
    onAnalyze?.({ file, url: url.trim() || undefined });
  }

  const acceptString = ACCEPTED_EXTENSIONS[mode].join(",");

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-card",
        compact ? "p-5 sm:p-6" : "p-5 sm:p-8"
      )}
      role="region"
      aria-label="Media verification input"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Verify a piece of media</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a file, capture from camera, or paste a URL for forensic verification.
          </p>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">
          Private by design
        </span>
      </div>

      {/* Accessible Mode Tabs */}
      <div
        className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted p-1.5"
        role="tablist"
        aria-label="Media type selection"
      >
        {(
          [
            { id: "image", label: "Image", icon: FileImage },
            { id: "audio", label: "Audio", icon: Music2 },
            { id: "video", label: "Video", icon: Film },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            aria-controls={`${id}-upload-panel`}
            variant={mode === id ? "default" : "ghost"}
            className="relative h-10 gap-2 font-bold text-xs sm:text-sm"
            onClick={() => {
              setMode(id);
              setError("");
              stopCamera();
              clear();
            }}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      {isCameraActive ? (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full object-contain max-h-80"
            aria-label="Live webcam feed"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              onClick={capturePhoto}
              className="rounded-full shadow-lg h-12 px-6 gap-2"
              aria-label="Capture snapshot from live camera"
            >
              <Camera className="size-5" /> Capture Photo
            </Button>
            <Button
              variant="secondary"
              onClick={stopCamera}
              className="rounded-full shadow-lg h-12 px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : preview ? (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-muted">
          {mode === "image" && (
            <img
              src={preview}
              alt={`Selected ${file?.name || "upload"} preview`}
              className={cn("w-full object-contain bg-black/5", compact ? "max-h-52" : "max-h-80")}
            />
          )}
          {mode === "video" && (
            <video
              src={preview}
              controls
              aria-label="Selected video preview"
              className={cn("w-full object-contain bg-black/90", compact ? "max-h-52" : "max-h-80")}
            />
          )}
          {mode === "audio" && (
            <div className="p-6">
              <audio src={preview} controls className="w-full" aria-label="Selected audio preview" />
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={clear}
            className="absolute right-3 top-3 shadow"
            aria-label="Remove selected media"
          >
            <X className="size-4" />
          </Button>
          <div className="border-t border-border bg-card px-4 py-3 flex items-center justify-between">
            <p className="truncate text-sm font-semibold max-w-[70%]">{file?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div
          id={`${mode}-upload-panel`}
          role="tabpanel"
          className="mt-5 grid min-h-44 place-items-center rounded-xl border border-dashed border-primary/35 bg-sky-soft p-6 text-center transition-colors hover:border-primary hover:bg-accent"
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptString}
            className="hidden"
            aria-label={`Upload ${mode} file`}
            onChange={(e) => {
              const next = e.target.files?.[0];
              if (next) choose(next);
            }}
          />
          <div
            tabIndex={0}
            role="button"
            aria-label={`Drag and drop your ${mode} file here, or press Enter to browse`}
            onDrop={drop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            onKeyDown={handleKeyDownDropzone}
            className="cursor-pointer w-full h-full flex flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-2"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-button">
              <UploadCloud className="size-6" />
            </div>
            <p className="mt-3 font-bold text-sm sm:text-base">
              Drop your {mode} here or <span className="text-primary underline">browse</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "image" && "JPG, JPEG, PNG, WEBP"}
              {mode === "video" && "MP4, WEBM, MOV"}
              {mode === "audio" && "MP3, WAV, OGG, M4A"}
              {" · up to 10 MB"}
            </p>
          </div>
          {mode === "image" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                startCamera();
              }}
              aria-label="Open live camera capture"
            >
              <Camera className="size-4" /> Live Camera Capture
            </Button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" aria-live="polite" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="my-5 flex items-center gap-3 text-xs font-bold text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="relative">
        <Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          className="h-11 pl-10"
          placeholder={`Paste a direct ${mode} URL`}
          aria-label={`Direct ${mode} URL`}
        />
      </div>

      <Button
        size="lg"
        className="mt-5 w-full font-bold"
        disabled={!file && !url.trim()}
        onClick={handleStartAnalysis}
      >
        Start Analysis
      </Button>
    </div>
  );
}