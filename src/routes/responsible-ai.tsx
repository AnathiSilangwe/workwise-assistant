import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Eye, UserCheck, Lock, Scale, KeyRound, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/responsible-ai")({
  head: () => ({
    meta: [
      { title: "Responsible AI — WorkWise AI" },
      {
        name: "description",
        content:
          "How WorkWise AI handles transparency, human verification, privacy, bias, and security.",
      },
    ],
  }),
  component: ResponsibleAi,
});

const sections = [
  {
    icon: Eye,
    title: "Transparency",
    body:
      "Users are clearly informed that AI-generated responses may contain mistakes or inaccuracies. We surface this notice in the app and in this page.",
  },
  {
    icon: UserCheck,
    title: "Human Verification",
    body:
      "Important emails, summaries, and plans should always be reviewed by a person before being acted on or sent.",
  },
  {
    icon: Lock,
    title: "Privacy",
    body:
      "Do not upload confidential company information you are not authorized to share. We do not use your prompts to train third-party models.",
  },
  {
    icon: Scale,
    title: "Bias & Fairness",
    body:
      "AI outputs can reflect bias in their training data. Always check generated content for fairness, tone, and accuracy before relying on it.",
  },
  {
    icon: KeyRound,
    title: "Security",
    body:
      "Passwords are hashed and stored securely. All traffic uses HTTPS. Authenticated routes are protected and your data is scoped to your account.",
  },
];

function ResponsibleAi() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back home
        </Link>
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Responsible AI</h1>
        </div>
        <p className="mb-12 text-muted-foreground">
          WorkWise AI is built to augment human work, not replace human judgment. Below is how we think
          about the responsibilities that come with deploying AI in the workplace.
        </p>
        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-surface/50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-md bg-accent/10 text-accent">
                  <s.icon className="size-4" />
                </div>
                <h2 className="text-lg font-medium">{s.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          This page is maintained by the WorkWise AI team. It describes our intent and current
          practices, and is not a certification or legal guarantee.
        </p>
      </div>
    </div>
  );
}
