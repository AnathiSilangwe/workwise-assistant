import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Mail,
  FileText,
  CalendarClock,
  Search,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { listHistory, getStats } from "@/lib/history.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — WorkWise AI" }] }),
  component: Dashboard,
});

const quickActions = [
  { title: "Generate Email", url: "/email", icon: Mail, accent: "from-blue-500/20 to-blue-500/5" },
  { title: "Summarize Notes", url: "/summarizer", icon: FileText, accent: "from-emerald-500/20 to-emerald-500/5" },
  { title: "Plan My Day", url: "/planner", icon: CalendarClock, accent: "from-amber-500/20 to-amber-500/5" },
  { title: "Research a Topic", url: "/research", icon: Search, accent: "from-violet-500/20 to-violet-500/5" },
  { title: "Open AI Chat", url: "/chat", icon: MessageSquare, accent: "from-rose-500/20 to-rose-500/5" },
] as const;

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const fetchHistory = useServerFn(listHistory);
  const fetchStats = useServerFn(getStats);

  const [name, setName] = useState<string>("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const fallback = data.user?.email?.split("@")[0] ?? "";
      if (data.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        setName(prof?.full_name?.split(" ")[0] || fallback);
      }
    })();
  }, []);

  const { data: history = [] } = useQuery({ queryKey: ["history"], queryFn: () => fetchHistory() });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => fetchStats() });

  const score = Math.min(100, Math.round(((stats?.totalWeek ?? 0) / 20) * 100));
  const featureSeries = stats
    ? Object.entries(stats.byFeature).map(([k, v]) => ({ name: k, value: v as number }))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Greeting */}
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {greetingFor(now)}{name ? `, ${name}` : ""} <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Today is {format(now, "EEEE, d MMMM")} · {format(now, "p")}
        </p>
      </header>

      {/* Stat cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="AI requests this week"
          value={stats?.totalWeek ?? 0}
          sub={`${stats?.totalAll ?? 0} all-time`}
        />
        <StatCard
          icon={Clock}
          label="Hours saved"
          value={`${stats?.hoursSaved ?? 0}h`}
          sub="~3 min saved per output"
        />
        <StatCard
          icon={CheckCircle2}
          label="Outputs by tool"
          value={featureSeries.reduce((a, b) => a + b.value, 0)}
          sub="Last 7 days"
        />
        <ProductivityScore score={score} />
      </section>

      {/* Activity charts */}
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface/50 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Activity</h2>
              <p className="text-xs text-muted-foreground">AI requests per day</p>
            </div>
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.timeseries ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(new Date(v), "EEE")}
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => format(new Date(v as string), "EEEE, d MMM")}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-5">
          <h2 className="mb-1 text-sm font-medium">By tool</h2>
          <p className="mb-4 text-xs text-muted-foreground">Last 7 days</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureSeries}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((q) => (
            <Link
              key={q.url}
              to={q.url}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${q.accent} p-4 transition hover:border-primary/40 hover:shadow-md`}
            >
              <div className="mb-6 grid size-9 place-items-center rounded-lg bg-background/80 text-primary backdrop-blur">
                <q.icon className="size-4" />
              </div>
              <div className="flex items-center justify-between text-sm font-medium">
                {q.title}
                <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Link to="/history" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 size-5 opacity-50" />
            Nothing here yet. Generate your first AI output from any tool above.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface/30">
            {history.slice(0, 6).map((h: any) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    {h.feature}
                  </span>
                  <span className="truncate font-medium">{h.title || "(untitled)"}</span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ProductivityScore({ score }: { score: number }) {
  const radius = 28;
  const c = 2 * Math.PI * radius;
  const offset = c - (score / 100) * c;
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface/50 p-5">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 38 38)"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="fill-foreground text-sm font-semibold"
        >
          {score}
        </text>
      </svg>
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Productivity score
        </div>
        <div className="mt-0.5 text-sm font-medium">
          {score >= 80 ? "On fire 🔥" : score >= 40 ? "Steady progress" : "Getting started"}
        </div>
      </div>
    </div>
  );
}
