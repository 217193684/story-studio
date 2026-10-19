"""Story Studio — original music beds, sound effects and background ambience, all synthesised (no copyrighted audio)."""
import numpy as np

SR = 44100
_rng = np.random.RandomState(11)


def _t(d): return np.arange(int(d * SR)) / SR
def _env(n, a=.005, r=.2):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, min(nr, n))[-nr:] if nr <= n else 1
    return e
def _noise(n, smooth=1):
    x = _rng.randn(n)
    return np.convolve(x, np.ones(smooth) / smooth, "same") if smooth > 1 else x
def midi(m): return 440 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- instruments
def pluck(f, d, bright=1., decay=4.):
    t = _t(d); s = sum(np.sin(2 * np.pi * f * k * t) / k ** (1.6 - .5 * bright) * np.exp(-t * decay * (1 + k * .35)) for k in range(1, 7))
    return s * _env(len(t), .002, .05)
def keys(f, d, decay=2.2):
    t = _t(d); s = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * decay) * _env(len(t), .004, .1)
def pad(fs, d, att=.6):
    t = _t(d); s = sum(np.sin(2 * np.pi * f * t + i) + .5 * np.sin(2 * np.pi * f * 1.004 * t) for i, f in enumerate(fs)) / max(1, len(fs))
    return s * _env(len(t), att, att)
def bass(f, d):
    t = _t(d); s = np.sin(2 * np.pi * f * t) + .3 * np.sin(4 * np.pi * f * t)
    return s * np.exp(-t * 3) * _env(len(t), .005, .05)
def square(f, d):
    t = _t(d); s = np.sign(np.sin(2 * np.pi * f * t)) * .5 + .5 * np.sin(2 * np.pi * f * t)
    return s * np.exp(-t * 7) * _env(len(t), .003, .03)
def kick(d=.35):
    t = _t(d); f = 50 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def snare(d=.2):
    t = _t(d); return (_noise(len(t)) * .7 + np.sin(2 * np.pi * 190 * t) * .4) * np.exp(-t * 22)
def hat(d=.06):
    t = _t(d); n = _noise(len(t)); return (n - np.convolve(n, np.ones(4) / 4, "same")) * np.exp(-t * 70)
def whistle(f, d):
    t = _t(d); return np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 5.5 * t) * (t > .15)) * _env(len(t), .06, .15)


def place(buf, x, at, amp=1.):
    i = int(at * SR)
    if i >= len(buf) or i < 0: return
    x = x[:len(buf) - i]; buf[i:i + len(x)] += x * amp


# ---------------------------------------------------------------- music loops (one loop per mood, tiled)
CHORDS = {  # semitone offsets from key root
    'I': [0, 4, 7], 'ii': [2, 5, 9], 'iii': [4, 7, 11], 'IV': [5, 9, 12], 'V': [7, 11, 14], 'vi': [9, 12, 16], 'bVII': [10, 14, 17],
    'i': [0, 3, 7], 'iv': [5, 8, 12], 'v': [7, 10, 14], 'bVI': [8, 12, 15], 'bIII': [3, 7, 10], 'VII': [10, 14, 17], 'Vmaj': [7, 11, 14],
    'Imaj7': [0, 4, 7, 11], 'IVmaj7': [5, 9, 12, 16], 'vi7': [9, 12, 16, 19], 'ii7': [2, 5, 9, 12],
}
RECIPES = {
    'happy': dict(bpm=112, key=60, prog=['I', 'V', 'vi', 'IV'], lead='pluck', arp=True, drums='light', bass=True),
    'comedy': dict(bpm=124, key=62, prog=['I', 'vi', 'ii', 'V'], lead='square', bounce=True, drums='light', bass=True),
    'kids': dict(bpm=118, key=64, prog=['I', 'IV', 'V', 'I'], lead='keys', arp=True, drums='light', bass=True, bright=True),
    'western': dict(bpm=96, key=57, prog=['i', 'VII', 'bVI', 'Vmaj'], lead='pluck', gallop=True, bass=True, whistle=True),
    'scary': dict(bpm=60, key=38, drone=True),
    'tense': dict(bpm=100, key=45, prog=['i', 'i', 'bVI', 'v'], pulse=True, drums='tick'),
    'sad': dict(bpm=68, key=57, prog=['i', 'bVI', 'bIII', 'VII'], lead='keys', padOn=True, slow=True),
    'romantic': dict(bpm=76, key=65, prog=['Imaj7', 'vi7', 'ii7', 'IVmaj7'], lead='keys', padOn=True, arp=True, slow=True),
    'action': dict(bpm=140, key=45, prog=['i', 'bVI', 'bVII', 'i'], pulse=True, drums='rock', stabs=True),
    'party': dict(bpm=122, key=57, prog=['i', 'bVI', 'bIII', 'bVII'], drums='club', bass=True, stabs=True),
    'calm': dict(bpm=84, key=62, prog=['I', 'iii', 'IV', 'I'], lead='pluck', padOn=True, arp=True, slow=True),
    'mystery': dict(bpm=72, key=50, prog=['i', 'iv', 'bVI', 'v'], lead='keys', padOn=True, slow=True, drums='tick'),
}


