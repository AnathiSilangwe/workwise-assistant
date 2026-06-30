import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Mail, Loader2, Copy, Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateEmail } from "@/lib/features.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator — WorkWise AI" }] }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Concise", "Formal", "Persuasive", "Apologetic"];

function EmailPage() {
  const [audience, setAudience] = useState("Manager");
  const [tone, setTone] = useState("Professional");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const callFn = useServerFn(generateEmail);
  const mutation = useMutation({
    mutationFn: (vars: { audience: string; tone: string; purpose: string; notes: string }) =>
      callFn({ data: vars }),
    onError: (e: any) => toast.error(e.message ?? "Generation failed"),
  });

  const run = () => {
    if (!purpose.trim()) return toast.error("Add a purpose for the email");
    mutation.mutate({ audience, tone, purpose, notes });
  };

  const output = mutation.data?.text ?? "";

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };
  const download = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader icon={Mail} title="Smart Email Generator" description="Draft professional emails in seconds." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-surface/50 p-6">
          <div className="space-y-2">
            <Label>Audience</Label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Manager, client, team..." />
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Request annual leave" />
          </div>
          <div className="space-y-2">
            <Label>Additional notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
              placeholder="Vacation from 10 July to 18 July, hand-off to teammate, etc." />
          </div>
          <Button onClick={run} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? <><Loader2 className="mr-2 size-4 animate-spin" />Generating</> : "Generate email"}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6">
          <div className="mb-3 flex items-center justify-between">
            <Label>AI output</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" disabled={!output} onClick={copy}><Copy className="size-4" /></Button>
              <Button size="sm" variant="ghost" disabled={!output} onClick={download}><Download className="size-4" /></Button>
              <Button size="sm" variant="ghost" disabled={!purpose || mutation.isPending} onClick={run}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
          {mutation.isPending ? (
            <SkeletonLines />
          ) : output ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-sans text-sm leading-relaxed">
              {output}
            </pre>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="space-y-2">
      {[90, 70, 100, 80, 60, 95].map((w, i) => (
        <div key={i} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
function EmptyState() {
  return (
    <div className="grid h-48 place-items-center text-center text-sm text-muted-foreground">
      Your generated email will appear here.
    </div>
  );
}
