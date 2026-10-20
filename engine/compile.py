"""Story Studio — turns a scene plan (JSON) into a timed story (D.json) plus its full soundtrack (mix.wav).

Plan format (what the AI director writes):
{ "title": "...", "style": "horror|comedy|western|drama|kids|romance|action",
  "narrator": {"voice": "bm_george"},
  "cast": [{"id": "thando", "name": "Thando", "kind": "human", "gender": "f", "age": "adult", "skin": 2, "hair": "braids",
            "outfit": "casual", "voice": "af_heart"}, {"id": "rex", "name": "Rex", "kind": "dog"}],
  "scenes": [{"place": "lounge", "time": "night", "mood": "scary", "weather": "rain", "title": "Later that night...",
              "options": {"tv": true}, "props": [{"type": "lamp", "x": .9}],
              "actors": [{"id": "thando", "x": .3, "pose": "sitfront", "face": "happy"}],
              "beats": [{"say": "narrator", "text": "..."}, {"say": "thando", "text": "...", "face": "scared"},
                        {"move": "thando", "to": .7, "pose": "walk"}, {"enter": "rex", "from": "right", "to": .6},
                        {"exit": "rex", "to": "left", "pose": "run"}, {"do": "thando", "pose": "cheer", "face": "laugh"},
                        {"sfx": "knock"}, {"effect": "hearts", "at": "thando"}, {"camera": "zoom", "on": "thando"},
                        {"prop": "car", "move": "right"}, {"wait": 1.5}, {"with": true, ...}] }] }
"""
import difflib, hashlib, json, os, re, subprocess, sys, urllib.error, urllib.request
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sound

FPS, SR = 30, sound.SR
CAT = json.loads((HERE / "catalog.json").read_text())
VOICE_DIR = Path("/tmp/tts")
FEMALE = ["af_heart", "af_bella", "bf_emma", "af_nicole", "af_sarah", "bf_isabella", "af_nova", "af_river", "af_jessica", "bf_alice", "af_kore", "bf_lily"]
MALE = ["am_michael", "bm_george", "am_adam", "bm_lewis", "am_eric", "am_onyx", "am_liam", "bm_daniel", "am_puck", "bm_fable", "am_echo", "am_fenrir"]

# Narration voice: ElevenLabs (paid, natural) if a key is set in the environment, otherwise the free
# local Kokoro voice. Nothing else in the pipeline needs to know which one is in use — the FEMALE/MALE
# name lists above stay the same either way; we just map each name to a matching ElevenLabs voice when
# a key is present.
ELEVEN_KEY = os.environ.get("ELEVENLABS_API_KEY")
ELEVEN_MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_turbo_v2_5")
_EL_VOICES = None


def _eleven_voice_catalog():
    """Fetches the account's available voices once per run and splits them by gender."""
    global _EL_VOICES
    if _EL_VOICES is not None: return _EL_VOICES
    req = urllib.request.Request("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": ELEVEN_KEY})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ElevenLabs voice list failed: {e.code} {e.read()[:300]!r} — check ELEVENLABS_API_KEY") from e
    voices = data.get("voices", [])
    fem = [v["voice_id"] for v in voices if (v.get("labels") or {}).get("gender", "").lower() == "female"]
    male = [v["voice_id"] for v in voices if (v.get("labels") or {}).get("gender", "").lower() == "male"]
    if not fem: fem = [v["voice_id"] for v in voices[::2]] or ["21m00Tcm4TlvDq8ikWAM"]
    if not male: male = [v["voice_id"] for v in voices[1::2]] or ["pNInz6obpgDQGcFmaJgB"]
    _EL_VOICES = {"female": fem, "male": male}
    return _EL_VOICES


def _eleven_voice_id(name):
    cat = _eleven_voice_catalog()
    if name in FEMALE: return cat["female"][FEMALE.index(name) % len(cat["female"])]
    if name in MALE: return cat["male"][MALE.index(name) % len(cat["male"])]
    return cat["female"][0]


