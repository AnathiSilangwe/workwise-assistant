import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateEmail } from "@/lib/features.functions";
import { toggleFavorite } from "@/lib/history.functions";
import { OutputActions } from "@/components/output-actions";
import { TypingIndicator, TypewriterText } from "@/components/typing-indicator";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator — WorkWise AI" }] }),
  component: EmailPage,
});

const TONES = ["Professional", "Friendly", "Concise", "Formal", "Persuasive", "Apologetic"];

function EmailPage() {
  const qc = useQueryClient();
  const [audience, setAudience] = useState("Manager");
  const [tone, setTone] = useState("Professional");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [fav, setFav] = useState(false);

  const callFn = useServerFn(generateEmail);
  const favFn = useServerFn(toggleFavorite);
  const mutation = useMutation({
    mutationFn: (vars: { audience: string; tone: string; purpose: string; notes: string }) =>
      callFn({ data: vars }),
    onSuccess: () => { setFav(false); qc.invalidateQueries({ queryKey: ["history"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
    onError: (e: any) => toast.error(e.message ?? "Generation failed"),
  });

  const run = () => {
    if (!purpose.trim()) return toast.error("Add a purpose for the email");
    mutation.mutate({ audience, tone, purpose, notes });
  };

  const output = mutation.data?.text ?? "";
  const historyId = mutation.data?.historyId;

  const onToggleFav = async () => {
    if (!historyId) return;
    const next = !fav;
    setFav(next);
    try {
      await favFn({ data: { id: historyId, favorite: next } });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(next ? "Saved to favorites" : "Removed from favorites");
    } catch {
      setFav(!next);
    }
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
            {mutation.isPending ? "Generating…" : "Generate email"}
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface/50 p-6">
          <div className="mb-3 flex items-center justify-between">
            <Label>AI output</Label>
            <OutputActions
              text={output}
              onRegenerate={run}
              regenerating={mutation.isPending}
              filename="email.txt"
              favorite={fav}
              onToggleFavorite={onToggleFav}
              favoriteDisabled={!historyId}
            />
          </div>
          {mutation.isPending ? (
            <div className="py-6"><TypingIndicator label="Drafting your email" /></div>
          ) : output ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 font-sans text-sm leading-relaxed">
              <TypewriterText text={output} />
            </pre>
          ) : (
            <div className="grid h-48 place-items-center text-center text-sm text-muted-foreground">
              Your generated email will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
