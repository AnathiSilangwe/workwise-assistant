import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("history")
      .select("id, feature, title, prompt, response, favorite, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("history")
      .select("id, feature, title, prompt, response, favorite, created_at")
      .eq("favorite", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), favorite: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("history")
      .update({ favorite: data.favorite })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHistoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("history").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Aggregated productivity stats: counts per feature, 7-day timeseries, totals. */
export const getStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const { data, error } = await context.supabase
      .from("history")
      .select("feature, created_at")
      .gte("created_at", since.toISOString());
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const byFeature: Record<string, number> = { email: 0, summary: 0, planner: 0, research: 0 };
    const byDay = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of rows) {
      byFeature[r.feature] = (byFeature[r.feature] ?? 0) + 1;
      const k = new Date(r.created_at).toISOString().slice(0, 10);
      if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }

    const { count: totalCount } = await context.supabase
      .from("history")
      .select("*", { count: "exact", head: true });

    const totalWeek = rows.length;
    // ~3 min saved per AI output, surfaced in hours
    const hoursSaved = Math.round((totalWeek * 3) / 6) / 10;

    return {
      totalWeek,
      totalAll: totalCount ?? 0,
      hoursSaved,
      byFeature,
      timeseries: Array.from(byDay.entries()).map(([date, count]) => ({ date, count })),
    };
  });
