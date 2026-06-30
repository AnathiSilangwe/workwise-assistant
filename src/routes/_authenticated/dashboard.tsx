import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  Mail,
  FileText,
  CalendarClock,
  Search,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { listHistory } from "@/lib/history.functions";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WorkWise AI" }] }),
  component: Dashboard,
});

const tiles = [
  { title: "Email Generator", url: "/email", icon: Mail, hint: "Draft professional emails" },
  { title: "Meeting Summarizer", url: "/summarizer", icon: FileText, hint: "Decisions + action items" },
  { title: "Task Planner", url: "/planner", icon: CalendarClock, hint: "Build your daily schedule" },
  { title: "Research", url: "/research", icon: Search, hint: "Topic briefs in seconds" },
  { title: "AI Chat", url: "/chat", icon: MessageSquare, hint: "Threaded conversations" },
] as const;

function Dashboard() {
  const fetchHistory = useServerFn(listHistory);
  const { data: history = [] } = useQuery({
    queryKey: ["history"],
    queryFn: () => fetchHistory(),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        icon={LayoutDashboard}
        title="Welcome back"
        description="Pick a tool to get started, or jump back into recent work."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.url}
            to={t.url}
            className="group rounded-2xl border border-border bg-surface/50 p-5 transition hover:border-primary/40"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <t.icon className="size-5" />
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <h3 className="font-medium">{t.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{t.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Recent
        </h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nothing here yet. Generate your first AI output from any tool above.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {history.slice(0, 6).map((h) => (
              <li key={h.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{h.title || h.feature}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {h.feature} ·{" "}
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                  </div>
                </div>
                <Link to="/history" className="text-xs text-primary hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
