/**
 * The director: Claude turns a written story into a scene plan built only from the Story Studio library.
 * Step 1 (outline): title, cast, list of scenes with the exact story text each covers, YouTube details.
 * Step 2 (one call per scene): what is on screen, who says what, who moves where, sounds, effects, camera.
 * Each call is short, so long stories never hit a time limit.
 */
import catalog from "../../engine/catalog.json";

const API = "https://api.anthropic.com/v1/messages";
export const MODEL = () => process.env.CLAUDE_MODEL || "claude-sonnet-5-5";

const C = catalog as unknown as {
  places: string[]; places_meta: Record<string, { spots: Record<string, number>; indoor: boolean }>; poses: string[]; exprs: string[]; outfits: string[];
  hairs: string[]; hats: string[]; beards: string[]; eyes: string[]; hair_colors: string[]; animals: string[]; props: string[]; effects: string[];
  held: string[]; sfx: string[]; moods: string[]; voices: { female: string[]; male: string[] }; animal_poses: string[]; point_effects: string[];
};

const places = C.places.map((p) => `${p}${C.places_meta[p]?.indoor ? " (indoor)" : ""} spots: ${Object.entries(C.places_meta[p]?.spots || {}).map(([k, v]) => `${k}=${v}`).join(", ")}`).join("\n  ");

export const LIBRARY = `THE LIBRARY (use ONLY these exact names):
PLACES (x positions 0=left edge, 1=right edge; named spots you may use instead of numbers):
  ${places}
TIME OF DAY: day, morning, evening, night.   WEATHER: none, rain, snow, fog, dust, leaves, lightning.
MUSIC MOODS (per scene): ${C.moods.join(", ")}.
PEOPLE are built from parts:
  gender: m|f.  age: kid|teen|adult|old.  build: slim|average|big|muscular.  height: short|tall (optional).
  skin: 0..7 (0 = very dark brown, 2 = dark brown, 4 = medium brown, 6 = light, 7 = very fair) — pick what the story implies; mix freely.
  eyes: ${C.eyes.join(", ")}.  hair: ${C.hairs.join(", ")}.  hairColor: ${C.hair_colors.join(", ")}.
  beard: ${C.beards.join(", ")}.  glasses: true|false.  hat: ${C.hats.join(", ")}.
  outfit: ${C.outfits.join(", ")}.
  colors (optional overrides): {"top":"#hex","bottom":"#hex","shoes":"#hex","accent":"#hex"} (accent = tie, vest, headwrap or hijab colour).
  PEOPLE POSES: ${C.poses.join(", ")}.
  FACES: ${C.exprs.join(", ")}.
  THINGS TO HOLD ("hold"): ${C.held.join(", ")}.
ANIMALS & CREATURES (kind): ${C.animals.join(", ")}. Their poses: ${C.animal_poses.join(", ")}. Faces for animals: neutral, happy, scared, angry, sleeping.
PROPS (placed on the ground at x; "front": true draws it in front of characters): ${C.props.join(", ")}.
  place options (scene "options"): yard {"rural": true|false, "houseColor": "#hex"}, lounge {"tv": true|false}, bedroom {"doorOpen": 0..1}, classroom {"board": "text"}, bar/shop {"sign": "text"}.
  prop options: "color", "text" (for sign/tv), "on" (tv/lamp/streetlight/rocket), "open" (door 0..1), "items" (table only: list of food, bottle, cup, glass, book, money, meat), "scale", "flip".
EFFECTS: ${C.effects.join(", ")}. Effects that sit at a character ("at": id): ${C.point_effects.join(", ")}. Others fill the screen.
SOUND EFFECTS: ${C.sfx.join(", ")}.
VOICES: female ${C.voices.female.join(", ")}; male ${C.voices.male.join(", ")}.`;