def music_loop(mood, seed=0):
    R = RECIPES.get(mood, RECIPES['calm']); rng = np.random.RandomState(seed + 7)
    if R.get('drone'):
        d = 16.; t = _t(d); k = R['key']
        s = (np.sin(2 * np.pi * midi(k) * t) + .8 * np.sin(2 * np.pi * midi(k) * 1.06 * t) + .5 * np.sin(2 * np.pi * midi(k + 7) * t)) * (.6 + .4 * np.sin(2 * np.pi * .11 * t))
        s += _noise(len(t), 60) * .25 * (.5 + .5 * np.sin(2 * np.pi * .05 * t))
        for at in (3.1, 9.7): place(s, (np.sin(2 * np.pi * 1174 * _t(2.5)) + np.sin(2 * np.pi * 1245 * _t(2.5))) * np.sin(np.pi * _t(2.5) / 2.5) ** 2 * .12, at)
        for at in np.arange(0, d, 1.2) if rng.rand() > .5 else []: place(s, kick(.4) * .35, at)
        return s * .5
    beat = 60 / R['bpm']; bar = beat * 4; bars = len(R['prog']) * 2; d = bars * bar
    s = np.zeros(int(d * SR) + SR)
    for b in range(bars):
        ch = CHORDS[R['prog'][b % len(R['prog'])]]; t0 = b * bar; root = R['key']
        if R.get('padOn'): place(s, pad([midi(root + n) for n in ch], bar + .3, .4) * .22, t0)
        if R.get('bass'):
            pat = [0, 2] if not R.get('gallop') else [0, 1.5, 2, 3.5]
            for p in pat: place(s, bass(midi(root - 12 + ch[0]), beat * .9) * .4, t0 + p * beat)
        if R.get('pulse'):
            for i in range(8): place(s, bass(midi(root - 12 + ch[0]), beat * .45) * .35, t0 + i * beat / 2)
        if R.get('stabs'):
            for p in ([1.5, 3.5] if R['bpm'] < 130 else [0, 1.5, 3]): place(s, pad([midi(root + 12 + n) for n in ch], beat * .3, .01) * .2, t0 + p * beat)
        lead = R.get('lead')
        if lead:
            notes = []
            if R.get('arp'): notes = [(i * beat / (1 if R.get('slow') else 2), ch[i % len(ch)] + 12 * (i // len(ch) % 2)) for i in range(4 if R.get('slow') else 8)]
            elif R.get('gallop'): notes = [(p * beat, ch[j % 3] + 12) for j, p in enumerate([0, .33, .66, 1, 2, 2.33, 2.66, 3])]
            elif R.get('bounce'): notes = [(p * beat, ch[j % 3] + (12 if j % 2 else 0)) for j, p in enumerate([0, .5, 1, 1.5, 2, 2.5, 3, 3.5])]
            else: notes = [(p * beat, ch[j % len(ch)] + 12) for j, p in enumerate([0, 1, 2, 3])]
            for at, n in notes:
                f = midi(root + n)
                x = pluck(f, beat * 1.4, bright=1.3 if R.get('gallop') else 1.) if lead == 'pluck' else keys(f, beat * (2.4 if R.get('slow') else 1.2)) if lead == 'keys' else square(f, beat * .4)
                place(s, x * (.22 if lead != 'square' else .14), t0 + at)
        dr = R.get('drums')
        for i in range(4):
            if dr in ('rock', 'club') or (dr == 'light' and i % 2 == 0): place(s, kick() * (.5 if dr != 'light' else .3), t0 + i * beat)
            if dr == 'rock' and i % 2 == 1: place(s, snare() * .4, t0 + i * beat)
            if dr == 'club': place(s, hat() * .3, t0 + i * beat + beat / 2)
            if dr in ('light', 'tick', 'rock'): place(s, hat() * (.16 if dr != 'tick' else .1), t0 + i * beat + (beat / 2 if dr != 'tick' else 0))
    if R.get('whistle'):
        mel = [(0, 12), (1.5, 15), (2, 19), (4, 17), (5, 15), (6, 14), (8, 12)]
        for at, n in mel: place(s, whistle(midi(R['key'] + n), beat * 1.3) * .12, at * beat + bar * 2)
    return s[:int(d * SR)] * .55


def music_track(segments, total, voice=None):
    """segments: [(t0, t1, mood)] -> one track with 1 s crossfades, ducked under the voice."""
    n = int(total * SR); out = np.zeros(n); cache = {}
    for i, (t0, t1, mood) in enumerate(segments):
        if mood == 'silent': continue
        loop = cache.setdefault(mood, music_loop(mood, seed=len(cache)))
        i0, i1 = int(max(0, t0 - .5) * SR), min(n, int((t1 + .5) * SR))
        L = i1 - i0
        if L <= 0: continue
        reps = int(np.ceil(L / len(loop))) + 1; seg = np.tile(loop, reps)[:L]
        fade = np.ones(L); f = min(L // 2, SR); fade[:f] = np.linspace(0, 1, f); fade[-f:] = np.linspace(1, 0, f)
        out[i0:i1] += seg * fade
    if voice is not None:
        env = np.convolve(np.abs(voice[:n]), np.ones(SR // 8) / (SR // 8), "same")
        env = np.clip(env / (env.max() + 1e-9) * 6, 0, 1)
        out *= 1 - .55 * env
    return out


# ---------------------------------------------------------------- sound effects
def sfx(name):
    n = name
    if n == 'knock':
        t = _t(.4); f = 90 * np.exp(-t * 10) + 48
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 13) + .4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) + _noise(len(t), 25) * np.exp(-t * 45) * 1.2
    if n in ('door_open', 'creak'):
        t = _t(1.0); f = 170 + 140 * t + 28 * np.sin(2 * np.pi * 13 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3 * ph)) * np.sin(np.pi * t) ** 1.5 * .5
    if n == 'door_slam': o = np.zeros(int(.6 * SR)); place(o, sfx('knock') * 1.6, 0); place(o, _noise(int(.5 * SR), 8) * np.exp(-_t(.5) * 14) * .6, 0); return o
    if n == 'footsteps':
        out = np.zeros(int(1.6 * SR))
        for i in range(4): place(out, (_noise(int(.12 * SR), 30) * np.exp(-_t(.12) * 40) + np.sin(2 * np.pi * 70 * _t(.12)) * np.exp(-_t(.12) * 30)) * .6, i * .4)
        return out
    if n == 'sting':
        t = _t(1.3); sw = np.sin(np.pi * np.minimum(1, t / 1.3)) ** 2
        return (np.sin(2 * np.pi * 1174 * t) + np.sin(2 * np.pi * 1245 * t) + .5 * np.sin(2 * np.pi * 1760 * t)) * sw * .35 + np.sin(2 * np.pi * 42 * t) * np.exp(-t * 2.5) * 1.3
    if n == 'boing':
        t = _t(.6); f = 180 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)
    if n == 'slide_whistle':
        t = _t(.9); f = 500 + 900 * t / .9; return np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), .05, .2) * .6
    if n == 'slide_down':
        t = _t(.9); f = 1400 - 900 * t / .9; return np.sin(2 * np.pi * np.cumsum(f) / SR) * _env(len(t), .05, .2) * .6
    if n in ('punch', 'hit'):
        t = _t(.3); return (np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 40)) * t) * 1.2 + _noise(len(t), 3) * .6) * np.exp(-t * 18)
    if n == 'crash':
        t = _t(1.2); return _noise(len(t)) * np.exp(-t * 4) * .8 + (np.sin(2 * np.pi * 2400 * t) + np.sin(2 * np.pi * 3100 * t)) * np.exp(-t * 6) * .15
    if n == 'gunshot':
        t = _t(.8); return _noise(len(t), 2) * np.exp(-t * 14) * 1.2 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 10)
    if n == 'thunder':
        t = _t(3.0); return _noise(len(t), 120) * 6 * (np.exp(-t * 1.2) * (.6 + .4 * np.sin(2 * np.pi * 3 * t) ** 2))
    if n == 'phone_ring':
        t = _t(2.0); return (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (np.sin(2 * np.pi * 20 * t) > 0) * ((t % 1.0) < .8) * .3
    if n == 'car_horn':
        t = _t(.7); return (np.sign(np.sin(2 * np.pi * 400 * t)) + np.sign(np.sin(2 * np.pi * 500 * t))) * .18 * _env(len(t), .01, .05)
    if n == 'engine':
        t = _t(2.5); f = 40 + 30 * np.minimum(1, t); return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + _noise(len(t), 20) * .4) * _env(len(t), .3, .5)
    if n in ('glass', 'clink', 'ding', 'bell'):
        t = _t(1.5); f0 = 1800 if n != 'bell' else 660
        return (np.sin(2 * np.pi * f0 * t) + .6 * np.sin(2 * np.pi * f0 * 2.76 * t)) * np.exp(-t * (6 if n != 'bell' else 2.5)) * .5
    if n == 'cash':
        return np.concatenate([sfx('ding')[:int(.3 * SR)] * .8, sfx('ding')[:int(1.0 * SR)]])
    if n in ('magic', 'sparkle'):
        out = np.zeros(int(1.4 * SR))
        for i in range(10): place(out, np.sin(2 * np.pi * (1200 + i * 180) * _t(.3)) * np.exp(-_t(.3) * 12) * .3, i * .1)
        return out
    if n == 'heartbeat':
        out = np.zeros(int(2.0 * SR))
        for at in (0, .25, 1.0, 1.25): place(out, np.sin(2 * np.pi * 50 * _t(.2)) * np.exp(-_t(.2) * 20), at)
        return out
    if n in ('whoosh', 'swoosh'):
        t = _t(.6); return _noise(len(t), 15) * np.sin(np.pi * t / .6) ** 2 * 1.5
    if n in ('applause', 'clap'):
        out = np.zeros(int(2.5 * SR))
        for i in range(120): place(out, _noise(int(.03 * SR), 2) * np.exp(-_t(.03) * 80) * (.3 + .3 * _rng.rand()), _rng.rand() * 2.3)
        return out * _env(len(out), .2, .6)
    if n == 'laugh_track':
        out = np.zeros(int(2.2 * SR))
        for i in range(40): f = 180 + _rng.rand() * 200; place(out, np.sin(2 * np.pi * f * _t(.12)) * np.sin(np.pi * _t(.12) / .12) * .12, _rng.rand() * 2.0)
        return out
    if n == 'dog_bark':
        out = np.zeros(int(1.0 * SR))
        for at in (0, .35):
            t = _t(.16); f = 520 - 200 * t / .16; ph = 2 * np.pi * np.cumsum(f) / SR
            place(out, (np.sign(np.sin(ph)) * .5 + _noise(len(t), 4) * .5) * np.sin(np.pi * t / .16), at)
        return out * .7
    if n == 'cat_meow':
        t = _t(.8); f = 500 + 300 * np.sin(np.pi * t / .8); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) + .4 * np.sin(2 * ph) + .2 * np.sin(3 * ph)) * np.sin(np.pi * t / .8) * .4
    if n == 'cow_moo':
        t = _t(1.6); f = 110 + 30 * np.sin(np.pi * t / 1.6); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sign(np.sin(ph)) * .4 + np.sin(2 * ph) * .3) * np.sin(np.pi * t / 1.6) * .5
    if n in ('rooster', 'chicken'):
        t = _t(1.0); f = 700 + 300 * np.sin(np.pi * t) + 40 * np.sin(2 * np.pi * 25 * t); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) + .5 * np.sin(2 * ph)) * np.sin(np.pi * t) * .3
    if n == 'horse':
        out = np.zeros(int(1.6 * SR))
        for i in range(6): place(out, (np.sin(2 * np.pi * 90 * _t(.08)) + _noise(int(.08 * SR), 6) * .5) * np.exp(-_t(.08) * 40) * .7, i * .25 + (i % 2) * .08)
        return out
    if n == 'siren':
        t = _t(3.0); f = 700 + 300 * np.sin(2 * np.pi * .7 * t); return np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 * _env(len(t), .2, .3)
    if n in ('explosion', 'boom'):
        t = _t(2.5); return (_noise(len(t), 40) * 5 * np.exp(-t * 2) + np.sin(2 * np.pi * 40 * t) * np.exp(-t * 3)) * .9
    if n == 'splash':
        t = _t(1.0); return _noise(len(t), 3) * np.exp(-t * 5) * .6
    if n in ('beep', 'pop'):
        t = _t(.14); return np.sin(2 * np.pi * (600 + 1500 * t) * t) * np.exp(-t * 28) * .6
    if n == 'clock':
        out = np.zeros(int(2.0 * SR))
        for i in range(4): place(out, np.sin(2 * np.pi * 2000 * _t(.03)) * np.exp(-_t(.03) * 150) * .4, i * .5)
        return out
    if n == 'typing':
        out = np.zeros(int(1.5 * SR))
        for i in range(14): place(out, _noise(int(.02 * SR), 2) * np.exp(-_t(.02) * 150) * .4, i * .1 + _rng.rand() * .03)
        return out
    if n == 'scream':  # a short shocked gasp-like rising tone (no real recording)
        t = _t(.9); f = 600 + 500 * t; ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) + .6 * np.sin(2 * ph + 1) + _noise(len(t), 3) * .3) * np.sin(np.pi * t / .9) * .25
    if n == 'evil_laugh':
        out = np.zeros(int(1.8 * SR))
        for i in range(6): t = _t(.18); place(out, (np.sign(np.sin(2 * np.pi * 120 * t)) * .3 + np.sin(2 * np.pi * 240 * t) * .3) * np.sin(np.pi * t / .18), i * .26)
        return out
    if n == 'wind':
        t = _t(3.0); return _noise(len(t), 200) * 8 * (.5 + .5 * np.sin(2 * np.pi * .3 * t)) * _env(len(t), .5, .8)
    if n == 'rain':
        t = _t(3.0); return _noise(len(t), 2) * .25
    if n == 'gulp' or n == 'drink':
        t = _t(.25); return np.sin(2 * np.pi * (200 - 300 * t) * t) * np.exp(-t * 12) * .5
    if n == 'kiss':
        t = _t(.12); return _noise(len(t), 2) * np.exp(-t * 60) * .5
    if n == 'magic_bad':
        t = _t(1.2); f = 200 - 120 * t; return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .25 * _env(len(t), .02, .3)
    if n == 'wow':
        t = _t(.8); f = 300 + 300 * np.sin(np.pi * t / .8); ph = 2 * np.pi * np.cumsum(f) / SR; return np.sin(ph) * np.sin(np.pi * t / .8) * .3
    return sfx('pop')
