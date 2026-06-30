import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { researchTopic } from "@/lib/features.functions";
import { toggleFavorite } from "@/lib/history.functions";
import ReactMarkdown from "react-markdown";
import { OutputActions } from "@/components/output-actions";
import { TypingIndicator } from "@/components/typing-indicator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Assistant — WorkWise AI" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [fav, setFav] = useState(false);
  const callFn = useServerFn(researchTopic);
  const favFn = useServerFn(toggleFavorite);
  const mutation = useMutation({
    mutationFn: (t: string) => callFn({ data: { topic: t } }),
    onSuccess: () => { setFav(false); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const text = mutation.data?.text ?? "";
  const historyId = mutation.data?.historyId;

  const onToggleFav = async () => {
    if (!historyId) return;
    const next = !fav;
    setFav(next);
    try {
      await favFn({ data: { id: historyId, favorite: next } });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(next ? "Saved" : "Removed");
    } catch {
      setFav(!next);
    }
  };

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
          {mutation.isPending ? "Researching…" : "Research"}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-surface/50 p-6">
        {text || mutation.isPending ? (
          <div className="mb-3 flex justify-end">
            <OutputActions
              text={text}
              onRegenerate={() => topic.trim() && mutation.mutate(topic)}
              regenerating={mutation.isPending}
              filename={`${topic.slice(0, 40) || "research"}.md`}
              favorite={fav}
              onToggleFavorite={onToggleFav}
              favoriteDisabled={!historyId}
            />
          </div>
        ) : null}
        {mutation.isPending ? (
          <TypingIndicator label="Researching the topic" />
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
