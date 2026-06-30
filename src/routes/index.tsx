import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  FileText,
  CalendarClock,
  Search,
  MessageSquare,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkWise AI — Your intelligent workplace assistant" },
      {
        name: "description",
        content:
          "Smart emails, meeting summaries, task planning, research, and an AI workplace chatbot. WorkWise AI puts an intelligent assistant in your workflow.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Mail,
    title: "Smart Email Generator",
    desc: "Audience, purpose, and tone in — professional drafts out.",
  },
  {
    icon: FileText,
    title: "Meeting Summarizer",
    desc: "Decisions, action items, and deadlines extracted in seconds.",
  },
  {
    icon: CalendarClock,
    title: "AI Task Planner",
    desc: "Prioritized daily schedule tuned to your working hours.",
  },
  {
    icon: Search,
    title: "Research Assistant",
    desc: "Concise topic briefs with key concepts, examples, and reading.",
  },
  {
    icon: MessageSquare,
    title: "Workplace Chatbot",
    desc: "Threaded AI chat for prep, brainstorming, and quick answers.",
  },
];

const stats = [
  { task: "Email Writing", manual: 15, ai: 1 },
  { task: "Meeting Summary", manual: 40, ai: 0.5 },
  { task: "Task Planning", manual: 20, ai: 1 },
  { task: "Research", manual: 45, ai: 2 },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            WorkWise <span className="text-primary">AI</span>
          </Link>
          <div className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#stats" className="hover:text-foreground">Productivity</a>
            <Link to="/responsible-ai" className="hover:text-foreground">Responsible AI</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[500px] max-w-5xl bg-[radial-gradient(closest-side,oklch(0.55_0.22_260/0.18),transparent)]" />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-accent">
              <span className="relative grid size-1.5 place-items-center rounded-full bg-accent" />
              Powered by Lovable AI
            </span>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Your intelligent workplace assistant for{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                emails, meetings, research
              </span>
              , and productivity.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              WorkWise AI removes the busywork from your day. Five focused tools and a workplace chatbot
              — all in one clean dashboard.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start free <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/responsible-ai">Responsible AI</Link>
              </Button>
            </div>
          </div>

          {/* App preview */}
          <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-border bg-surface/40 p-2 shadow-soft">
            <div className="grid h-[360px] grid-cols-12 gap-2 rounded-xl bg-background p-3">
              <div className="col-span-3 space-y-2 rounded-lg border border-border/60 p-3">
                {features.slice(0, 5).map((f) => (
                  <div
                    key={f.title}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground"
                  >
                    <f.icon className="size-3.5" /> {f.title}
                  </div>
                ))}
              </div>
              <div className="col-span-9 space-y-3 rounded-lg border border-border/60 p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">AI Output</div>
                <div className="rounded-lg border border-border/60 bg-surface/50 p-4 text-sm leading-relaxed">
                  <div className="font-medium">Subject: Annual Leave Request — July 10 to July 18</div>
                  <p className="mt-2 text-muted-foreground">
                    Dear Manager, I hope you're doing well. I'd like to request annual leave from
                    July 10 to July 18 to attend a family commitment. I'll ensure my responsibilities
                    are covered and a hand-off document is shared before I'm out…
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">Professional</span>
                  <span className="rounded-md bg-accent/10 px-2 py-1 text-xs text-accent">Concise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">Five tools, one workspace.</h2>
            <p className="mt-2 text-muted-foreground">
              Each module is purpose-built to shave hours off your week.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-surface/50 p-6 transition hover:border-primary/40"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Quantifiable time back.</h2>
              <p className="mt-3 text-muted-foreground">
                Average task time, manual vs WorkWise AI.
              </p>
              <div className="mt-8 space-y-6">
                {stats.map((s) => {
                  const max = Math.max(...stats.map((x) => x.manual));
                  return (
                    <div key={s.task}>
                      <div className="mb-1.5 flex justify-between text-xs uppercase tracking-wider">
                        <span>{s.task}</span>
                        <span className="text-muted-foreground">
                          {s.manual}m → <span className="text-accent">{s.ai}m</span>
                        </span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                        <div className="absolute inset-y-0 left-0 bg-muted-foreground/40" style={{ width: `${(s.manual / max) * 100}%` }} />
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent" style={{ width: `${(s.ai / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface/50 p-8">
              <p className="text-lg italic text-muted-foreground">
                "WorkWise AI changed my relationship with my inbox. I'm doing deep work again — and the
                meeting summaries land before I'm back at my desk."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-accent" />
                <div className="text-sm">
                  <div className="font-medium">Sarah Chen</div>
                  <div className="text-muted-foreground">Lead Product Designer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-4xl font-semibold tracking-tight">Ready to reclaim your week?</h2>
          <p className="mt-3 text-muted-foreground">
            Set up your workspace in under a minute.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/auth">Get started — it's free</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            WorkWise AI · © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-6">
            <Link to="/responsible-ai" className="hover:text-foreground inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Responsible AI
            </Link>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
