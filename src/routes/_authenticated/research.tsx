import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { researchTopic } from "@/lib/features.functions";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — WorkWise AI" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const callFn = useServerFn(researchTopic);
  const mutation = useMutation({
    mutationFn: (t: string) => callFn({ data: { topic: t } }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const text = mutation.data?.text ?? "";

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader icon={Search} title="AI Research Assistant" description="Get a structured brief on any topic in seconds." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (topic.trim()) mutation.mutate(topic);
        }}
        className="mb-6 flex gap-2"
      >
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Explain Data Analytics"
          className="h-11"
        />
        <Button type="submit" disabled={mutation.isPending || !topic.trim()} className="h-11 px-6">
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Research"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-surface/50 p-6">
        {mutation.isPending ? (
          <div className="space-y-2">
            {[90, 75, 95, 60, 80, 70, 88].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : text ? (
          <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-base prose-h3:text-sm">
            <ReactMarkdown>{text}</ReactMarkdown>
          </article>
        ) : (
          <div className="grid h-48 place-items-center text-center text-sm text-muted-foreground">
            Enter a topic and we'll return a structured brief with summary, key insights, examples, and recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
