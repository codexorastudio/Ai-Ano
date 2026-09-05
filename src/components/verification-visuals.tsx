import { Activity, Check, FileImage, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

export function HeroVerificationVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[510px]" aria-label="Illustration of an image being verified">
      <div className="absolute inset-[8%] rounded-[3rem] bg-sky-soft" />
      <div className="animate-float absolute left-[13%] top-[17%] w-[68%] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between"><div className="flex gap-1.5"><span className="size-2 rounded-full bg-destructive/60"/><span className="size-2 rounded-full bg-warning"/><span className="size-2 rounded-full bg-success"/></div><span className="text-[10px] font-bold text-muted-foreground">MEDIA INSPECTOR</span></div>
        <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
          <div className="absolute inset-0 grid place-items-center"><div className="relative"><div className="size-28 rounded-full bg-primary/15"/><div className="absolute inset-4 rounded-full border-2 border-primary/40"/><FileImage className="absolute inset-0 m-auto size-11 text-primary" /></div></div>
          <div className="animate-scan absolute inset-x-0 top-0 h-0.5 bg-primary shadow-button" />
          <span className="absolute left-3 top-3 rounded-md bg-card px-2 py-1 text-[9px] font-bold text-foreground shadow-sm">SCANNING</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">{[72,54,89].map((value, i) => <div key={value} className="rounded-lg bg-muted p-2"><div className="text-[9px] font-semibold text-muted-foreground">{['Pattern','Context','Metadata'][i]}</div><div className="mt-1 text-sm font-extrabold text-foreground">{value}%</div></div>)}</div>
      </div>
      <div className="absolute bottom-[16%] right-[5%] grid size-24 place-items-center rounded-full border-8 border-background bg-primary text-primary-foreground shadow-card"><ShieldCheck className="size-10" /></div>
      <div className="absolute right-[4%] top-[13%] rounded-xl border border-border bg-card p-3 shadow-card"><ScanLine className="size-7 text-primary" /></div>
      <div className="absolute bottom-[12%] left-[6%] rounded-xl border border-border bg-card p-3 shadow-card"><div className="flex items-center gap-2 text-xs font-bold"><Sparkles className="size-4 text-primary" />Evidence found</div></div>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-3 shadow-card">
      <div className="rounded-xl bg-foreground p-4 text-background">
        <div className="flex items-center justify-between"><span className="text-xs font-bold">AI Ano analysis</span><span className="rounded-full bg-background/10 px-2 py-1 text-[9px]">Complete</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-background/10"><div className="absolute inset-[14%] rounded-full border border-primary-foreground/20"/><ScanLine className="absolute inset-0 m-auto size-16 text-primary-foreground/70"/><div className="absolute inset-x-4 bottom-4 h-1 rounded-full bg-background/20"><div className="h-full w-4/5 rounded-full bg-primary"/></div></div>
          <div className="space-y-3"><div className="rounded-lg bg-background/10 p-3"><p className="text-[9px] text-background/65">RISK SCORE</p><p className="mt-1 text-3xl font-extrabold">86<span className="text-sm text-background/60">/100</span></p></div>{['Visual signals','Metadata','Source context'].map((label, i) => <div key={label} className="flex items-center justify-between rounded-lg bg-background/10 px-3 py-2 text-[10px]"><span>{label}</span><span className="font-bold">{[6,2,4][i]} signals</span></div>)}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">{['AI probability','Manipulation','Confidence'].map((label,i)=><div key={label} className="rounded-lg bg-sky-soft p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 text-base font-extrabold">{['87%','71%','High'][i]}</p></div>)}</div>
    </div>
  );
}

export function StepIcon({ type }: { type: number }) {
  const icons = [FileImage, Activity, Sparkles, ShieldCheck]; const Icon = icons[type] ?? Check;
  return <div className="grid size-16 place-items-center rounded-2xl bg-accent text-primary"><Icon className="size-7" /></div>;
}