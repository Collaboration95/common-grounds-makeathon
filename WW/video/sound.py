"""Original score + SFX for the Who's Hiding? promo, synthesised from scratch.

120 BPM chiptune (pixel-art worlds -> square waves), cue times shared with comp.js.
Writes out/audio.wav (48 kHz stereo). Run: python3 sound.py
"""
import wave
import numpy as np

SR, DUR, BPM = 48000, 21.0, 120
BEAT = 60 / BPM
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * (1 - max(pan, 0))
    R[i:i + len(sig)] += sig * (1 + min(pan, 0))


def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def hz(note):  # MIDI -> Hz
    return 440 * 2 ** ((note - 69) / 12)


def pulse(f, d, duty=0.25):
    t = t_(d)
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def tri(f, d):
    t = t_(d)
    return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def noise(d):
    return rng.uniform(-1, 1, int(SR * d))


# ---------- drums ----------
def kick(at, g=1.0):
    t = t_(0.35)
    f = 45 + 110 * np.exp(-t / 0.03)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16), at, 0.9 * g)


def snare(at, g=1.0):
    t = t_(0.25)
    add((noise(0.25) * 0.8 + np.sin(2 * np.pi * 190 * t) * 0.5) * np.exp(-t / 0.07), at, 0.35 * g)


def hat(at, g=1.0, pan=0.3):
    n = noise(0.06); n = np.diff(n, prepend=0)
    add(n * env(len(n), 0.0005, 0.018), at, 0.12 * g, pan)


def crash(at, g=1.0):
    n = noise(1.6); n = np.diff(n, prepend=0)
    add(n * env(len(n), 0.001, 0.45), at, 0.16 * g, -0.2)
    add(n * env(len(n), 0.001, 0.45), at + 0.011, 0.16 * g, 0.2)


# ---------- music ----------
# chord per bar (2 s): roots and arpeggio tones (MIDI)
CHORDS = {
    0: (48, [60, 64, 67, 72]),   # C
    1: (45, [57, 60, 64, 69]),   # Am
    2: (41, [57, 60, 65, 69]),   # F
    3: (43, [59, 62, 67, 71]),   # G
    4: (45, [57, 60, 64, 69]),   # Am  (Great Hall: bell timbre)
    5: (40, [56, 59, 64, 68]),   # E   (spooky major V)
    6: (41, [57, 60, 65, 72]),   # F   (wall of worlds)
    7: (43, [59, 62, 67, 74]),   # G
}


def bell(f, d):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t))


for bar in range(8):
    start = bar * 2.0
    root, arp = CHORDS[bar]
    hall = bar in (4, 5)
    for s in range(16):  # sixteenth notes
        at = start + s * BEAT / 2 / 2
        if 16.5 <= at < 17.0:  # the drop before the logo
            continue
        if 15.0 <= at < 16.5 and s % 2:  # create card: thinner
            continue
        note = arp[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + (12 if s >= 8 and bar % 2 else 0)
        d = 0.11
        if hall:
            sig = bell(hz(note + 12), 0.4) * env(int(SR * 0.4), 0.002, 0.18)
            add(sig, at, 0.07, 0.25 if s % 2 else -0.25)
        else:
            sig = pulse(hz(note), d, 0.25 if s % 4 else 0.125) * env(int(SR * d), 0.001, 0.05)
            add(sig, at, 0.055, 0.2 if s % 2 else -0.2)
    for e in range(4 * 2):  # bass eighths
        at = start + e * BEAT / 2
        if 16.5 <= at < 17.0:
            continue
        n = root + (12 if e % 2 else 0)
        sig = tri(hz(n), 0.22) * env(int(SR * 0.22), 0.002, 0.12)
        add(sig, at, 0.32)
    for b in range(4):  # drums
        at = start + b * BEAT
        if 16.5 <= at < 17.0:
            continue
        kick(at, 0.75 if 15.0 <= at < 16.5 else 1.0)
        if b % 2 == 1 and at >= 3.0:
            snare(at)
        hat(at + BEAT / 2)
        if 12.4 <= at < 15.0:  # wall: busier hats
            hat(at + BEAT / 4, 0.7, -0.3); hat(at + 3 * BEAT / 4, 0.7, -0.3)

# outro (17 - 21): big C, then a lighter groove that rings out
for b in range(8):
    at = 17.0 + b * BEAT
    kick(at, 1.0 if b < 7 else 0.6)
    hat(at + BEAT / 2, 0.8)
    if b % 2:
        snare(at, 0.8)
for s in range(32):
    at = 17.0 + s * BEAT / 4
    arp = [60, 64, 67, 72, 76, 72, 67, 64] if s < 16 else [65, 69, 72, 77, 81, 77, 72, 69]
    sig = pulse(hz(arp[s % 8]), 0.11, 0.25) * env(int(SR * 0.11), 0.001, 0.05)
    add(sig, at, 0.05 * (1 - s / 40), 0.2 if s % 2 else -0.2)
for i, n in enumerate([36, 41]):
    sig = tri(hz(n), 2.0) * env(int(SR * 2.0), 0.005, 0.9)
    add(sig, 17.0 + i * 2.0, 0.35)
# final chord swell
for n in (48, 55, 60, 64, 67):
    add(pulse(hz(n), 1.6, 0.5) * env(int(SR * 1.6), 0.01, 0.6), 19.5, 0.025)


# ---------- SFX ----------
def tick(at, f=1500, g=0.35):
    t = t_(0.06); add(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012), at, g)


