import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, FileSearch, HelpCircle, Lock, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — AI Ano Media Verification" },
      {
        name: "description",
        content: "Learn about AI Ano, our evidence-led media verification methodology, responsible AI practices, and forensic limitations.",
      },
      { property: "og:title", content: "About — AI Ano Media Verification" },
      { property: "og:description", content: "Probabilistic media verification designed to support, not replace, human judgment." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-sky-soft/60 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3.5 py-1.5 text-xs font-extrabold text-primary shadow-sm">
            <Shield className="size-4" /> RESPONSIBLE MEDIA VERIFICATION
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Empowering Truth in the <span className="text-primary">Age of Generative AI</span>
          </h1>
          <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
            AI Ano provides journalists, researchers, fact-checkers, and digital citizens with transparent, evidence-led tools to interrogate synthetic media and manipulation.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/analyze">
                Try Verification <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#methodology">Our Methodology</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Problem Statement */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-bold text-primary tracking-widest uppercase">THE CHALLENGE</p>
              <h2 className="mt-2 text-3xl font-extrabold">The Erosion of Visual & Audio Trust</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                As generative models for photorealistic images, synthetic voices, and deepfake videos become ubiquitous, distinguishing genuine media from manipulated narratives is increasingly difficult.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Black-box detectors that output an opaque "98% fake" percentage often create false confidence or unwarranted panic without explaining *why*.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-4">
              <h3 className="font-extrabold text-lg">The AI Ano Principles</h3>
              <ul className="space-y-3">
                {[
                  "Evidence over Assumptions: We isolate visual, spectral, and metadata anomalies rather than guessing.",
                  "Probabilistic, Not Absolute: We reject binary labels. Every result reflects statistical probability.",
                  "Human-in-the-Loop: Verification tools must assist editorial judgment, never replace human critical thinking.",
                  "Privacy First: Media uploaded for analysis is processed securely in memory and never indexed publicly.",
                ].map((principle, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="methodology" className="border-t border-border bg-sky-soft/40 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold text-primary tracking-widest uppercase">FORENSIC ARCHITECTURE</p>
            <h2 className="mt-2 text-3xl font-extrabold">Multi-Signal Verification Pipeline</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Our analysis pipeline inspects multiple orthogonal layers of evidence before synthesizing an assessment.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileSearch,
                title: "Visual Artifact Inspection",
                description:
                  "Scrutinizes edge blurs, texture inconsistencies, anatomical fidelity (hands, teeth, eyes), and lighting coherence.",
              },
              {
                icon: Sparkles,
                title: "Generative Model Signatures",
                description:
                  "Detects frequency anomalies and diffusion artifacts characteristic of diffusion models (Midjourney, DALL-E, Flux).",
              },
              {
                icon: HelpCircle,
                title: "Explainable Synthesis",
                description:
                  "Transforms raw forensic signals into accessible, plain-language reasoning that explains why an anomaly matters.",
              },
            ].map((step, idx) => (
              <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-bold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limitations Disclaimer */}
      <section id="responsible-ai" className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center sm:text-left sm:flex sm:items-center sm:gap-6">
          <Lock className="size-10 text-warning shrink-0 mx-auto sm:mx-0" />
          <div>
            <h2 className="text-xl font-extrabold">Responsible AI & Limitations Disclaimer</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              No AI detection system is 100% accurate. Compressed social media uploads, extreme filters, or novel generative models can produce both false positives and false negatives. Always corroborate digital media with primary sources, expert commentary, and contextual timelines before publishing or acting.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
