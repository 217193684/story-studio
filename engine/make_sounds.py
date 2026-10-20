"""Makes Story Studio's real sound library once, with ElevenLabs Sound Effects, and saves it to engine/sounds/.

Every story then reuses these files, so they cost credits only once. Anything not made yet falls back
to the old code-made sound. Runs in GitHub Actions (workflow "Make sounds") with the ELEVENLABS_API_KEY
secret — the key needs "Sound Effects: Access". Writes engine/sounds/_status.json so we can see what happened.

  python engine/make_sounds.py            # make everything still missing, most important first
  python engine/make_sounds.py knock thunder   # only these
  python engine/make_sounds.py --redo knock    # replace one you didn't like
"""
import json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "sounds"
KEY = os.environ.get("ELEVENLABS_API_KEY")
CLEAN = "single isolated sound effect, clean recording, no music, no voices"

# name -> (prompt, seconds), most important first: background beds play under every scene, then the
# effects stories use most. Names must match sound.SFX_NAMES (effects) or sound.ambience (amb_* beds).
SOUNDS = {
    "amb_room": ("Quiet indoor room tone at night, very soft low hum of a house, calm, almost silent, no music, no voices", 20),
    "amb_night": ("Calm night outdoors ambience, soft distant crickets and a gentle breeze, peaceful, no music, no voices", 20),
    "amb_rain": ("Steady rain falling on a roof and ground, continuous, calm, no thunder, no music, no voices", 20),
    "footsteps": (f"Several slow footsteps walking on a hard floor, {CLEAN}", 3),
    "knock": (f"Three firm knocks on a wooden door, {CLEAN}", 2),
    "door_open": (f"A wooden door slowly opening with a soft creak, {CLEAN}", 2.5),
    "creak": (f"An old wooden floorboard creaking slowly, {CLEAN}", 2),
    "door_slam": (f"A heavy wooden door slamming shut, {CLEAN}", 1.5),
    "sting": ("A short cinematic horror stinger, sudden scary string hit, 2 seconds", 2.5),
    "thunder": ("A loud thunder crack followed by a long rolling rumble, no rain", 6),
    "heartbeat": (f"A slow heavy human heartbeat, four beats, {CLEAN}", 4),
    "scream": ("A woman screaming in fear, short horror scream", 2),
    "evil_laugh": ("A deep sinister evil laugh, villain, menacing", 3),
    "amb_birds": ("Peaceful daytime outdoor ambience with gentle birdsong and a soft breeze, calm, no music, no voices", 20),
    "amb_town": ("Quiet township street daytime ambience, distant traffic, faint far-off voices, calm, no music", 20),
    "amb_wind": ("Soft wind blowing across open land, continuous, calm, no music, no voices", 20),
    "amb_crowd": ("Indoor crowd murmur in a busy restaurant, soft indistinct chatter, no music", 20),
    "phone_ring": (f"A mobile phone ringing, a simple ringtone, {CLEAN}", 3),
    "dog_bark": (f"A dog barking twice, {CLEAN}", 1.5),
    "glass": (f"A glass bottle shattering on the floor, {CLEAN}", 1.5),
    "hit": (f"A body falling and hitting the ground with a thud, {CLEAN}", 1),
    "punch": (f"A single hard punch hit, {CLEAN}", 1),
    "whoosh": (f"A quick soft whoosh swish, {CLEAN}", 1),
    "clock": (f"An old clock ticking steadily, {CLEAN}", 4),
    "wind": (f"A strong gust of wind howling, {CLEAN}", 3),
    "rain": (f"A short burst of heavy rain starting, {CLEAN}", 4),
    "car_horn": (f"A car horn hooting twice, {CLEAN}", 1.5),
    "engine": (f"A car engine starting and driving away, {CLEAN}", 4),
    "siren": (f"A police siren passing by, {CLEAN}", 4),
    "gunshot": (f"A single gunshot, {CLEAN}", 1.5),
    "crash": (f"A loud crash of objects falling and breaking, {CLEAN}", 2),
    "explosion": (f"A big explosion boom with rumble, {CLEAN}", 3),
    "laugh_track": ("A short studio audience laughing, sitcom laugh track", 3),
    "applause": ("A small crowd applauding and cheering", 4),
    "rooster": (f"A rooster crowing in the morning, {CLEAN}", 3),
    "cow_moo": (f"A cow mooing once, {CLEAN}", 2),
    "cat_meow": (f"A cat meowing once, {CLEAN}", 1.5),
    "horse": (f"A horse neighing, {CLEAN}", 2),
    "bell": (f"A church bell ringing once, {CLEAN}", 3),
    "ding": (f"A bright notification ding, {CLEAN}", 1),
    "cash": (f"A cash register cha-ching, {CLEAN}", 1.5),
    "magic": (f"A sparkly magical shimmer chime, {CLEAN}", 2),
    "magic_bad": (f"A dark ominous magic spell sound, {CLEAN}", 2),
    "typing": (f"Fast typing on a computer keyboard, {CLEAN}", 3),
    "drink": (f"Someone drinking from a glass, gulp, {CLEAN}", 1.5),
    "kiss": (f"A short playful kiss sound, {CLEAN}", 1),
    "splash": (f"Something splashing into water, {CLEAN}", 1.5),
    "beep": (f"A short electronic beep, {CLEAN}", .7),
    "pop": (f"A short cartoon pop, {CLEAN}", .6),
    "boing": (f"A cartoon spring boing, {CLEAN}", 1),
    "slide_whistle": (f"A cartoon slide whistle going up, {CLEAN}", 1.2),
    "slide_down": (f"A cartoon slide whistle going down, {CLEAN}", 1.2),
    "wow": ("A small crowd going 'ooooh' in amazement", 2),
}


