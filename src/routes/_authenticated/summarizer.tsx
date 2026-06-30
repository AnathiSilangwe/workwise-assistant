import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle2, ListChecks, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/features.functions";
import { toggleFavorite } from "@/lib/history.functions";
import { OutputActions } from "@/components/output-actions";
import { TypingIndicator } from "@/components/typing-indicator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/summarizer")({
  head: () => ({ meta: [{ title: "Meeting Summarizer — WorkWise AI" }] }),
  component: SummarizerPage,
});

type SummaryResult = {
  summary?: string;
  decisions?: string[];
  action_items?: { owner?: string; task?: string; due?: string }[];
  deadlines?: string[];
  historyId?: string | null;
};

function SummarizerPage() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [fav, setFav] = useState(false);
  const callFn = useServerFn(summarizeMeeting);
  const favFn = useServerFn(toggleFavorite);
  const mutation = useMutation({
    mutationFn: (n: string) => callFn({ data: { notes: n } }),
    onSuccess: () => { setFav(false); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const result = mutation.data as SummaryResult | undefined;
  const historyId = result?.historyId;

  const exported = result
    ? [
        `SUMMARY\n${result.summary ?? ""}`,
        `\nDECISIONS\n${(result.decisions ?? []).map((d) => `• ${d}`).join("\n")}`,
        `\nACTION ITEMS\n${(result.action_items ?? []).map((a) => `• ${a.owner || "—"}: ${a.task}${a.due ? ` (due ${a.due})` : ""}`).join("\n")}`,
        result.deadlines && result.deadlines.length ? `\nDEADLINES\n${result.deadlines.join(", ")}` : "",
      ].join("\n")
    : "";

  const onToggleFav = async () => {
    if (!historyId) return;
    const next = !fav;
    setFav(next);
    try {
      await favFn({ data: { id: historyId, favorite: next } });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(next ? "Saved" : "Removed");
    } catch { setFav(!next); }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={FileText} title="Meeting Summarizer" description="Paste notes — get decisions, actions, and deadlines." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-border bg-surface/50 p-6 lg:col-span-2">
          <div className="space-y-2">
            <Label>Meeting notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={18}
              placeholder="Paste raw meeting notes, transcript, or bullet points..."
            />
          </div>
          <Button
            disabled={mutation.isPending || notes.length < 20}
            onClick={() => mutation.mutate(notes)}
            className="w-full"
          >
            {mutation.isPending ? "Summarizing…" : "Summarize"}
          </Button>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {mutation.isPending ? (
            <div className="rounded-2xl border border-border bg-surface/50 p-6">
              <TypingIndicator label="Reading notes and extracting actions" />
            </div>
          ) : result ? (
            <>
              <div className="flex justify-end">
                <OutputActions
                  text={exported}
                  onRegenerate={() => mutation.mutate(notes)}
                  regenerating={mutation.isPending}
                  filename="meeting-summary.txt"
                  favorite={fav}
                  onToggleFavorite={onToggleFav}
                  favoriteDisabled={!historyId}
                />
              </div>
              <Section title="Summary" icon={FileText}>
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </Section>
              <Section title="Key decisions" icon={CheckCircle2}>
                <ul className="space-y-1.5 text-sm">
                  {(result.decisions ?? []).map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>{d}
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Action items" icon={ListChecks}>
                <ul className="space-y-2 text-sm">
                  {(result.action_items ?? []).map((a, i) => (
                    <li key={i} className="rounded-md border border-border bg-background p-3">
                      <span className="font-medium text-primary">{a.owner || "—"}</span>: {a.task}
                      {a.due && <span className="ml-2 text-xs text-muted-foreground">· due {a.due}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
              {result.deadlines && result.deadlines.length > 0 && (
                <Section title="Deadlines" icon={CalendarClock}>
                  <div className="flex flex-wrap gap-2">
                    {result.deadlines.map((d, i) => (
                      <span key={i} className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
                        {d}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </>
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Your structured summary will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}
