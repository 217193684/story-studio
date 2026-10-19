import { q, type Story, type Outline } from "./db";
import { makeOutline, makeScene } from "./director";

export const STYLES = ["horror", "comedy", "western", "drama", "kids", "romance", "action"] as const;

export async function getStory(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [s] = await q<Story>("select * from stories where id = $1", [id]);
  return s || null;
}

/** Take a 2-minute lease so two browsers/workers never plan the same story at once. */
async function lease(id: string) {
  const [s] = await q<Story>(
    `update stories set progress = jsonb_set(progress, '{lease}', to_jsonb((now() + interval '150 seconds')::text)), updated_at = now()
     where id = $1 and status = 'planning' and (progress->>'lease' is null or (progress->>'lease')::timestamptz < now()) returning *`, [id]);
  return s || null;
}
async function save(id: string, fields: Record<string, unknown>) {
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await q(`update stories set ${sets}, updated_at = now() where id = $1`, [id, ...keys.map((k) => (typeof fields[k] === "object" && fields[k] !== null ? JSON.stringify(fields[k]) : fields[k]))]);
}

/** Does one planning step (outline, or one scene). Returns the story after the step. */
export async function advance(id: string): Promise<Story | null> {
  const s = await lease(id);
  if (!s) return getStory(id);
  const prog = { ...s.progress, lease: undefined } as Record<string, unknown>;
  try {
    if (!s.outline) {
      const o = (await makeOutline(s.story, { title: s.title !== "Untitled story" ? s.title : undefined, style: s.style })) as unknown as Outline;
      if (!Array.isArray(o.scenes) || !o.scenes.length || !Array.isArray(o.cast)) throw new Error("The director's outline came back incomplete");
      await save(id, { outline: o, title: String(o.title || s.title).slice(0, 140), youtube: o.youtube || null, progress: { step: 1, total: o.scenes.length + 1, note: `Planned ${o.scenes.length} scenes` } });
    } else {
      const o = s.outline;
      const i = o.scenes.findIndex((sc) => !sc.body);
      if (i >= 0) {
        const prev = i > 0 ? String((o.scenes[i - 1].body as { end_state?: string })?.end_state || "") : "";
        const body = await makeScene(o, i, prev);
        o.scenes[i].body = body;
        await save(id, { outline: o, progress: { step: i + 2, total: o.scenes.length + 1, note: `Directed scene ${i + 1} of ${o.scenes.length}` } });
      }
      if (o.scenes.every((sc) => sc.body)) {
        const plan = {
          title: o.title || s.title, style: o.style || s.style, subtitle: s.options?.subtitle || "", captions: s.options?.captions !== false,
          narrator: { voice: o.narrator_voice }, cast: o.cast,
          scenes: o.scenes.map((sc) => { const b = sc.body as Record<string, unknown>; return { place: sc.place, time: sc.time, mood: sc.mood, weather: sc.weather, title: sc.title || undefined, props: b.props || [], actors: b.actors || [], beats: b.beats || [] }; }),
        };
        await save(id, { plan, status: "queued", progress: { step: o.scenes.length + 1, total: o.scenes.length + 1, note: "Waiting for the video maker" } });
      }
    }
  } catch (e) {
    const errors = Number(prog.errors || 0) + 1;
    const msg = (e as Error).message.slice(0, 500);
    if (errors >= 3) await save(id, { status: "failed", error: msg, progress: { ...prog, errors } });
    else await save(id, { progress: { ...prog, errors, note: `Retrying: ${msg}` } });
  }
  return getStory(id);
}

export async function oldestPlanning() {
  const [s] = await q<{ id: string }>("select id from stories where status = 'planning' and (progress->>'lease' is null or (progress->>'lease')::timestamptz < now()) order by created_at limit 1");
  return s?.id || null;
}
