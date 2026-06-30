import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const url = process.env.SUPABASE_URL;
        const pkey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const lkey = process.env.LOVABLE_API_KEY;
        if (!url || !pkey || !lkey) return new Response("Server misconfigured", { status: 500 });

        const supabase = createClient<Database>(url, pkey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
        });
        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { messages?: UIMessage[]; threadId?: string };
        if (!Array.isArray(body.messages) || !body.threadId) {
          return new Response("messages and threadId required", { status: 400 });
        }

        // Verify thread ownership
        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("id", body.threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        // Persist newest user message
        const last = body.messages[body.messages.length - 1];
        if (last?.role === "user") {
          const text = last.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          if (text) {
            await supabase.from("chat_messages").insert({
              thread_id: body.threadId,
              user_id: userId,
              role: "user",
              content: text,
            });
          }
        }

        const provider = createLovableAiGatewayProvider(lkey);
        const result = streamText({
          model: provider(DEFAULT_MODEL),
          system:
            "You are WorkWise AI, a helpful workplace productivity assistant. Be concise, practical, and friendly. Use markdown when helpful.",
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          onFinish: async ({ text }) => {
            if (text?.trim()) {
              await supabase.from("chat_messages").insert({
                thread_id: body.threadId!,
                user_id: userId,
                role: "assistant",
                content: text,
              });
              await supabase
                .from("chat_threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", body.threadId!);
            }
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
      },
    },
  },
});
