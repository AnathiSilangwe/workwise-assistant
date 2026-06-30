import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { FileText, Loader2, CheckCircle2, ListChecks, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/features.functions";
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
};

function SummarizerPage() {
  const [notes, setNotes] = useState("");
  const callFn = useServerFn(summarizeMeeting);
  const mutation = useMutation({
    mutationFn: (n: string) => callFn({ data: { notes: n } }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const result = mutation.data as SummaryResult | undefined;

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
            {mutation.isPending ? <><Loader2 className="mr-2 size-4 animate-spin" />Summarizing</> : "Summarize"}
          </Button>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {mutation.isPending ? (
            <div className="rounded-2xl border border-border bg-surface/50 p-6">
              <div className="space-y-2">
                {[90, 70, 95, 60, 80].map((w, i) => (
                  <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : result ? (
            <>
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