def tock(at, f=900):
    t = t_(0.12)
    add((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t / 0.03), at, 0.45)


def whoosh(at, d=0.5, up=True, g=0.35):
    n = noise(d); x = np.linspace(0, 1, len(n))
    cut = (0.02 + 0.25 * (x if up else 1 - x)) ** 1.5
    y = np.empty_like(n); acc = 0.0
    for i, v in enumerate(n):
        acc += cut[i] * (v - acc); y[i] = acc
    shape = np.sin(np.pi * x) ** 2
    add(y * shape * 4, at, g, -0.3); add(y * shape * 4, at + 0.008, g, 0.3)


def impact(at, g=1.0):
    kick(at, 1.2 * g)
    n = noise(0.5); add(lowpass(n, 0.08) * env(len(n), 0.001, 0.12) * 3, at, 0.5 * g)


def buzzer(at):
    for i, f in enumerate((175, 131)):
        sig = pulse(f, 0.13, 0.5) * env(int(SR * 0.13), 0.002, 0.09)
        add(lowpass(sig, 0.25), at + i * 0.14, 0.28)


def chime(at, notes=(72, 76, 79, 84, 88), step=0.055, g=0.22):
    for i, n in enumerate(notes):
        sig = bell(hz(n), 1.0) * env(int(SR * 1.0), 0.001, 0.35)
        add(sig, at + i * step, g, (i - 2) * 0.2)


def blip(at, f=880, d=0.07, g=0.18):
    t = t_(d); fs = f * (1 + 0.5 * t / d)
    add(pulse(1, d) * 0 + np.sign(np.sin(2 * np.pi * np.cumsum(fs) / SR)) * env(len(t), 0.001, d / 3), at, g)


def boing(at):
    t = t_(0.35); f = 220 + 500 * (t / 0.35) ** 0.6 + 40 * np.sin(2 * np.pi * 18 * t)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.15), at, 0.3)


def key(at, g=0.12):
    n = noise(0.025); add(np.diff(n, prepend=0) * env(len(n), 0.0003, 0.006), at, g, rng.uniform(-0.3, 0.3))


def psst(at):
    for i, d in enumerate((0.07, 0.16)):
        n = np.diff(noise(d), prepend=0); n = np.diff(n, prepend=0)
        add(n * np.sin(np.linspace(0, np.pi, len(n))), at + i * 0.1, 0.07)


# hook
impact(0.0, 0.7); impact(0.25, 1.0); blip(0.0, 660)
for t0 in (1.5, 2.0, 2.5):
    tock(t0)
for i in range(6):
    tick(1.25 + i * 0.25, 2000, 0.15)
blip(1.2, 520, 0.09, 0.15)              # find card
whoosh(2.85, 0.25, True, 0.25); blip(3.05, 990)   # loupe drops
buzzer(3.5)
whoosh(4.6, 0.8, True, 0.18)            # loupe glide
impact(6.0); crash(6.0); chime(6.02)    # found Kermit
boing(6.1)
whoosh(6.8, 0.75, True, 0.45)           # iris into the Great Hall
impact(7.6, 0.9)
blip(8.1, 520, 0.09, 0.15)
for t0 in (8.25, 8.5, 8.75):
    tock(t0, 1100)
whoosh(8.85, 0.25, True, 0.25); blip(9.05, 990)
buzzer(9.25)
whoosh(10.2, 0.55, True, 0.5)           # whip pan
impact(11.0); crash(11.0); chime(11.02, (69, 73, 76, 81, 85))  # found Shrek (A major glint)
whoosh(12.2, 1.2, False, 0.45)          # pull back to the wall
for i in range(7):
    blip(12.9 + i * 0.125 + (0.25 if i >= 4 else 0), 700 + i * 60, 0.05, 0.08)
for j in range(5):
    blip(13.5 + j * 0.06, 400, 0.04, 0.06)
    blip(14.0 + j * 0.125, 880 * 2 ** (j * 2 / 12), 0.08, 0.14)
whoosh(15.0, 0.4, True, 0.2)
for i in range(29):
    key(15.25 + i * 0.65 / 29)
for i in range(15):
    key(15.95 + i * 0.35 / 15)
key(16.48, 0.4); blip(16.5, 300, 0.06, 0.15)  # click "Paint it"
whoosh(16.45, 0.6, True, 0.5)                  # riser into the drop
impact(17.0, 1.2); crash(17.0, 1.3); chime(17.02, (60, 67, 72, 76, 79, 84), 0.04, 0.18)
for k in range(12):
    blip(17.0 + k * 0.05, 1200 + 40 * k, 0.03, 0.05)
blip(18.0, 600, 0.1, 0.15)                     # QR card
boing(18.8)
psst(19.25)
for k in range(12):
    tick(19.5 + k * 0.04, 2400, 0.06)          # logo lock wave

# ---------- master ----------
mix = np.stack([L, R], 1)
fade = np.ones(N); fl = int(SR * 0.6); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
mix = np.tanh(mix * 1.25) * 0.85                  # soft clip glue
mix /= max(1e-9, np.abs(mix).max()) / 0.89
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote out/audio.wav', DUR, 's')
