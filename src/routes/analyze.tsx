import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Circle, LoaderCircle, LockKeyhole, ScanSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaUpload } from "@/components/media-upload";
import { analyzeMediaFn } from "@/server/functions";

export const Route = createFileRoute("/analyze")({ head: () => ({ meta: [
  { title: "Analyze Media — AI Ano" }, { name: "description", content: "Upload an image or provide a URL for a clear, evidence-led media verification experience." },
  { property: "og:title", content: "Analyze Media — AI Ano" }, { property: "og:description", content: "Inspect an image for potential generation and manipulation signals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: AnalyzePage });

const stages = ["File received","File validated","Extracting metadata","Running AI detection","Performing forensic analysis","Building evidence","Preparing report"];

function AnalyzePage() {
  const navigate = useNavigate({ from: "/analyze" }); 
  const [processing,setProcessing]=useState(false); 
  const [stage,setStage]=useState(0);
  const [error, setError]=useState<string>();

  useEffect(()=>{ if(!processing) return; const timer=setInterval(()=>setStage((v)=>Math.min(v+1,6)),1500); return()=>clearInterval(timer); },[processing]);

  async function analyze(payload:{file?:File;url?:string}) { 
    setProcessing(true); 
    setStage(0); 
    setError(undefined);

    try {
      let base64Data = "";
      let mimeType = "";
      let fileName = "";

      // Helper to convert arrayBuffer to base64 in browser
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      if (payload.file) {
        // Convert File to base64
        const buffer = await payload.file.arrayBuffer();
        base64Data = arrayBufferToBase64(buffer);
        mimeType = payload.file.type;
        fileName = payload.file.name;
      } else if (payload.url) {
        // Handle URL by fetching it
        const res = await fetch(payload.url);
        const buffer = await res.arrayBuffer();
        base64Data = arrayBufferToBase64(buffer);
        mimeType = res.headers.get("content-type") || "image/jpeg";
        fileName = payload.url.split('/').pop() || "url-image";
      } else {
        throw new Error("No file or URL provided.");
      }

      // Call the server function
      const response = await analyzeMediaFn({ data: { base64Data, mimeType, fileName } });
      
      if (!response.success) {
        throw new Error(response.error);
      }

      navigate({to:"/results/$id",params:{id:response.result.id}});
    } catch (err: any) {
      setProcessing(false);
      setError(err.message || "Failed to analyze media.");
    }
  }

  return <main className="min-h-[80vh] bg-sky-soft/60 px-5 py-16 sm:px-8"><div className="mx-auto max-w-5xl">{!processing ? <><div className="mx-auto max-w-2xl text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-button"><ScanSearch/></span><h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">Analyze suspicious media</h1><p className="mt-4 text-base leading-7 text-muted-foreground">Upload an image or paste a direct URL. It will be analyzed by AI Ano.</p></div><div className="mx-auto mt-10 max-w-3xl"><MediaUpload onAnalyze={analyze}/>{error && <p className="mt-4 text-center font-bold text-destructive">{error}</p>}<div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="size-4"/>Files are processed securely.</div></div></> : <div className="mx-auto max-w-3xl"><div className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-10"><div className="flex flex-col items-center text-center"><div className="animate-pulse-ring grid size-16 place-items-center rounded-full bg-primary text-primary-foreground"><LoaderCircle className="size-7 animate-spin"/></div><p className="mt-5 text-xs font-extrabold text-primary">ANALYSIS IN PROGRESS</p><h1 className="mt-2 text-3xl font-extrabold">Building an evidence-led assessment</h1><p className="mt-3 text-sm text-muted-foreground">Our AI engine is currently inspecting the media file.</p></div><div className="mt-9 space-y-2">{stages.map((label,i)=><div key={label} className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${i===stage?'border-primary/30 bg-accent':i<stage?'border-border bg-background':'border-transparent bg-muted/50'}`}>{i<stage?<span className="grid size-7 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-4"/></span>:i===stage?<span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><LoaderCircle className="size-4 animate-spin"/></span>:<span className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground"><Circle className="size-3"/></span>}<span className={`text-sm font-bold ${i>stage?'text-muted-foreground':''}`}>{label}</span>{i===stage&&<span className="ml-auto text-xs font-semibold text-primary">Processing</span>}</div>)}</div></div></div>}</div></main>;
}