def _eleven_tts(text, voice_id, speed):
    body = json.dumps({"text": text, "model_id": ELEVEN_MODEL,
                        "voice_settings": {"stability": .45, "similarity_boost": .8, "style": .4, "use_speaker_boost": True, "speed": round(float(speed), 2)}}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}", data=body, method="POST",
                                  headers={"xi-api-key": ELEVEN_KEY, "accept": "audio/mpeg", "content-type": "application/json"})
    try:
        return urllib.request.urlopen(req, timeout=60).read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"ElevenLabs speech failed: {e.code} {e.read()[:300]!r}") from e
ALL_VOICES = FEMALE + MALE + ["af_sky", "af_alloy", "af_aoede", "am_santa"]
NARRATOR = {"horror": "bm_george", "comedy": "am_puck", "western": "am_onyx", "kids": "af_heart", "drama": "bf_emma", "romance": "af_bella", "action": "am_fenrir"}
STYLE_MOOD = {"horror": "scary", "comedy": "comedy", "western": "western", "kids": "kids", "drama": "calm", "romance": "romantic", "action": "action"}
POINT_EFFECTS = {"hearts", "stars", "sparkle", "magic", "music", "question", "exclamation", "anger", "sweat", "zzz", "knock", "pow", "boom", "shock", "explosion", "smoke", "fire", "tears", "bubbles"}
EFFECT_SFX = {"knock": "knock", "pow": "punch", "boom": "explosion", "explosion": "explosion", "lightning": "thunder", "magic": "magic", "sparkle": "magic", "shock": "sting", "money_rain": "cash", "exclamation": "pop", "hearts": "magic", "flash": "whoosh"}
MOOD_ALIASES = {"spooky": "scary", "horror": "scary", "creepy": "scary", "funny": "comedy", "suspense": "tense", "suspenseful": "tense", "happy": "happy", "sad": "sad", "love": "romantic", "romance": "romantic", "fight": "action", "exciting": "action", "club": "party", "dance": "party", "peaceful": "calm", "neutral": "calm", "mysterious": "mystery", "angry": "tense", "western": "western", "kids": "kids", "silent": "silent"}


ALIASES = {
    "face": {"smiling": "happy", "smile": "happy", "joy": "happy", "glad": "happy", "laughing": "laugh", "crying": "cry", "upset": "sad", "unhappy": "sad", "mad": "angry",
             "furious": "angry", "annoyed": "angry", "terrified": "scared", "afraid": "scared", "fear": "scared", "frightened": "scared", "surprise": "surprised",
             "amazed": "shocked", "calm": "neutral", "tired": "sleepy", "asleep": "sleeping", "in_love": "love", "loving": "love", "curious": "thinking",
             "puzzled": "confused", "sly": "smug", "cheeky": "smug", "anxious": "nervous", "embarrassed": "embarrassed", "disgust": "disgusted", "grumpy": "angry",
             "demonic": "possessed", "demon": "possessed", "black_eyes": "possessed", "possession": "possessed", "menacing": "evil", "sinister": "evil", "creepy": "evil"},
    "pose": {"standing": "stand", "walking": "walk", "running": "run", "sitting": "sit", "seated": "sit", "lying": "lie", "lying_down": "lie", "sleeping": "sleep",
             "pointing": "point", "waving": "wave", "crying": "cry", "laughing": "laugh", "dancing": "dance", "jumping": "jump", "thinking": "think",
             "hands_on_hips": "angry", "arms_crossed": "angry", "celebrate": "cheer", "celebrating": "cheer", "shocked": "armsup", "surprised": "armsup",
             "sneaking": "sneak", "kneeling": "kneel", "praying": "pray", "fighting": "fight", "punch": "fight", "falling": "fall", "drinking": "drink",
             "eating": "eat", "reading": "read", "singing": "sing", "calling": "phone", "on_phone": "phone", "hiding": "hide", "talking": "talk", "shooting": "shoot"},
}


SPEECH_TAG = re.compile(r"^\W*(he|she|they|i|we|you|it|[A-Z][\w']*(\s[A-Z][\w']*)?)\s+(said|asked|shouted|whispered|replied|added|called|yelled|laughed|cried|answered|screamed|muttered|told \w+)\W*$", re.I)


class Report:
    def __init__(self): self.items = []
    def swap(self, what, asked, used):
        if asked and asked != used: self.items.append(f"{what} '{asked}' isn't in the library yet, used '{used}'")


