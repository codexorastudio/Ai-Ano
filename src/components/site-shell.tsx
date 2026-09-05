import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ScanSearch, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const links = [
  { label: "Home", to: "/" as const },
  { label: "Analyze", to: "/analyze" as const },
  { label: "How It Works", to: "/" as const, hash: "how-it-works" },
  { label: "Features", to: "/" as const, hash: "features" },
  { label: "About", to: "/about" as const },
];

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-foreground">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-button"><ScanSearch className="size-5" /></span>
      <div className="flex flex-col">
        <span className="font-extrabold text-base leading-tight tracking-tight">AI ANO?</span>
        <span className="text-[9px] font-bold text-primary leading-tight tracking-widest uppercase">Media Verification</span>
      </div>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((item) => (
            <Link key={item.label} to={item.to} hash={item.hash} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" activeProps={item.hash ? undefined : { className: "text-primary" }} activeOptions={{ exact: item.to === "/" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden lg:block"><Button asChild><Link to="/analyze">Analyze Media</Link></Button></div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-5 py-5 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((item) => <Link key={item.label} to={item.to} hash={item.hash} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-primary">{item.label}</Link>)}
            <Button asChild className="mt-3"><Link to="/analyze" onClick={() => setOpen(false)}>Analyze Media</Link></Button>
          </div>
        </nav>
      )}
      <span className="sr-only">Current page: {pathname}</span>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
        <div><Brand /><p className="mt-4 text-sm font-semibold text-muted-foreground">See. Verify. Trust.</p><p className="mt-4 max-w-xs text-xs leading-6 text-muted-foreground">Probabilistic media verification designed to support, not replace, human judgment.</p></div>
        <FooterGroup title="Product" links={[['Analyze Media','/analyze'],['How It Works','/#how-it-works'],['Features','/#features']]} />
        <FooterGroup title="Resources" links={[['Verification Guide','/about#resources'],['Responsible AI','/about#responsible-ai'],['History','/history']]} />
        <FooterGroup title="Company" links={[['About','/about'],['Contact','/about#contact']]} />
        <FooterGroup title="Legal" links={[['Privacy','/about#legal'],['Terms','/about#legal']]} />
      </div>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">© 2026 AI Ano. Verification supports informed decisions; it does not establish absolute truth.</div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<[string, string]> }) {
  return <div><h3 className="text-sm font-bold text-foreground">{title}</h3><ul className="mt-4 space-y-3">{links.map(([label, href]) => <li key={label}><a href={href} className="text-sm text-muted-foreground transition-colors hover:text-primary">{label}</a></li>)}</ul></div>;
}