import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { planTasks } from "@/lib/features.functions";
import { toggleFavorite } from "@/lib/history.functions";
import { OutputActions } from "@/components/output-actions";
import { TypingIndicator } from "@/components/typing-indicator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner — WorkWise AI" }] }),
  component: PlannerPage,
});

type PlanResult = {
  schedule?: { time: string; task: string; priority?: string }[];
  tips?: string[];
  historyId?: string | null;
};

const priorityColor = (p?: string) => {
  switch ((p || "").toLowerCase()) {
    case "high": return "text-destructive border-destructive/30 bg-destructive/10";
    case "medium": return "text-accent border-accent/30 bg-accent/10";
    default: return "text-muted-foreground border-border bg-muted";
  }
};

function PlannerPage() {
  const qc = useQueryClient();
  const [tasks, setTasks] = useState("Finish report\nAttend team meeting\nStudy SQL\nExercise\nBuy groceries");
  const [hours, setHours] = useState("8 AM - 5 PM");
  const [fav, setFav] = useState(false);
  const callFn = useServerFn(planTasks);
  const favFn = useServerFn(toggleFavorite);
  const mutation = useMutation({
    mutationFn: () => callFn({ data: { tasks, workingHours: hours } }),
    onSuccess: () => { setFav(false); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const result = mutation.data as PlanResult | undefined;
  const historyId = result?.historyId;

  const exported = result
    ? [
        "DAILY SCHEDULE",
        ...(result.schedule ?? []).map((s) => `${s.time}  ${s.task}  [${s.priority || "—"}]`),
        "",
        "TIPS",
        ...(result.tips ?? []).map((t) => `• ${t}`),
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
      <PageHeader icon={CalendarClock} title="AI Task Planner" description="An optimized daily schedule from your task list." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-border bg-surface/50 p-6 lg:col-span-2">
          <div className="space-y-2">
            <Label>Working hours</Label>
            <Input value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tasks (one per line)</Label>
            <Textarea value={tasks} onChange={(e) => setTasks(e.target.value)} rows={12} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Planning…" : "Build my day"}
          </Button>
        </div>

        <div className="space-y-4 lg:col-span-3">
          {mutation.isPending ? (
            <div className="rounded-2xl border border-border bg-surface/50 p-6">
              <TypingIndicator label="Organising your day" />
            </div>
          ) : result ? (
            <>
              <div className="flex justify-end">
                <OutputActions
                  text={exported}
                  onRegenerate={() => mutation.mutate()}
                  regenerating={mutation.isPending}
                  filename="daily-plan.txt"
                  favorite={fav}
                  onToggleFavorite={onToggleFav}
                  favoriteDisabled={!historyId}
                />
              </div>
              <div className="rounded-2xl border border-border bg-surface/50 p-2">
                <ul className="divide-y divide-border">
                  {(result.schedule ?? []).map((s, i) => (
                    <li key={i} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-20 shrink-0 font-mono text-sm text-muted-foreground">{s.time}</div>
                      <div className="flex-1 text-sm">{s.task}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${priorityColor(s.priority)}`}>
                        {s.priority || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {result.tips && result.tips.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface/50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Lightbulb className="size-3.5" /> Optimization tips
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {result.tips.map((t, i) => (
                      <li key={i} className="flex gap-2"><span className="text-accent">•</span>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Your prioritized schedule will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
