import pg from "pg";

let pool: pg.Pool | null = null;
export function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({ connectionString: url, max: 3, ssl: url.includes("localhost") ? false : { rejectUnauthorized: false } });
  }
  return pool;
}
export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await db().query(sql, params);
  return r.rows as T[];
}

export type Story = {
  id: string; title: string; story: string; style: string; options: Record<string, unknown>; status: string;
  progress: { step?: number; total?: number; note?: string }; outline: Outline | null; plan: Plan | null; report: string[] | null;
  youtube: { title: string; description: string; tags: string[] } | null; video_url: string | null; duration_sec: number | null;
  error: string | null; created_at: string; updated_at: string; claimed_at: string | null;
};
export type Outline = { title: string; style: string; narrator_voice?: string; youtube?: Story["youtube"]; cast: Record<string, unknown>[]; scenes: (Record<string, unknown> & { text?: string; summary?: string })[] };
export type Plan = Record<string, unknown> & { scenes: Record<string, unknown>[] };
