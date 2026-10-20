"""Soft background music made in code (free, no credits): wind chimes, singing bowls and dreamy pads.

Each function returns a mono float loop of exactly n samples that repeats without a click: sounds that
ring past the end are folded back over the start.
"""
import numpy as np

SR = 44100


def _reverb(x, secs=2.2, mix=.28, seed=7):
    """A soft room: convolve with a decaying noise tail."""
    r = np.random.default_rng(seed); k = int(secs * SR)
    ir = r.standard_normal(k) * np.exp(-np.arange(k) / (SR * secs / 5)); ir /= np.sqrt((ir ** 2).sum())
    m = 1 << int(np.ceil(np.log2(len(x) + k)))
    wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x) + k]
    out = np.zeros(len(x) + k); out[: len(x)] += x * (1 - mix); out += wet * mix
    return out


def _fold(x, n):
    """Wrap everything past n back onto the start so the loop is seamless."""
    out = x[:n].copy(); tail = x[n:]
    while len(tail): out[: min(n, len(tail))] += tail[:n]; tail = tail[n:]
    return out


def _bell(f, secs, partials, decays, amps, rng, detune=0.0):
    t = np.arange(int(secs * SR)) / SR; s = np.zeros_like(t)
    for p, d, a in zip(partials, decays, amps):
        ph = rng.uniform(0, 2 * np.pi)
        tone = np.sin(2 * np.pi * f * p * t + ph)
        if detune: tone = .5 * tone + .5 * np.sin(2 * np.pi * (f * p + detune) * t + ph)   # slow beating, like a real bowl
        s += a * tone * np.exp(-t / d)
    att = int(.004 * SR if not detune else .05 * SR); s[:att] *= np.linspace(0, 1, att)
    return s


def chimes(n, seed=1):
    """Wind chimes: little gusts of a few notes, then quiet, from a calm pentatonic scale."""
    rng = np.random.default_rng(seed)
    notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5]
    out = np.zeros(n + 8 * SR); t = rng.uniform(0, 3)
    while t < n / SR:
        for _ in range(rng.integers(2, 7)):                      # one gust
            f = notes[rng.integers(len(notes))]
            b = _bell(f, 6, [1, 2.76, 5.40, 8.93], [2.6, 1.1, .5, .25], [1, .35, .18, .08], rng) * rng.uniform(.25, 1)
            i = int(t * SR); out[i:i + len(b)] += b[: len(out) - i]; t += rng.uniform(.12, .7)
        t += rng.uniform(5, 13)
    return _fold(_reverb(out, 2.6, .35), n)


def bowls(n, seed=2):
    """Singing bowls: a deep bowl every ~12 s, slowly beating and fading."""
    rng = np.random.default_rng(seed)
    notes = [130.81, 174.61, 196.0, 220.0, 261.63]
    out = np.zeros(n + 22 * SR); t = 1.0; last = -1
    while t < n / SR:
        k = rng.integers(len(notes))
        if k == last: k = (k + 2) % len(notes)
        last = k
        b = _bell(notes[k], 20, [1, 2.71, 5.15, 8.4], [9, 4.5, 2.2, 1.1], [1, .45, .2, .08], rng, detune=rng.uniform(.4, .9)) * rng.uniform(.6, 1)
        i = int(t * SR); out[i:i + len(b)] += b[: len(out) - i]; t += rng.uniform(9, 15)
    return _fold(_reverb(out, 3.5, .3), n)


def pad(n, seed=3):
    """Dreamy pads: slow warm chords (Cmaj7, Am9, Fmaj7, G6), each fading into the next."""
    chords = [[130.81, 164.81, 196.0, 246.94], [110.0, 130.81, 164.81, 196.0, 246.94], [87.31, 110.0, 130.81, 164.81], [98.0, 146.83, 164.81, 220.0]]
    seg = 16.0; L = int(seg * SR); fade = int(5 * SR)
    out = np.zeros(n + L + fade); t = np.arange(L + 2 * fade) / SR
    env = np.ones(L + 2 * fade); env[:fade] = np.sin(np.linspace(0, np.pi / 2, fade)) ** 2; env[-fade:] = np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    rng = np.random.default_rng(seed); i = 0; c = 0
    while i < n:
        s = np.zeros_like(t)
        for f in chords[c % len(chords)]:
            for d in (-.0018, 0, .0021):                          # three slightly detuned voices = warm chorus
                s += np.sin(2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6.3)) + .25 * np.sin(4 * np.pi * f * (1 + d) * t)
        s *= env * (1 + .08 * np.sin(2 * np.pi * .11 * t))
        j = max(0, i - fade); out[j:j + len(s)] += s[: len(out) - j]; i += L; c += 1
    # soft low-pass to keep it mellow (gentle roll-off above ~700 Hz)
    F = np.fft.rfft(out); fr = np.fft.rfftfreq(len(out), 1 / SR); y = np.fft.irfft(F / np.sqrt(1 + (fr / 700) ** 4), len(out))
    return _fold(_reverb(y, 3.0, .3), n)


MAKERS = {"chimes": chimes, "bowls": bowls, "pad": pad}
