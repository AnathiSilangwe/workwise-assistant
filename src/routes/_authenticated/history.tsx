import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon, Search, Trash2, Copy, Heart } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { listHistory, deleteHistoryItem, toggleFavorite } from "@/lib/history.functions";
import { format, isToday, isYesterday, formatDistanceToNow, startOfDay } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — WorkWise AI" }] }),
  component: HistoryPage,
});

const FEATURE_LABEL: Record<string, string> = {
  email: "Email",
  summary: "Summary",
  planner: "Planner",
  research: "Research",
};

function bucket(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  const days = Math.floor((Date.now() - startOfDay(d).getTime()) / 86_400_000);
  if (days < 7) return format(d, "EEEE");
  return format(d, "d MMM yyyy");
}

function stringifyResponse(r: unknown): string {
  if (r == null) return "";
  if (typeof r === "string") return r;
  if (typeof r === "object") {
    const o = r as any;
    if (typeof o.text === "string") return o.text;
    if (typeof o.summary === "string") return o.summary;
    return JSON.stringify(o, null, 2);
  }
  return String(r);
}

function stringifyPrompt(p: unknown): string {
  if (p == null) return "";
  if (typeof p === "string") return p;
  return JSON.stringify(p, null, 2);
}

function HistoryPage() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(listHistory);
  const deleteFn = useServerFn(deleteHistoryItem);
  const favFn = useServerFn(toggleFavorite);
  const [query, setQuery] = useState("");
  const [feature, setFeature] = useState<string>("all");
  const [open, setOpen] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchFn(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      setDeleteId(null);
      setOpen(null);
      toast.success("Removed");
    },
  });

  const favMut = useMutation({
    mutationFn: (v: { id: string; favorite: boolean }) => favFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const filtered = useMemo(() => {
    return data.filter((h: any) => {
      if (feature !== "all" && h.feature !== feature) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (h.title || "").toLowerCase().includes(q) ||
        stringifyPrompt(h.prompt).toLowerCase().includes(q) ||
        stringifyResponse(h.response).toLowerCase().includes(q)
      );
    });
  }, [data, feature, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const h of filtered) {
      const k = bucket(h.created_at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(h);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const features = ["all", "email", "summary", "planner", "research"];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={HistoryIcon} title="Prompt history" description="Search, revisit, and clean up past AI outputs." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keyword…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface/50 p-1">
          {features.map((f) => (
            <button
              key={f}
              onClick={() => setFeature(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
                feature === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : FEATURE_LABEL[f] ?? f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          {data.length === 0 ? "No history yet — outputs you generate will appear here." : "No matches."}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</h2>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-surface/30">
                {items.map((h: any) => (
                  <li key={h.id} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-muted/40">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {FEATURE_LABEL[h.feature] ?? h.feature}
                    </span>
                    <button onClick={() => setOpen(h)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-medium">{h.title || "(untitled)"}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {stringifyResponse(h.response).slice(0, 100)}
                      </div>
                    </button>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={h.favorite ? "text-rose-500" : "opacity-60"}
                      onClick={() => favMut.mutate({ id: h.id, favorite: !h.favorite })}
                      title={h.favorite ? "Unsave" : "Save"}
                    >
                      <Heart className={`size-4 ${h.favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => setDeleteId(h.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title || "(untitled)"}</SheetTitle>
                <SheetDescription>
                  {FEATURE_LABEL[open.feature] ?? open.feature} ·{" "}
                  {formatDistanceToNow(new Date(open.created_at), { addSuffix: true })}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 overflow-y-auto pr-2">
                <section>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Prompt</div>
                  <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-xs">
                    {stringifyPrompt(open.prompt)}
                  </pre>
                </section>
                <section>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Response</div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => favMut.mutate({ id: open.id, favorite: !open.favorite })}
                        className={open.favorite ? "text-rose-500" : ""}
                      >
                        <Heart className={`mr-2 size-3.5 ${open.favorite ? "fill-current" : ""}`} />
                        {open.favorite ? "Saved" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(stringifyResponse(open.response));
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="mr-2 size-3.5" /> Copy
                      </Button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm">
                    {stringifyResponse(open.response)}
                  </pre>
                </section>
                <Button variant="destructive" className="w-full" onClick={() => setDeleteId(open.id)}>
                  <Trash2 className="mr-2 size-4" /> Delete from history
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