const OUTLINE_RULES = `You are the director of Story Studio, an app that turns a written story into a simple, charming 2D cartoon (flat shapes, like popular animated story channels on YouTube).
Read the story and plan the video. Return ONLY JSON, no other text:
{
 "title": "short catchy video title",
 "style": "horror|comedy|western|drama|kids|romance|action",
 "narrator_voice": "one voice name",
 "youtube": {"title": "YouTube title, max 90 chars, hooky", "description": "3-6 sentences + a call to subscribe", "tags": ["10-15 tags"]},
 "cast": [ {"id": "lowercase_id", "name": "Shown name", "kind": "human" or an animal kind, ...person parts..., "voice": "voice name"} ],
 "scenes": [ {"place": "...", "time": "...", "mood": "...", "weather": "none", "title": "optional on-screen card like 'Later that night...' or null",
              "summary": "one sentence: what happens", "text": "the EXACT part of the story this scene covers, copied word for word"} ]
}
Rules:
- Cover the WHOLE story, in order. Together the scenes' "text" must contain all of the story. A scene is usually 30-90 seconds of story (about 60-200 words).
- Characters: describe each one with the people parts so they look like the story says (age, gender, skin, hair, clothes). Make every character look different. If the story doesn't say, choose a natural mix of people. Give every speaking character a different voice that fits them.
- Places: pick the closest library place (an abandoned mansion or creepy old house = "haunted_house"; someone's home outside = "yard"). Choose mood for the music and feeling of each scene. Use the story's genre for "style".
- Never use names that are not in the library. If the story needs something that isn't there, use the closest thing.`;

const SCENE_RULES = `You are the director of Story Studio. Turn ONE scene of a story into a beat-by-beat plan for a simple 2D cartoon. Return ONLY JSON:
{"props": [{"type": "...", "x": 0.0}], "actors": [{"id": "...", "x": 0.3, "pose": "stand", "face": "neutral", "facing": "right", "hold": null}], "beats": [ ... ], "end_state": "one sentence: who is where at the end"}
Beat types (one object each, run in order):
 {"say": "narrator" | character id, "text": "...", "face": "...", "pose": "...", "to": "listener id", "offscreen": false}
 {"do": id, "pose": "...", "face": "...", "facing": "left|right|front", "hold": "...", "y": 0.4, "visible": true, "wait": seconds}
 {"move": id, "to": x or spot name or another id, "pose": "walk|run|sneak", "then": "pose after arriving"}
 {"enter": id, "from": "left|right", "to": x, "pose": "walk|run"}      {"exit": id, "to": "left|right", "pose": "walk|run"}
 {"sfx": "sound name"}   {"effect": "name", "at": id or x, "time": seconds}   {"camera": "zoom|wide|shake", "on": id, "amount": 1.5}
 {"prop": "prop type", "move": "left|right|x", "time": seconds} (cars drive away)   {"prop": "table", "set": {"items": []}}
 {"place": {"tv": false}} (change place options: tv, doorOpen 0..1, sign text)   {"wait": seconds}
 Add "with": true to a beat to make it happen at the same time as the beat before it.
How to direct:
- Use the scene text faithfully: narration lines keep the author's words; dialogue goes to the character who says it. Split long narration into lines of at most ~30 words. Do not skip any of the scene text.
- Drop speech tags: never make a line that is only "he said", "she asked", "Gogo shouted" etc. The caption already shows who is speaking. Fold the action into the beat instead (e.g. "with her hands on her hips" becomes pose "angry").
- SHOW what the words describe. If the text mentions a character, animal or object at a moment, it must be visible then: put it in "actors"/"props", or "enter" it, or reveal it with {"do": id, "visible": true}. The punchline of a story must be on screen. Add extra unnamed cast (more chickens, people in a crowd, other dogs) when the text implies them; give them ids like "chicken2".
- Height: "y" lifts a character off the ground, as a fraction of the screen height. On a roof y≈0.35-0.45 (stand them over the house), on a table y≈0.15, in a tree y≈0.3. You can set "y" in "actors", in "do", and in "move" (to climb or jump down).
- Make it ALIVE: characters react while others talk (faces, poses), walk to each other, enter and exit, use props. Add sound effects where the story implies them (knock, door_open, phone_ring, footsteps, thunder, laugh_track for comedy, sting for scares). Use effects for big moments (exclamation, question, hearts, shock, pow, sweat). Use camera zoom for dramatic lines, then camera wide.
- Animals always need "kind" (e.g. "chicken") in the cast, and a "color" (hex) when the story describes them ("a fat brown chicken" = "color": "#8b4513"). Extra animals too: {"id": "chicken2", "name": "Chicken", "kind": "chicken"}.
- Horror faces: when a character is possessed, a demon, or the text says their eyes turn black, use face "possessed" (fully black eyes) and keep giving them "possessed" on every later beat until the story says otherwise. Use "evil" for a sinister grin with normal eyes. The scariest line of a scene deserves a camera zoom on that face.
- An abandoned / creepy mansion or old house is the place "haunted_house", never "street".
- "door" is only for a door standing in a wall indoors; outside use "shed", "chicken_coop", "rondavel" or the place's own house.
- Big things: vehicles (car, bakkie, taxi, truck) go near an edge (x below 0.15 or above 0.85) or behind the characters with "depth": 0.6, and use "scale": 0.7. Prefer "bakkie" for a pickup. Never park a vehicle in front of the action.
- Places: for someone's home outside (yard, garden, behind the house) use "yard" (options {"rural": true} for a village or farm home like in KZN, {"rural": false} for a township home). Use "farm" only for a real farm.
- Positions: x between 0.08 and 0.92. Keep characters at least 0.12 apart, and at least 0.1 away from props like a fire or table. Characters who are talking should face each other.
- Only characters listed in "actors" are on screen at the start; others must "enter". Characters can only say lines if they are in the cast (or "narrator").
- Use only library names. Faces and poses must come from the lists.`;

