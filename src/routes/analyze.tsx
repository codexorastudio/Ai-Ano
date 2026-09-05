import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Circle, LoaderCircle, LockKeyhole, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaUpload } from "@/components/media-upload";
import { analyzeMediaFn } from "@/server/functions";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Media — TrustLens" },
      {
        name: "description",
        content: "Upload an image, audio, or video for clear, evidence-led AI media verification.",
      },
      { property: "og:title", content: "Analyze Media — TrustLens" },
      {
        property: "og:description",
        content: "Inspect media for potential AI generation and manipulation signals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyzePage,
});

const stages = [
  "File received & verified",
  "Validating format & size",
  "Extracting forensic metadata",
  "Running multi-signal AI detection",
  "Inspecting textures & frequency domain",
  "Building structured evidence",
  "Finalizing probabilistic report",
];

export function AnalyzePage() {
  const navigate = useNavigate({ from: "/analyze" });
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!processing) return;
    const timer = setInterval(() => setStage((v) => Math.min(v + 1, stages.length - 1)), 1400);
    return () => clearInterval(timer);
  }, [processing]);

  async function analyze(payload: { file?: File; url?: string }) {
    // Efficiency: Prevent duplicate concurrent submissions
    if (processing) return;

    setProcessing(true);
    setStage(0);
    setError(undefined);

    try {
      let base64Data = "";
      let mimeType = "";
      let fileName = "";

      // Helper to convert arrayBuffer to base64 in browser without memory bloat
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        const chunkSize = 0x8000; // Process in 32KB chunks to prevent call stack overflow
        for (let i = 0; i < len; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, Math.min(i + chunkSize, len)) as any
          );
        }
        return window.btoa(binary);
      };

      if (payload.file) {
        // Enforce 10MB limit before converting to base64
        if (payload.file.size > 10 * 1024 * 1024) {
          throw new Error("The media file is too large. Maximum allowed size is 10 MB.");
        }
        const buffer = await payload.file.arrayBuffer();
        base64Data = arrayBufferToBase64(buffer);
        mimeType = payload.file.type || "image/jpeg";
        fileName = payload.file.name;
      } else if (payload.url) {
        const trimmedUrl = payload.url.trim();
        let res: Response;
        try {
          res = await fetch(trimmedUrl);
        } catch {
          throw new Error("Unable to fetch media from the provided URL. Please check the link or upload the file directly.");
        }

        if (!res.ok) {
          throw new Error(`Failed to download media from URL (Status ${res.status}). Please verify the link.`);
        }

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 10 * 1024 * 1024) {
          throw new Error("The media file at the URL exceeds the 10 MB limit.");
        }

        base64Data = arrayBufferToBase64(buffer);
        mimeType = res.headers.get("content-type") || "image/jpeg";
        fileName = trimmedUrl.split("/").pop()?.split("?")[0] || "url-media";
      } else {
        throw new Error("Please provide a file or a valid URL to analyze.");
      }

      // Call the server function
      const response = await analyzeMediaFn({
        data: { base64Data, mimeType, fileName },
      });

      if (!response || !response.success || !response.result) {
        throw new Error(response?.error || "Analysis was unsuccessful. Please try again.");
      }

      navigate({ to: "/results/$id", params: { id: response.result.id } });
    } catch (err: any) {
      setProcessing(false);
      const message = err?.message || "Unable to analyze this media right now. Please try again.";
      setError(message);
    }
  }

  return (
    <main className="min-h-[80vh] bg-sky-soft/60 px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {!processing ? (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-button">
                <ScanSearch className="size-6" />
              </span>
              <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">Analyze suspicious media</h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Upload an image, audio clip, or video to inspect for AI generation, manipulation signals, and contextual integrity.
              </p>
            </div>
            <div className="mx-auto mt-10 max-w-3xl">
              <MediaUpload onAnalyze={analyze} />
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 rounded-xl border border-destructive/20 bg-danger-soft p-4 text-center font-semibold text-destructive text-sm"
                >
                  {error}
                </div>
              )}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="size-4" />
                Files are processed securely and analyzed server-side.
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-10" role="status" aria-live="polite">
              <div className="flex flex-col items-center text-center">
                <div className="animate-pulse-ring grid size-16 place-items-center rounded-full bg-primary text-primary-foreground">
                  <LoaderCircle className="size-7 animate-spin" />
                </div>
                <p className="mt-5 text-xs font-extrabold text-primary uppercase tracking-wider">
                  ANALYSIS IN PROGRESS
                </p>
                <h1 className="mt-2 text-3xl font-extrabold">Building an evidence-led assessment</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Our AI verification engine is currently inspecting the media file.
                </p>
              </div>
              <div className="mt-9 space-y-2.5">
                {stages.map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                      i === stage
                        ? "border-primary/40 bg-accent shadow-sm"
                        : i < stage
                        ? "border-border bg-background"
                        : "border-transparent bg-muted/40 opacity-70"
                    }`}
                  >
                    {i < stage ? (
                      <span className="grid size-7 place-items-center rounded-full bg-success text-primary-foreground">
                        <Check className="size-4" />
                      </span>
                    ) : i === stage ? (
                      <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                        <LoaderCircle className="size-4 animate-spin" />
                      </span>
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Circle className="size-3" />
                      </span>
                    )}
                    <span className={`text-sm font-bold ${i > stage ? "text-muted-foreground" : "text-foreground"}`}>
                      {label}
                    </span>
                    {i === stage && (
                      <span className="ml-auto text-xs font-semibold text-primary animate-pulse">
                        Processing...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}