def nearest(val, options, what, rep, default=None):
    if val is None or val == "": return default
    v = str(val).strip().lower().replace(" ", "_").replace("-", "_")
    v = ALIASES.get(what, {}).get(v, v)
    if v in options: return v
    m = difflib.get_close_matches(v, options, n=1, cutoff=.55)
    used = m[0] if m else (default if default is not None else options[0])
    rep.swap(what, val, used); return used


_eleven_down = False  # once ElevenLabs fails once in a run (quota, bad key, outage), stop retrying it and use the free voice


def _kokoro_tts(text, voice, bspeed, f):
    from kokoro_onnx import Kokoro
    global _K
    if "_K" not in globals(): _K = Kokoro(str(VOICE_DIR / "kokoro-v1.0.int8.onnx"), str(VOICE_DIR / "voices-v1.0.bin"))
    lang = "en-gb" if voice.startswith("b") else "en-us"
    s, sr = _K.create(text, voice=voice, speed=bspeed, lang=lang)
    sf.write(f, s, sr)


def tts(text, voice, speed, pitch=1.0):
    """Returns float32 audio at SR. Cached on disk. Uses ElevenLabs when ELEVENLABS_API_KEY is set and working, else free Kokoro."""
    global _eleven_down
    use_eleven = bool(ELEVEN_KEY) and not _eleven_down
    backend = "el" if use_eleven else "ko"
    key = hashlib.sha1(f"{backend}|{voice}|{speed}|{pitch}|{text}".encode()).hexdigest()[:16]
    cache = HERE / ".cache"; cache.mkdir(exist_ok=True); f = cache / f"{key}.wav"
    if not f.exists():
        bspeed = max(.5, min(2., speed / pitch))
        if use_eleven:
            try:
                vid = _eleven_voice_id(voice)
                mp3 = _eleven_tts(text, vid, max(.7, min(1.2, bspeed)))
                tmp = cache / f"{key}.mp3"; tmp.write_bytes(mp3)
                subprocess.run(["ffmpeg", "-y", "-i", str(tmp), "-ar", "24000", "-ac", "1", str(f)], check=True, capture_output=True)
                tmp.unlink(missing_ok=True)
            except Exception as e:
                print(f"ElevenLabs voice failed ({e}); using the free voice for the rest of this video.")
                _eleven_down = True
                return tts(text, voice, speed, pitch)  # retry this line on Kokoro, with its own cache key
        else:
            _kokoro_tts(text, voice, bspeed, f)
    a, sr = sf.read(f)
    if pitch != 1.0:  # resample: raises/lowers pitch (speed was pre-compensated above)
        idx = np.arange(0, len(a), pitch); a = np.interp(idx, np.arange(len(a)), a)
    a = np.interp(np.arange(0, len(a) * SR / sr) * sr / SR, np.arange(len(a)), a).astype(np.float32)
    nz = np.where(np.abs(a) > .01)[0]
    if len(nz): a = a[max(0, nz[0] - int(.03 * SR)): nz[-1] + int(.1 * SR)]
    return a


def word_times(text, s, e):
    ws = text.split()
    if not ws: return []
    wts = [len(re.sub(r"\W", "", w)) + 2 + (5 if w[-1] in ".!?" else 2 if w[-1] in ",:;" else 0) for w in ws]
    tot = sum(wts); a, b = s + .04, e - .04; cur = a; out = []
    for w, q in zip(ws, wts):
        d = (b - a) * q / tot; out.append([w, round(cur, 3), round(cur + d * .85, 3)]); cur += d
    return out


def mouth_env(a):
    n = int(len(a) / SR * FPS) + 1
    env = np.array([np.sqrt(np.mean(a[int(i / FPS * SR): int((i + 1) / FPS * SR)] ** 2) + 1e-12) if int(i / FPS * SR) < len(a) else 0 for i in range(n)])
    env = env / (np.percentile(env, 95) + 1e-6)
    env = np.clip((env - .12) * 1.3, 0, 1)
    return [round(float(x), 2) for x in env]


ANIMAL_WORDS = None


