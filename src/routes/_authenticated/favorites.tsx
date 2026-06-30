import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Copy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { listFavorites, toggleFavorite } from "@/lib/history.functions";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — WorkWise AI" }] }),
  component: FavoritesPage,
});

const FEATURE_LABEL: Record<string, string> = {
  email: "Email",
  summary: "Summary",
  planner: "Planner",
  research: "Research",
};

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

function FavoritesPage() {
  const qc = useQueryClient();
  const fetchFn = useServerFn(listFavorites);
  const favFn = useServerFn(toggleFavorite);
  const { data = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => fetchFn(),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => favFn({ data: { id, favorite: false } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Removed from favorites");
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={Heart} title="Saved responses" description="Your bookmarked AI outputs for quick reuse." />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
          <div>
            <Heart className="mx-auto mb-2 size-5 opacity-50" />
            No saved responses yet. Tap the heart icon on any AI output to save it here.
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((h: any) => {
            const text = stringifyResponse(h.response);
            return (
              <li key={h.id} className="rounded-2xl border border-border bg-surface/50 p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {FEATURE_LABEL[h.feature] ?? h.feature}
                    </span>
                    <h3 className="truncate font-medium">{h.title || "(untitled)"}</h3>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                  </span>
                </div>
                <pre className="max-h-40 overflow-hidden whitespace-pre-wrap text-sm text-muted-foreground">
                  {text.slice(0, 320)}{text.length > 320 ? "…" : ""}
                </pre>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(text);
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="mr-2 size-3.5" /> Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-500"
                    onClick={() => removeMut.mutate(h.id)}
                  >
                    <Heart className="mr-2 size-3.5 fill-current" /> Unsave
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
