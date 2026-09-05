import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResultDashboard } from "@/components/result-dashboard";
import { getResultFn } from "@/server/functions";

export const Route = createFileRoute("/results/$id")({ 
  head: () => ({ meta: [
    { title: "Verification Results — AI Ano" }, { name: "description", content: "Review a probabilistic media assessment, evidence breakdown, explanation, and source context." },
    { property: "og:title", content: "Verification Results — AI Ano" }, { property: "og:description", content: "Review evidence and source context behind a media assessment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), 
  loader: async ({ params }) => {
    return await getResultFn({ data: { id: params.id } });
  },
  component: ResultsPage 
});

function ResultsPage(){ 
  const {id} = Route.useParams(); 
  const result = Route.useLoaderData();
  
  return <main className="bg-sky-soft/50 px-5 py-12 sm:px-8"><div className="mx-auto max-w-6xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link to="/analyze"><ArrowLeft/>New analysis</Link></Button><p className="text-xs font-semibold text-muted-foreground">Analysis ID: {id}</p></div><ResultDashboard result={result} example={false} /></div></main>; 
}