def guess_kind(c):
    """A cast member without a kind whose id or name is an animal word (chicken2, 'Dog') is that animal, not a person."""
    global ANIMAL_WORDS
    if ANIMAL_WORDS is None: ANIMAL_WORDS = sorted(CAT["animals"], key=len, reverse=True) + ["hen", "puppy", "kitten", "cattle", "bird"]
    txt = f"{c.get('id', '')} {c.get('name', '')}".lower()
    for a in ANIMAL_WORDS:
        if re.search(rf"\b{a}s?\d*\b", txt.replace("_", " ")):
            return {"hen": "chicken", "kitten": "cat", "cattle": "cow"}.get(a, a)
    return None


def norm_cast(c, rep, idx):
    kind = str(c.get("kind") or guess_kind(c) or "human").lower()
    if kind not in ("human", "person", "man", "woman", "boy", "girl"):
        kind = nearest(kind, CAT["animals"], "animal", rep, "dog")
    else:
        kind = "human"
    out = {"id": c["id"], "name": c.get("name", c["id"].title()), "kind": kind}
    if kind == "human":
        out["gender"] = "f" if str(c.get("gender", "m")).lower()[:1] in ("f", "w", "g") else "m"
        out["age"] = nearest(c.get("age", "adult"), ["kid", "teen", "adult", "old"], "age", rep, "adult")
        out["build"] = nearest(c.get("build", "average"), ["slim", "average", "big", "muscular"], "body", rep, "average")
        if c.get("height"): out["height"] = c["height"]
        sk = c.get("skin", 3)
        if isinstance(sk, str):
            sk = {"very dark": 0, "dark": 1, "brown": 3, "medium": 4, "tan": 5, "light": 6, "fair": 7, "pale": 7, "black": 1, "white": 7, "asian": 6, "indian": 4, "coloured": 4}.get(sk.lower(), 3)
        out["skin"] = int(max(0, min(7, sk)))
        out["hair"] = nearest(c.get("hair", "short"), CAT["hairs"], "hair", rep, "short")
        hc = c.get("hairColor") or c.get("hair_color") or ("grey" if out["age"] == "old" else "black")
        out["hairColor"] = hc if str(hc).startswith("#") else nearest(hc, CAT["hair_colors"], "hair colour", rep, "black")
        out["eyes"] = nearest(c.get("eyes", "round"), CAT["eyes"], "eyes", rep, "round")
        out["beard"] = nearest(c.get("beard", "none"), CAT["beards"], "beard", rep, "none")
        out["glasses"] = bool(c.get("glasses"))
        out["outfit"] = nearest(c.get("outfit", "casual"), CAT["outfits"], "outfit", rep, "casual")
        if c.get("hat"): out["hat"] = nearest(c["hat"], CAT["hats"], "hat", rep, "none")
        if c.get("colors"): out["colors"] = c["colors"]
    else:
        if c.get("color"): out["color"] = c["color"]
        if c.get("size"): out["size"] = c["size"]
    out["color_tag"] = ["#F59E0B", "#2DD4BF", "#F472B6", "#60A5FA", "#A3E635", "#FB923C", "#C084FC", "#F87171", "#34D399", "#FACC15"][idx % 10]
    return out


def pick_voices(cast, plan):
    used, res = set(), {}
    for c in cast:
        v = c.get("voice")
        if v in ALL_VOICES and v not in used: res[c["id"]] = v; used.add(v); continue
    for c in cast:
        if c["id"] in res: continue
        pool = FEMALE if c.get("gender") == "f" else MALE
        if c["kind"] != "human": pool = MALE if hash(c["id"]) % 2 else FEMALE
        v = next((x for x in pool if x not in used), pool[0]); res[c["id"]] = v; used.add(v)
    return res


def voice_params(c):
    if c["kind"] == "human":
        return {"kid": (1.0, 1.18), "teen": (1.0, 1.06), "old": (.88, .95)}.get(c.get("age"), (1.0, 1.0))
    if c["kind"] in ("ghost", "monster"): return (.85, .82)
    if c["kind"] in ("robot",): return (.95, .9)
    if c["kind"] in ("puppy", "cat", "rabbit", "bird", "chicken", "duck", "mouse"): return (1.0, 1.2)
    if c["kind"] in ("elephant", "bull", "lion", "cow", "horse"): return (.92, .86)
    return (1.0, 1.05)


