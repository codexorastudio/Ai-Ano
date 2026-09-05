import { Camera, FileImage, Film, Link2, Music2, UploadCloud, X } from "lucide-react";
import { useRef, useState, useEffect, type DragEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

type MediaMode = "image" | "audio" | "video";
const maxBytes = 10 * 1024 * 1024;

export function MediaUpload({ compact = false, onAnalyze }: { compact?: boolean; onAnalyze?: (payload: { file?: File; url?: string }) => void }) {
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
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setError("");
    } catch (err) {
      setError("Could not access camera. Please allow permissions.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const next = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
        choose(next);
        stopCamera();
      }
    }, "image/jpeg", 0.9);
  }

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  function choose(next: File) {
    const acceptedImages = ["image/jpeg", "image/png", "image/webp"];
    const acceptedVideos = ["video/mp4", "video/webm", "video/quicktime"];
    const acceptedAudio = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"];
    
    if (mode === "image" && !acceptedImages.includes(next.type)) return setError("Choose a JPG, JPEG, PNG, or WEBP image.");
    if (mode === "video" && !acceptedVideos.includes(next.type)) return setError("Choose an MP4, WEBM, or MOV video.");
    if (mode === "audio" && !acceptedAudio.includes(next.type)) return setError("Choose an MP3, WAV, OGG, or M4A audio file.");
    
    if (next.size > maxBytes) return setError(`The file must be smaller than ${maxBytes / 1024 / 1024} MB.`);
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(URL.createObjectURL(next)); setError("");
  }
  function drop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); const next = event.dataTransfer.files[0]; if (next) choose(next); }
  function clear() { if (preview) URL.revokeObjectURL(preview); setFile(undefined); setPreview(undefined); setError(""); if (inputRef.current) inputRef.current.value = ""; }

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-card", compact ? "p-5 sm:p-6" : "p-5 sm:p-8")}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Verify a piece of media</h2><p className="mt-1 text-sm text-muted-foreground">Choose a file, capture from camera, or add a URL.</p></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-primary">Private by design</span></div>
      <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted p-1.5">
        {([{ id: "image", label: "Image", icon: FileImage }, { id: "audio", label: "Audio", icon: Music2 }, { id: "video", label: "Video", icon: Film }] as const).map(({ id, label, icon: Icon }) => (
          <Button key={id} type="button" variant={mode === id ? "default" : "ghost"} className="relative h-10" onClick={() => { setMode(id); setError(""); stopCamera(); }}><Icon />{label}</Button>
        ))}
      </div>
      
      {isCameraActive ? (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full object-contain max-h-80" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button onClick={capturePhoto} className="rounded-full shadow-lg h-12 px-6">
              <Camera className="mr-2" /> Capture
            </Button>
            <Button variant="secondary" onClick={stopCamera} className="rounded-full shadow-lg h-12 px-6">
              Cancel
            </Button>
          </div>
        </div>
      ) : preview ? (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-muted">
          {mode === "image" && <img src={preview} alt="Selected upload preview" className={cn("w-full object-contain bg-black/5", compact ? "max-h-52" : "max-h-80")} />}
          {mode === "video" && <video src={preview} controls className={cn("w-full object-contain bg-black/90", compact ? "max-h-52" : "max-h-80")} />}
          {mode === "audio" && <audio src={preview} controls className="w-full mt-4" />}
          <Button type="button" variant="secondary" size="icon" onClick={clear} className="absolute right-3 top-3" aria-label="Remove media"><X /></Button><div className="border-t border-border bg-card px-4 py-3"><p className="truncate text-sm font-semibold">{file?.name}</p><p className="text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</p></div>
        </div>
      ) : (
        <div className="mt-5 grid min-h-44 place-items-center rounded-xl border border-dashed border-primary/35 bg-sky-soft p-6 text-center transition-colors hover:border-primary hover:bg-accent">
          <input ref={inputRef} type="file" accept={mode === "image" ? ".jpg,.jpeg,.png,.webp" : mode === "video" ? ".mp4,.webm,.mov" : ".mp3,.wav,.ogg,.m4a"} className="hidden" onChange={(e) => { const next = e.target.files?.[0]; if (next) choose(next); }} />
          <div onDrop={drop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-button"><UploadCloud /></div>
            <p className="mt-3 font-bold">Drop your {mode} here or <span className="text-primary">browse</span></p>
          </div>
          {mode === "image" && (
            <Button type="button" variant="outline" size="sm" className="mt-4 gap-2" onClick={(e) => { e.stopPropagation(); startCamera(); }}>
              <Camera className="size-4" /> Live Camera Capture
            </Button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{mode === "image" ? "JPG, JPEG, PNG, WEBP" : mode === "video" ? "MP4, WEBM, MOV" : "MP3, WAV, OGG, M4A"} · up to 10 MB</p>
        </div>
      )}
      
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
      <div className="my-5 flex items-center gap-3 text-xs font-bold text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
      <div className="relative"><Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 pl-10" placeholder={`Paste a direct ${mode} URL`} aria-label="Media URL" /></div>
      <Button size="lg" className="mt-5 w-full" disabled={!file && !url.trim()} onClick={() => onAnalyze?.({ file, url: url.trim() || undefined })}>Start Analysis</Button>
    </div>
  );
}