# Background music, one instrumental track per mood (names match sound.RECIPES). Made with ElevenLabs Music;
# each is looped seamlessly under the narration, so it is kept simple, steady and without vocals.
BG = "instrumental background score for a narrated animated story, steady and consistent all the way through, no vocals, no big drops, no ending, loopable"
MUSIC = {
    "music_scary": (f"Dark eerie horror ambience: low drones, distant piano notes, soft unsettling strings, slow, {BG}", 60),
    "music_tense": (f"Tense suspense: pulsing low strings, ticking rhythm, building unease but restrained, {BG}", 60),
    "music_mystery": (f"Mysterious and curious: soft plucked strings, celesta, light bass, slow and intriguing, {BG}", 60),
    "music_sad": (f"Sad and gentle: slow solo piano with soft strings, emotional, {BG}", 60),
    "music_calm": (f"Calm and warm: soft acoustic guitar and light piano, peaceful, {BG}", 60),
    "music_happy": (f"Happy and bright: ukulele, light percussion, cheerful and upbeat, {BG}", 60),
    "music_comedy": (f"Playful comedy: bouncy pizzicato strings, bassoon, quirky and light, {BG}", 60),
    "music_kids": (f"Friendly children's cartoon: xylophone, glockenspiel, soft claps, joyful, {BG}", 60),
    "music_romantic": (f"Romantic and tender: soft piano and warm strings, slow, {BG}", 60),
    "music_action": (f"Action: driving drums and staccato strings, energetic and heroic, {BG}", 60),
    "music_western": (f"Wild west: twangy acoustic guitar, harmonica, slow galloping rhythm, {BG}", 60),
    "music_party": (f"Party: upbeat amapiano-style log drum groove, shakers, warm keys, {BG}", 60),
}
MUSIC_MODELS = ["music_v2_5", "music_v1"]  # best first; the next is tried if the account can't use one


def generate_music(name):
    prompt, secs = MUSIC[name]
    last = None
    for model in MUSIC_MODELS:
        body = {"prompt": prompt, "music_length_ms": int(secs * 1000), "model_id": model, "force_instrumental": True}
        req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=json.dumps(body).encode(), method="POST",
                                     headers={"xi-api-key": KEY, "content-type": "application/json", "accept": "audio/mpeg"})
        try:
            data = urllib.request.urlopen(req, timeout=600).read()
            (OUT / f"{name}.mp3").write_bytes(data); return len(data)
        except urllib.error.HTTPError as e:
            if e.code in (400, 422) and model != MUSIC_MODELS[-1]: last = e; print(f"{model} refused ({e.code}), trying the next model"); continue
            raise
    raise last


def generate(name):
    prompt, secs = SOUNDS[name]
    body = {"text": prompt, "duration_seconds": max(.5, min(22, secs)), "prompt_influence": .45}
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation", data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": KEY, "content-type": "application/json", "accept": "audio/mpeg"})
    data = urllib.request.urlopen(req, timeout=180).read()
    (OUT / f"{name}.mp3").write_bytes(data)
    return len(data)


def main():
    OUT.mkdir(exist_ok=True)
    args = [a for a in sys.argv[1:] if a != "--redo"]; redo = "--redo" in sys.argv
    want = args or list(SOUNDS) + list(MUSIC)
    status = {"time": time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime()), "made": [], "already_had": [], "stopped_because": None}
    if not KEY:
        status["stopped_because"] = "ELEVENLABS_API_KEY is not set"
    else:
        for name in want:
            if name not in SOUNDS and name not in MUSIC: print("unknown sound", name); continue
            if (OUT / f"{name}.mp3").exists() and not redo: status["already_had"].append(name); continue
            try:
                kb = (generate_music(name) if name in MUSIC else generate(name)) // 1024; status["made"].append(name); print(f"made {name} ({kb} KB)")
            except urllib.error.HTTPError as e:
                msg = e.read()[:400].decode("utf-8", "replace")
                status["stopped_because"] = f"{name}: ElevenLabs {e.code}: {msg}"
                if e.code in (401, 403): status["stopped_because"] += "  -> the key needs 'Music Generation: Access'" if name in MUSIC else "  -> the key needs 'Sound Effects: Access'"
                print(status["stopped_because"]); break  # out of credits / no permission: keep what we made
            except Exception as e:
                status["stopped_because"] = f"{name}: {e}"; print(status["stopped_because"]); break
    status["missing"] = [n for n in list(SOUNDS) + list(MUSIC) if not (OUT / f"{n}.mp3").exists()]
    (OUT / "_status.json").write_text(json.dumps(status, indent=1))
    print(json.dumps(status, indent=1))


if __name__ == "__main__":
    main()