def compile_plan(plan, out_dir, log=print):
    out_dir = Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    rep = Report()
    style = nearest(plan.get("style", "drama"), list(NARRATOR), "style", rep, "drama")
    cast_list = [norm_cast(c, rep, i) for i, c in enumerate(plan.get("cast", []))]
    cast = {c["id"]: c for c in cast_list}
    voices = pick_voices(cast_list, plan)
    nv = (plan.get("narrator") or {}).get("voice") or NARRATOR[style]
    if nv not in ALL_VOICES: nv = NARRATOR[style]
    captions, talk, voice_clips, sfx_events, music_segs, scenes = [], {}, [], [], [], []
    intro, outro = 3.2, 3.5
    T = 0.0
    auto_cam = plan.get("camera", "auto") != "off"

    def spot_x(scene_place, v, cur=None):
        if isinstance(v, (int, float)): return float(max(-.3, min(1.3, v)))
        if isinstance(v, str):
            sp = CAT["places_meta"].get(scene_place, {}).get("spots", {})
            if v in sp: return sp[v]
            if cur and v in cur: return min(.95, cur[v]["x"] + .14) if cur[v]["x"] < .5 else max(.05, cur[v]["x"] - .14)
            return {"left": .2, "center": .5, "middle": .5, "right": .8, "far_left": .08, "far_right": .92}.get(v, .5)
        return .5

    for si, S in enumerate(plan.get("scenes", [])):
        place = nearest(S.get("place", "street"), CAT["places"], "place", rep, "street")
        tod = nearest(S.get("time", "day"), ["day", "morning", "evening", "night"], "time of day", rep, "day")
        mood = MOOD_ALIASES.get(str(S.get("mood", "")).lower(), None) or (S.get("mood") if S.get("mood") in sound.RECIPES else STYLE_MOOD[style])
        if S.get("music"): mood = MOOD_ALIASES.get(S["music"], S["music"]) if (MOOD_ALIASES.get(S["music"], S["music"]) in sound.RECIPES or S["music"] == "silent") else mood
        weather = S.get("weather") if S.get("weather") in ("rain", "snow", "fog", "dust", "leaves", "lightning") else None
        start = T
        sc = {"start": start, "place": place, "tod": tod, "mood": mood if mood != "tense" or True else mood, "weather": weather, "opts": S.get("options", {}),
              "title": S.get("title"), "props": [], "propEvents": [], "actors": {}, "camera": [], "effects": []}
        for p in S.get("props", []):
            pt = nearest(p.get("type"), CAT["props"], "prop", rep, "box")
            if pt in ("truck", "bus", "taxi", "ambulance", "police_car", "car", "bakkie", "boat", "rocket"):
                if p.get("scale") is None: p = {**p, "scale": .62}
                if p.get("depth") is None and .2 < float(p.get("x", .5) if isinstance(p.get("x", .5), (int, float)) else .5) < .8: p = {**p, "depth": .6}
            sc["props"].append({"type": pt, "x": spot_x(place, p.get("x", .5)), "front": bool(p.get("front")), "color": p.get("color"), "text": p.get("text"),
                                "scale": p.get("scale", 1), "depth": p.get("depth", 0), "on": p.get("on", True), "open": p.get("open", 0), "flip": p.get("flip", False), "items": p.get("items")})
        cur = {}
        for a in S.get("actors", []):
            aid = a["id"]
            if aid not in cast: cast[aid] = norm_cast({"id": aid, "name": a.get("name", aid)}, rep, len(cast)); voices[aid] = MALE[len(voices) % len(MALE)]
            init = {"x": spot_x(place, a.get("x", .5)), "pose": nearest(a.get("pose", "stand"), CAT["poses"], "pose", rep, "stand"),
                    "expr": nearest(a.get("face", "neutral"), CAT["exprs"], "face", rep, "neutral"), "facing": a.get("facing") or ("right" if spot_x(place, a.get("x", .5)) < .5 else "left"),
                    "hold": nearest(a.get("hold"), CAT["held"], "held item", rep) if a.get("hold") else None, "visible": a.get("visible", True), "depth": a.get("depth", 0), "y": float(a.get("y", 0) or 0)}
            if cast[aid]["kind"] != "human" and init["pose"] not in ("stand", "walk", "run", "sit", "lie", "sleep", "eat", "jump", "fly"): init["pose"] = "stand"
            sc["actors"][aid] = {"init": init, "events": []}; cur[aid] = dict(init)

        def ensure(aid, at):
            if aid not in cast: cast[aid] = norm_cast({"id": aid}, rep, len(cast)); voices[aid] = MALE[len(voices) % len(MALE)]
            if aid not in sc["actors"]:
                init = {"x": -.2, "pose": "stand", "expr": "neutral", "facing": "right", "hold": None, "visible": False, "depth": 0}
                sc["actors"][aid] = {"init": init, "events": []}; cur[aid] = dict(init)

        def ev(aid, at, **kw):
            sc["actors"][aid]["events"].append({"t": round(at, 3), "type": "set", **kw}); cur[aid].update({k: v for k, v in kw.items()})

        def pose_for(aid, p):
            if cast[aid]["kind"] != "human":
                return p if p in ("stand", "walk", "run", "sit", "lie", "sleep", "eat", "jump", "fly", "talk") else "stand"
            return nearest(p, CAT["poses"], "pose", rep, "stand")

        cursor = start + .55 + (intro if si == 0 else 0) + (2.3 if S.get("title") else 0)
        prev_start = cursor
        for b in S.get("beats", []):
            bs = prev_start if b.get("with") else cursor
            dur = .2
            if "say" in b:
                who = b["say"]; text = str(b.get("text", "")).strip()
                if not text or SPEECH_TAG.match(text): continue
                if who is None or str(who).lower() in ("narrator", "narration", "voiceover"):
                    a = tts(text, nv, .96 if style != "horror" else .9)
                    voice_clips.append((bs + .05, a, 1.0))
                    captions.append({"t0": round(bs + .05, 3), "t1": round(bs + .05 + len(a) / SR, 3), "narrator": True, "words": word_times(text, bs + .05, bs + .05 + len(a) / SR)})
                    if auto_cam: sc["camera"].append({"t": round(bs, 3), "zoom": 1.0, "cx": .5, "cy": .55, "dur": 1.2})
                    dur = len(a) / SR + .45
                else:
                    ensure(who, bs)
                    off = bool(b.get("offscreen"))
                    if not off and not cur[who].get("visible", True): ev(who, bs, visible=True)
                    c = cast[who]; sp, pitch = voice_params(c)
                    a = tts(text, voices[who], sp * float(b.get("speed", 1)), pitch)
                    voice_clips.append((bs + .05, a, 1.0))
                    if not off: talk.setdefault(who, []).append([round(bs + .05, 3), FPS, mouth_env(a)])
                    captions.append({"t0": round(bs + .05, 3), "t1": round(bs + .05 + len(a) / SR, 3), "name": c["name"], "color": c["color_tag"], "words": word_times(text, bs + .05, bs + .05 + len(a) / SR)})
                    kw = {}
                    if b.get("face"): kw["expr"] = nearest(b["face"], CAT["exprs"], "face", rep, "neutral")
                    if b.get("pose"): kw["pose"] = pose_for(who, b["pose"])
                    elif c["kind"] == "human" and cur[who]["pose"] in ("stand", "idle"): kw["pose"] = "talk"
                    if b.get("hold"): kw["hold"] = nearest(b["hold"], CAT["held"], "held item", rep)
                    # face whoever they talk to (or the nearest other character)
                    others = [o for o in cur if o != who and cur[o].get("visible", True)]
                    tgt = b.get("to") if b.get("to") in cur else (min(others, key=lambda o: abs(cur[o]["x"] - cur[who]["x"])) if others else None)
                    if b.get("facing"): kw["facing"] = b["facing"]
                    elif tgt is not None and cur[who]["pose"] not in ("sitfront",): kw["facing"] = "right" if cur[tgt]["x"] > cur[who]["x"] else "left"
                    if kw: ev(who, bs, **kw)
                    if kw.get("pose") == "talk" and not b.get("pose"): ev(who, bs + .05 + len(a) / SR + .1, pose="stand")
                    if auto_cam and not off: sc["camera"].append({"t": round(bs, 3), "zoom": 1.16, "cx": max(.3, min(.7, cur[who]["x"])), "cy": .52, "dur": 1.0})
                    dur = len(a) / SR + .4
            elif "do" in b:
                who = b["do"]; ensure(who, bs); kw = {}
                if b.get("pose"): kw["pose"] = pose_for(who, b["pose"])
                if b.get("face"): kw["expr"] = nearest(b["face"], CAT["exprs"], "face", rep, "neutral")
                if b.get("facing") in ("left", "right", "front"): kw["facing"] = b["facing"]
                if "hold" in b: kw["hold"] = nearest(b["hold"], CAT["held"], "held item", rep) if b["hold"] else None
                if b.get("visible") is not None: kw["visible"] = bool(b["visible"])
                if b.get("y") is not None: kw["y"] = float(b["y"])
                if not cur[who].get("visible", True) and kw.get("visible") is None: kw["visible"] = True
                if kw: ev(who, bs, **kw)
                dur = float(b.get("wait", 1.0))
                if kw.get("pose") == "fall": sfx_events.append((bs + .35, "hit", .6))
            elif any(k in b for k in ("move", "enter", "exit")):
                who = b.get("move") or b.get("enter") or b.get("exit"); ensure(who, bs)
                p = pose_for(who, b.get("pose", "walk")); p = p if p in ("walk", "run", "sneak") else "walk"
                x0 = cur[who]["x"]
                if "enter" in b:
                    x0 = -.15 if b.get("from", "left") == "left" else 1.15
                    ev(who, bs, x=x0, visible=True)
                if "exit" in b: x1 = -.18 if b.get("to", "left") == "left" else 1.18
                else: x1 = spot_x(place, b.get("to", .5), cur)
                speed = {"walk": .17, "run": .42, "sneak": .09}[p] * float(b.get("speed", 1))
                d = max(.6, abs(x1 - x0) / speed)
                e = {"t": round(bs, 3), "t1": round(bs + d, 3), "type": "move", "x0": x0, "x1": x1, "pose": p, "after": pose_for(who, b.get("then", "stand"))}
                if b.get("y") is not None: e["y0"] = float(cur[who].get("y", 0) or 0); e["y1"] = float(b["y"]); cur[who]["y"] = e["y1"]
                if "exit" in b: e["hideAfter"] = True
                if b.get("face_after"): e["faceAfter"] = b["face_after"]
                sc["actors"][who]["events"].append(e); cur[who].update({"x": x1, "pose": e["after"], "facing": "right" if x1 > x0 else "left"})
                if "exit" in b: cur[who]["visible"] = False
                if cast[who]["kind"] == "human" and p != "sneak":
                    for k in range(int(d / 1.6) + 1): sfx_events.append((bs + k * 1.6, "footsteps", .1 if p == "walk" else .16))
                if cast[who]["kind"] == "horse": sfx_events.append((bs, "horse", .5))
                dur = d if not b.get("no_wait") else .3
            elif "sfx" in b:
                n = nearest(b["sfx"], sound.SFX_NAMES, "sound", rep, "pop")
                sfx_events.append((bs, n, float(b.get("volume", .8)))); dur = float(b.get("wait", .3))
            elif "effect" in b:
                k = nearest(b["effect"], CAT["effects"], "effect", rep, "sparkle"); ln = float(b.get("time", 2.0))
                e = {"kind": k, "t0": round(bs, 3), "t1": round(bs + ln, 3), "point": k in POINT_EFFECTS}
                if b.get("at") in cast: ensure(b["at"], bs); e["at"] = b["at"]
                elif isinstance(b.get("at"), (int, float)): e["x"] = float(b["at"])
                if b.get("y") is not None: e["y"] = float(b["y"])
                sc["effects"].append(e)
                if k in EFFECT_SFX and not b.get("silent"): sfx_events.append((bs, EFFECT_SFX[k], .7))
                if k == "lightning": sc["effects"][-1]["t1"] = round(bs + max(ln, 4.2), 3)
                dur = float(b.get("wait", .5))
            elif "camera" in b:
                m = b["camera"]; on = b.get("on")
                if m == "shake": sc["camera"].append({"t": round(bs, 3), "shake": float(b.get("time", .6))})
                elif m in ("wide", "reset"): sc["camera"].append({"t": round(bs, 3), "zoom": 1.0, "cx": .5, "cy": .55, "dur": .9})
                else:
                    x = cur[on]["x"] if on in cur else spot_x(place, on if on is not None else .5)
                    sc["camera"].append({"t": round(bs, 3), "zoom": float(b.get("amount", 1.45 if m == "zoom" else 1.2)), "cx": x, "cy": float(b.get("y", .5)), "dur": float(b.get("speed", .9))})
                dur = float(b.get("wait", 0))
            elif "prop" in b:
                ref = b["prop"]; idx = None
                if isinstance(ref, int): idx = ref
                else:
                    pt = nearest(ref, CAT["props"], "prop", rep, "box"); idx = next((i for i, p in enumerate(sc["props"]) if p["type"] == pt), None)
                    if idx is None: sc["props"].append({"type": pt, "x": spot_x(place, b.get("x", .5)), "front": False}); idx = len(sc["props"]) - 1
                pe = {"t": round(bs, 3), "prop": idx}
                if "move" in b:
                    x0 = sc["props"][idx]["x"]; mv = b["move"]; x1 = -.6 if mv == "left" else 1.6 if mv == "right" else spot_x(place, mv)
                    pe.update({"move": True, "x0": x0, "x1": x1, "dur": float(b.get("time", 2.5))})
                    if sc["props"][idx]["type"] in ("car", "taxi", "truck", "police_car", "ambulance", "motorbike"): sfx_events.append((bs, "engine", .5))
                if b.get("set") or b.get("state"): pe["set"] = b.get("set") or b.get("state")
                sc["propEvents"].append(pe); dur = float(b.get("wait", pe.get("dur", .3) if not b.get("no_wait") else .3))
            elif "place" in b and isinstance(b["place"], dict):
                sc["propEvents"].append({"t": round(bs, 3), "place": b["place"]}); dur = float(b.get("wait", .3))
            elif "wait" in b:
                dur = float(b["wait"])
            if b.get("with"): cursor = max(cursor, bs + dur)
            else: cursor = bs + dur; prev_start = bs
        end = cursor + float(S.get("hold", .9))
        sc["end"] = round(end, 3); scenes.append(sc)
        music_segs.append((start, end, mood)); T = end
    total = T + outro
    D = {"W": 1280, "H": 720, "fps": FPS, "total": round(total, 3), "intro": intro, "outro": outro, "title": plan.get("title", "A Story"),
         "subtitle": plan.get("subtitle", ""), "endText": plan.get("end", "The End"), "endSub": plan.get("end_sub", "Subscribe for a new story every week"),
         "cast": cast, "scenes": scenes, "captions": captions, "talk": talk, "captionsOn": plan.get("captions", True), "report": sorted(set(rep.items))}
    # ---- sound
    n = int((total + 1) * SR)
    voice = np.zeros(n, np.float32)
    for at, a, amp in voice_clips: sound.place(voice, a * amp, at)
    pk = np.abs(voice).max()
    if pk > 0: voice *= .9 / pk
    music = sound.music_track(music_segs + [(T, total, music_segs[-1][2] if music_segs else "calm")], total + 1, voice) * .55
    fx = np.zeros(n)
    for at, name, vol in sfx_events: sound.place(fx, sound.sfx(name) * vol, at)
    amb = np.zeros(n)
    for sc in scenes: sound.place(amb, sound.ambience(sc["place"], sc["tod"], sc["weather"], sc["end"] - sc["start"]) * .6, sc["start"])
    mix = voice + music + fx * .5 + amb * .3
    mix = np.tanh(mix * 1.5) * .97
    sf.write(out_dir / "mix.wav", mix.astype(np.float32), SR)
    (out_dir / "D.json").write_text(json.dumps(D))
    log(f"compiled: {len(scenes)} scenes, {len(captions)} lines, {total:.1f}s")
    for r in D["report"]: log("  library: " + r)
    return D


if __name__ == "__main__":
    plan = json.loads(Path(sys.argv[1]).read_text()); compile_plan(plan, sys.argv[2])
