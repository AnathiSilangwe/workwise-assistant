import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listThreads,
  createThread,
  deleteThread,
  renameThread,
  getThreadMessages,
} from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/chat")({
  ssr: false,
  head: () => ({ meta: [{ title: "AI Chat — WorkWise AI" }] }),
  component: ChatPage,
});

function ChatPage() {
  const qc = useQueryClient();
  const fetchThreads = useServerFn(listThreads);
  const newThread = useServerFn(createThread);
  const removeThread = useServerFn(deleteThread);
  const editThread = useServerFn(renameThread);
  const fetchMessages = useServerFn(getThreadMessages);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchThreads(),
  });

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].id);
  }, [threads, activeId]);

  const createMut = useMutation({
    mutationFn: () => newThread({ data: {} }),
    onSuccess: (row: any) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      setActiveId(row.id);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeThread({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (activeId === id) setActiveId(null);
      setDeleteId(null);
      toast.success("Chat deleted");
    },
  });

  const renameMut = useMutation({
    mutationFn: (vars: { id: string; title: string }) => editThread({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      setRenameTarget(null);
      toast.success("Renamed");
    },
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Threads sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/30 md:flex">
        <div className="border-b border-border p-3">
          <Button onClick={() => createMut.mutate()} className="w-full" size="sm">
            <Plus className="mr-2 size-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threadsLoading ? (
            <div className="p-3 text-xs text-muted-foreground">Loading…</div>
          ) : threads.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No conversations yet.</div>
          ) : (
            <ul className="space-y-1">
              {threads.map((t: any) => (
                <li key={t.id}>
                  <button
                    onClick={() => setActiveId(t.id)}
                    className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                      activeId === t.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{t.title}</span>
                    <span
                      className="hidden gap-0.5 group-hover:flex"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        role="button"
                        className="rounded p-1 hover:bg-background"
                        onClick={() => {
                          setRenameTarget({ id: t.id, title: t.title });
                          setRenameValue(t.title);
                        }}
                      >
                        <Pencil className="size-3" />
                      </span>
                      <span
                        role="button"
                        className="rounded p-1 hover:bg-background"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Conversation */}
      <div className="flex flex-1 flex-col">
        {activeId ? (
          <Conversation
            key={activeId}
            threadId={activeId}
            fetchInitial={() => fetchMessages({ data: { threadId: activeId } })}
          />
        ) : (
          <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
            <div>
              <MessageSquare className="mx-auto mb-3 size-8 opacity-40" />
              <p>Start a new conversation</p>
              <Button className="mt-4" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="mr-2 size-4" />New chat</>}
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the conversation and its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename chat</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button
              disabled={!renameValue.trim() || renameMut.isPending}
              onClick={() => renameTarget && renameMut.mutate({ id: renameTarget.id, title: renameValue.trim() })}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Conversation({
  threadId,
  fetchInitial,
}: {
  threadId: string;
  fetchInitial: () => Promise<any[]>;
}) {
  const [initial, setInitial] = useState<any[] | null>(null);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitial().then((rows) => {
      setInitial(
        rows.map((r: any) => ({
          id: r.id,
          role: r.role,
          parts: [{ type: "text", text: r.content }],
        })),
      );
    });
  }, [threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ messages }) => {
          const { data } = await supabase.auth.getSession();
          return {
            body: { messages, threadId },
            headers: {
              "Content-Type": "application/json",
              ...(data.session?.access_token
                ? { Authorization: `Bearer ${data.session.access_token}` }
                : {}),
            },
          };
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  useEffect(() => {
    if (initial) setMessages(initial as any);
  }, [initial, setMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {initial === null ? (
            <div className="text-center text-sm text-muted-foreground">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="grid place-items-center py-20 text-center text-sm text-muted-foreground">
              <MessageSquare className="mb-3 size-8 opacity-40" />
              <p>Ask anything — meeting prep, drafts, summaries.</p>
            </div>
          ) : (
            messages.map((m: any) => {
              const text = (m.parts ?? [])
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join("");
              return (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role !== "user" && (
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface border border-border"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{text}</p>
                    ) : (
                      <article className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{text || "…"}</ReactMarkdown>
                      </article>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {status === "submitted" && (
            <div className="flex gap-3">
              <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">AI</div>
              <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm">
                <Loader2 className="size-3.5 animate-spin" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t border-border bg-background/80 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e as any);
              }
            }}
            placeholder="Message WorkWise AI…"
            rows={1}
            className="min-h-[44px] resize-none"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || status === "streaming" || status === "submitted"}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </>
  );
}
