# Story Studio

Paste a story, get a simple animated video (2D flat cartoon) with voices, captions, music and sound effects.

- **Website** (Next.js on Vercel): paste a story, watch progress, download the video, copy YouTube title/description/tags.
- **Director**: Claude reads the story and writes a scene plan using only parts from the library (`src/lib/director.ts`).
- **Engine** (`engine/`): turns a plan into a video. `lib/*.js` draws people, animals, places, props and effects on a canvas;
  `compile.py` makes the timing, voices (Kokoro, runs locally), lip-sync and soundtrack; `render.py` renders frames in parallel to MP4.
- **Video maker** (`.github/workflows/render.yml`): GitHub Actions checks every 5 minutes, makes waiting videos and publishes them as Releases.

Settings (Vercel → Settings → Environment Variables): `DATABASE_URL` (from Neon), `ANTHROPIC_API_KEY`, `APP_PASSWORD`, optional `CLAUDE_MODEL`.

Try the engine locally: `python engine/compile.py samples/braai.json /tmp/out && python engine/render.py /tmp/out /tmp/out/video.mp4`