SFX_NAMES = ['knock', 'door_open', 'creak', 'door_slam', 'footsteps', 'sting', 'boing', 'slide_whistle', 'slide_down', 'punch', 'hit', 'crash', 'gunshot', 'thunder', 'phone_ring', 'car_horn', 'engine', 'glass', 'ding', 'bell', 'cash', 'magic', 'heartbeat', 'whoosh', 'applause', 'laugh_track', 'dog_bark', 'cat_meow', 'cow_moo', 'rooster', 'horse', 'siren', 'explosion', 'splash', 'beep', 'pop', 'clock', 'typing', 'scream', 'evil_laugh', 'wind', 'rain', 'drink', 'kiss', 'magic_bad', 'wow']


# ---------------------------------------------------------------- ambience under each scene
def ambience(where, tod, weather, dur):
    n = int(dur * SR); t = np.arange(n) / SR; a = np.zeros(n)
    outdoor = where in ('street', 'township', 'taxi_rank', 'city', 'construction', 'farm', 'bush', 'forest', 'beach', 'graveyard', 'western_town', 'desert', 'park', 'haunted_house', 'road')
    if weather == 'rain': a += _noise(n, 2) * .05 + _noise(n, 30) * .1
    if weather in ('wind', 'dust') or where in ('desert', 'western_town'): a += _noise(n, 300) * 1.2 * (.5 + .5 * np.sin(2 * np.pi * .2 * t))
    if where == 'beach': a += _noise(n, 80) * 1.0 * (.4 + .6 * np.sin(2 * np.pi * .12 * t) ** 2)
    if where in ('bar', 'restaurant', 'taxi_rank', 'shop', 'city', 'club'): a += _noise(n, 40) * .25
    if outdoor and tod == 'night':
        for i in range(int(dur * 3)): at = i / 3 + _rng.rand() * .2; ch = np.sin(2 * np.pi * 4200 * _t(.05)) * (np.sin(2 * np.pi * 60 * _t(.05)) > 0) * .02; place(a, ch, at)
    elif outdoor and where in ('farm', 'bush', 'forest', 'park'):
        for i in range(int(dur / 2.5)):
            at = i * 2.5 + _rng.rand(); tt = _t(.18); f = 2600 + 900 * np.sin(2 * np.pi * 12 * tt); place(a, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / .18) * .025, at)
    if where in ('cave', 'construction') and False: pass
    return a
