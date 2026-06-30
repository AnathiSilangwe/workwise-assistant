import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway.server";

function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  return createLovableAiGatewayProvider(key)(DEFAULT_MODEL);
}

function handleAiError(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace billing.");
  throw new Error(msg);
}

async function saveHistory(
  supabase: any,
  userId: string,
  feature: "email" | "summary" | "planner" | "research",
  title: string,
  prompt: unknown,
  response: unknown,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("history")
    .insert({
      user_id: userId,
      feature,
      title,
      prompt: prompt as any,
      response: response as any,
    })
    .select("id")
    .single();
  if (error) return null;
  return data?.id ?? null;
}

/* ---------------- EMAIL ---------------- */
const EmailInput = z.object({
  audience: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  tone: z.string().min(1).max(80),
  notes: z.string().max(2000).optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { text } = await generateText({
        model: getGateway(),
        system:
          "You are an HR communication expert. Write a professional email. Always include a clear 'Subject:' line on the first line, then a blank line, then the body. Sign off appropriately. Return ONLY the email — no commentary.",
        prompt: `Audience: ${data.audience}\nTone: ${data.tone}\nPurpose: ${data.purpose}\nExtra Information: ${data.notes || "(none)"}`,
      });
      const id = await saveHistory(context.supabase, context.userId, "email", data.purpose.slice(0, 80), data, { text });
      return { text, historyId: id };
    } catch (e) {
      handleAiError(e);
    }
  });

/* ---------------- SUMMARY ---------------- */
const SummaryInput = z.object({ notes: z.string().min(20).max(20000) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SummaryInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { text } = await generateText({
        model: getGateway(),
        system: `You summarize meeting notes. Return STRICT JSON with this shape and nothing else:
{
  "summary": "2-4 sentence overview",
  "decisions": ["..."],
  "action_items": [{"owner":"name","task":"...","due":"date or empty"}],
  "deadlines": ["..."]
}`,
        prompt: `Summarize these meeting notes:\n\n${data.notes}`,
      });
      const json = extractJson(text);
      const id = await saveHistory(context.supabase, context.userId, "summary", "Meeting summary", data, json);
      return { ...json, historyId: id };
    } catch (e) {
      handleAiError(e);
    }
  });

/* ---------------- PLANNER ---------------- */
const PlannerInput = z.object({
  tasks: z.string().min(3).max(4000),
  workingHours: z.string().min(2).max(120),
});

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { text } = await generateText({
        model: getGateway(),
        system: `You create optimized daily schedules. Prioritize by urgency, importance, and energy level. Return STRICT JSON with this shape and nothing else:
{
  "schedule": [{"time":"8:00","task":"...","priority":"High|Medium|Low"}],
  "tips": ["productivity improvement ..."]
}`,
        prompt: `Working hours: ${data.workingHours}\nTasks (one per line):\n${data.tasks}`,
      });
      const json = extractJson(text);
      const id = await saveHistory(context.supabase, context.userId, "planner", "Daily plan", data, json);
      return { ...json, historyId: id };
    } catch (e) {
      handleAiError(e);
    }
  });

/* ---------------- RESEARCH ---------------- */
const ResearchInput = z.object({ topic: z.string().min(2).max(400) });

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      const { text } = await generateText({
        model: getGateway(),
        system:
          "You are a research assistant. Explain topics simply, in markdown. Include sections: Summary, Key Concepts, Advantages, Disadvantages, Real-world Examples, Further Reading. Limit answer to ~400 words.",
        prompt: `Explain this topic: ${data.topic}`,
      });
      const id = await saveHistory(context.supabase, context.userId, "research", data.topic.slice(0, 80), data, { text });
      return { text, historyId: id };
    } catch (e) {
      handleAiError(e);
    }
  });

function extractJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("AI returned malformed JSON. Please try again.");
  }
}
