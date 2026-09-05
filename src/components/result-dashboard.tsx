import { AlertTriangle, ArrowDown, CheckCircle2, Download, ExternalLink, FileSearch, Info, ShieldCheck } from "lucide-react";
import type { AnalysisResult, EvidenceSeverity } from "@/lib/analysis-types";
import { Button } from "./ui/button";

const severityClass: Record<EvidenceSeverity, string> = {
  HIGH: "bg-danger-soft text-destructive",
  MEDIUM: "bg-secondary text-secondary-foreground",
  LOW: "bg-muted text-muted-foreground",
};

export function ScoreRing({ value }: { value: number }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className="relative grid size-36 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${clampedValue * 3.6}deg, var(--muted) 0deg)` }}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Risk score: ${clampedValue} out of 100`}
    >
      <div className="grid size-28 place-items-center rounded-full bg-card text-center">
        <div>
          <span className="text-4xl font-extrabold">{clampedValue}</span>
          <span className="text-sm text-muted-foreground">/100</span>
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">RISK SCORE</p>
        </div>
      </div>
    </div>
  );
}

export function SourceTimeline({ result }: { result: AnalysisResult }) {
  const timeline = result.sourceVerification?.timeline || [];
  if (timeline.length === 0) return null;

  return (
    <div className="grid gap-0 md:grid-cols-5" role="list" aria-label="Media provenance timeline">
      {timeline.map((item, index) => (
        <div key={item.label + index} className="relative flex gap-4 pb-6 md:block md:pb-0 md:text-center" role="listitem">
          <div className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-4 border-card bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </div>
          {index < timeline.length - 1 && (
            <div className="absolute left-[17px] top-8 h-[calc(100%-1.5rem)] w-px bg-border md:left-1/2 md:top-[17px] md:h-px md:w-full" aria-hidden="true" />
          )}
          <div className="md:mt-4">
            <p className="text-sm font-bold">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            <p className="mt-2 text-[10px] font-bold text-primary">{item.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultDashboard({ result, example = false }: { result: AnalysisResult; example?: boolean }) {
  const isAuthentic = result.verdict === "LIKELY AUTHENTIC" || result.riskScore < 30;
  const hasMatchingMedia = (result.sourceVerification?.matchingMedia ?? 0) > 0;

  function downloadReport() {
    const reportLines = [
      `==================================================`,
      `       TrustLens — MEDIA VERIFICATION REPORT      `,
      `==================================================`,
      ``,
      `Report ID: ${result.id}`,
      `Generated At: ${result.createdAt}`,
      `Analyzed File: ${result.mediaName}`,
      ``,
      `--------------------------------------------------`,
      `1. VERDICT & PROBABILISTIC ASSESSMENT`,
      `--------------------------------------------------`,
      `Overall Verdict:            ${result.verdict}`,
      `Risk Score:                 ${result.riskScore}/100`,
      `AI Generation Probability:  ${result.aiProbability}%`,
      `Manipulation Probability:   ${result.manipulationProbability}%`,
      `Forensic Confidence:        ${result.confidence}`,
      ``,
      `IMPORTANT NOTICE:`,
      `This is a probabilistic assessment designed to support, not replace,`,
      `human judgment and journalistic inquiry. It is not absolute proof.`,
      ``,
      `--------------------------------------------------`,
      `2. DETAILED EXPLANATION`,
      `--------------------------------------------------`,
      result.explanation,
      ``,
      `--------------------------------------------------`,
      `3. FORENSIC EVIDENCE BREAKDOWN`,
      `--------------------------------------------------`,
      ...result.evidence.map(
        (e) => `• [${e.severity}] (${e.category.toUpperCase()}) ${e.title}: ${e.description}`
      ),
      ``,
      `--------------------------------------------------`,
      `4. SOURCE & CONTEXT VERIFICATION`,
      `--------------------------------------------------`,
      `Source URL:          ${result.sourceVerification.sourceUrl}`,
      `Publication Date:    ${result.sourceVerification.publicationDate}`,
      `Matching Media:      ${result.sourceVerification.matchingMedia} versions found`,
      `Context Comparison:  ${result.sourceVerification.contextComparison}`,
      `Caption Analysis:    ${result.sourceVerification.captionDifferences}`,
      ``,
      `==================================================`,
      `      © 2026 TrustLens — See. Verify. Trust.      `,
      `==================================================`,
    ];

    const blob = new Blob([reportLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `trustlens-report-${result.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  // Section 5 Requirement: Dynamic verdict subtext based on risk level
  const verdictDescription = isAuthentic
    ? "No strong signals of AI generation or manipulation were detected in this analysis."
    : "Multiple signals warrant closer review. This assessment is probabilistic and should be considered alongside source context and human judgment.";

  // Section 5 Requirement: Caption difference text handling zero matches
  const captionText = hasMatchingMedia
    ? result.sourceVerification.captionDifferences
    : "No matching versions were found.";

  return (
    <div className="space-y-6">
      {example && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground">
          <Info className="size-4 shrink-0" />
          Example analysis — this is demonstration data, not a real uploaded-file result.
        </div>
      )}

      {/* OVERALL VERDICT SECTION */}
      <section
        className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-card lg:grid-cols-[auto_1fr_auto] lg:items-center lg:p-8"
        aria-label="Overall verification verdict"
      >
        <ScoreRing value={result.riskScore} />
        <div>
          <p className="text-xs font-extrabold tracking-wider text-primary uppercase">OVERALL VERDICT</p>
          <div className="mt-2 flex items-center gap-2">
            {isAuthentic ? (
              <CheckCircle2 className="size-7 text-success shrink-0" />
            ) : (
              <AlertTriangle className="size-7 text-warning shrink-0" />
            )}
            <h1 className="text-2xl font-extrabold sm:text-3xl">{result.verdict}</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{verdictDescription}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href="#evidence">
                View Evidence <ArrowDown className="size-3.5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="#sources">
                View Sources <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid min-w-48 gap-3">
          {[
            ["AI generation", result.aiProbability],
            ["Manipulation", result.manipulationProbability],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="flex justify-between text-xs font-bold">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${isAuthentic ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <strong>{result.confidence}</strong>
          </div>
        </div>
      </section>

      {/* EVIDENCE BREAKDOWN */}
      <section id="evidence" className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 lg:p-8" aria-label="Evidence breakdown">
        <div className="flex items-center gap-3">
          <FileSearch className="text-primary size-6 shrink-0" />
          <div>
            <p className="text-xs font-bold tracking-wider text-primary uppercase">EVIDENCE BREAKDOWN</p>
            <h2 className="text-2xl font-extrabold">What the analysis found</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {result.evidence.map((e) => (
            <article key={e.id} className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-base">{e.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${severityClass[e.severity]}`}>
                  {e.severity}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{e.description}</p>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-primary">{e.category} signal</p>
            </article>
          ))}
        </div>
      </section>

      {/* EXPLANATION */}
      <section className="grid gap-6 rounded-2xl bg-foreground p-6 text-background lg:grid-cols-[.7fr_1.3fr] lg:p-8" aria-label="GenAI explanation">
        <div>
          <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <p className="mt-4 text-xs font-bold text-sky uppercase tracking-wider">GENAI-POWERED EXPLANATION</p>
          <h2 className="mt-2 text-2xl font-extrabold">Why was this assessment reached?</h2>
        </div>
        <div className="rounded-xl bg-background/10 p-5 text-sm leading-7 text-background/85">
          <blockquote className="italic">“{result.explanation}”</blockquote>
          <p className="mt-4 border-t border-background/15 pt-4 text-xs text-background/60">
            This explanation summarizes structured forensic evidence. It is a probabilistic assessment designed to assist human verification.
          </p>
        </div>
      </section>

      {/* SOURCE VERIFICATION */}
      <section id="sources" className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 lg:p-8" aria-label="Source verification">
        <p className="text-xs font-bold tracking-wider text-primary uppercase">SOURCE VERIFICATION</p>
        <h2 className="mt-2 text-2xl font-extrabold">Where did this media come from?</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Source URL", result.sourceVerification.sourceUrl],
            ["Publication date", result.sourceVerification.publicationDate],
            ["Matching media", `${result.sourceVerification.matchingMedia} related versions`],
            ["Caption / Context", captionText],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-muted p-4">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
              <p className="mt-2 text-sm font-semibold truncate" title={value}>
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <SourceTimeline result={result} />
        </div>
      </section>

      {/* MEDIA COMPARISON: ONLY SHOW IF MATCHING MEDIA EXISTS (Requirement 5) */}
      {hasMatchingMedia ? (
        <section className="grid gap-5 rounded-2xl border border-border bg-card p-6 lg:grid-cols-2 lg:p-8" aria-label="Media comparison">
          <div>
            <p className="text-xs font-bold tracking-wider text-primary uppercase">MEDIA COMPARISON</p>
            <h2 className="mt-2 text-2xl font-extrabold">Versions differ in framing and context</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {result.sourceVerification.matchingMedia} matching external version(s) detected. Comparing crops, framing, and context across indexed archives.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Submitted media", "Earliest match"].map((label, i) => (
              <div key={label} className="grid aspect-[4/3] place-items-center rounded-xl bg-sky-soft p-4">
                <div className="text-center">
                  <FileSearch className="mx-auto text-primary size-6" />
                  <p className="mt-2 text-xs font-bold">{label}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground truncate max-w-28">{i ? "Source preview" : result.mediaName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center lg:p-8" aria-label="No media comparison available">
          <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">MEDIA COMPARISON</p>
          <h2 className="mt-1 text-lg font-bold">No matching external versions were found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            This media has not been indexed in circulating public archives. Comparison against historical versions is not applicable.
          </p>
        </section>
      )}

      {/* FINAL ASSESSMENT & DOWNLOAD */}
      <section
        className={`flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8 ${
          isAuthentic ? "border-success/30 bg-success/5" : "border-warning/40 bg-secondary"
        }`}
        aria-label="Final verification action"
      >
        <div className="flex gap-4">
          {isAuthentic ? (
            <CheckCircle2 className="mt-1 shrink-0 text-success size-6" />
          ) : (
            <AlertTriangle className="mt-1 shrink-0 text-warning size-6" />
          )}
          <div>
            <h2 className="text-xl font-extrabold">Final assessment</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {isAuthentic
                ? "The available evidence indicates this media is likely authentic with no strong indicators of synthetic manipulation. Always consider origin and source context."
                : "The available evidence suggests elevated risk, but it is not absolute proof. Confirm the original source, publication context, and corroborating evidence before making a decision."}
            </p>
          </div>
        </div>
        <Button onClick={downloadReport} className="shrink-0 gap-2">
          <Download className="size-4" />
          Generate Report
        </Button>
      </section>
    </div>
  );
}