type Msg = { role: "user" | "assistant"; content: string };

async function claude(system: string, messages: Msg[], maxTokens = 8000) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set in Vercel");
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL(), max_tokens: maxTokens, system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], messages }),
    });
    if (res.status === 429 || res.status >= 500) { last = `Claude API ${res.status}`; await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); continue; }
    const body = await res.json();
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${body?.error?.message || JSON.stringify(body).slice(0, 300)}`);
    const text = (body.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    return { text, usage: body.usage };
  }
  throw new Error(last || "Claude API failed");
}

export function parseJson<T>(text: string): T {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const s = t.indexOf("{"), e = t.lastIndexOf("}");
  return JSON.parse(t.slice(s, e + 1)) as T;
}

export async function makeOutline(story: string, hints: { title?: string; style?: string }) {
  const user = `${hints.style ? `Preferred style: ${hints.style}\n` : ""}${hints.title ? `Working title: ${hints.title}\n` : ""}STORY:\n"""\n${story}\n"""`;
  const { text } = await claude(`${OUTLINE_RULES}\n\n${LIBRARY}`, [{ role: "user", content: user }], 12000);
  return parseJson<Record<string, unknown>>(text);
}

export async function makeScene(outline: { cast: unknown[]; scenes: Record<string, unknown>[]; style?: string }, i: number, prevEnd: string) {
  const sc = outline.scenes[i];
  const user = `STYLE: ${outline.style}\nCAST:\n${JSON.stringify(outline.cast)}\n\nSCENE ${i + 1} of ${outline.scenes.length}: place=${sc.place}, time=${sc.time}, mood=${sc.mood}\nSummary: ${sc.summary}\n${prevEnd ? `End of the previous scene: ${prevEnd}\n` : ""}SCENE TEXT:\n"""\n${sc.text}\n"""`;
  const { text } = await claude(`${SCENE_RULES}\n\n${LIBRARY}`, [{ role: "user", content: user }], 10000);
  return parseJson<{ props?: unknown[]; actors?: unknown[]; beats?: unknown[]; end_state?: string }>(text);
}
