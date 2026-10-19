// Creates the tables if they don't exist. Runs during every Vercel build.
import pg from "pg";
if (!process.env.DATABASE_URL) { console.log("no DATABASE_URL, skipping migration"); process.exit(0); }
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false } });
await c.connect();
await c.query(`
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled story',
  story text not null,
  style text not null default 'drama',
  options jsonb not null default '{}'::jsonb,
  status text not null default 'planning',
  progress jsonb not null default '{}'::jsonb,
  outline jsonb,
  plan jsonb,
  report jsonb,
  youtube jsonb,
  video_url text,
  duration_sec real,
  error text,
  run_id text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stories_status_idx on stories(status, created_at);
`);
await c.end();
console.log("migration ok");
