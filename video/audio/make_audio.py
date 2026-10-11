#!/usr/bin/env python3
"""The Commons, 24 s score + sound design. Deterministic (seeded per-asset).

Run:  python3 video/audio/make_audio.py
Out:  music.wav, mix.wav, mix.png, cues.json, sfx/*.wav   (next to this file)

120 BPM, C major (C - Am - F - G), chiptune pulse arp + triangle bass + detuned
saw pad + soft kick/hats + vinyl bed. Cue times follow video/BRIEF.md.
"""
import json
import os
import re
import subprocess
import zlib

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
DUR = 24.0
N = int(DUR * SR)
BPM = 120
HERE = os.path.dirname(os.path.abspath(__file__))
SFX_DIR = os.path.join(HERE, "sfx")
os.makedirs(SFX_DIR, exist_ok=True)
TWO_PI = 2 * np.pi


# ----------------------------------------------------------------- helpers
def R(name):
    return np.random.default_rng(zlib.crc32(name.encode()))


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69) / 12)


def db(x):
    return 10 ** (x / 20)


def filt(x, fc, kind="low", order=2):
    fc = np.atleast_1d(fc)
    sos = signal.butter(order, fc if len(fc) > 1 else fc[0], btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def tv_filter(x, fc_curve, kind="low", order=2, block=256, bw=1.6):
    """time-varying butterworth on a 1-D signal; fc_curve per sample."""
    out = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        f = float(np.clip(fc_curve[min(i, len(fc_curve) - 1)], 30, SR * 0.45))
        if kind == "band":
            sos = signal.butter(order, [max(20, f / bw), min(SR * 0.45, f * bw)], btype="band", fs=SR, output="sos")
        else:
            sos = signal.butter(order, f, btype=kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return out


def pan(x, p):
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def put(buf, x, t, sr=SR):
    i = int(round(t * sr))
    if i >= len(buf):
        return
    e = min(len(buf), i + len(x))
    buf[i:e] += x[: e - i]


def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    if fin > 0:
        n = min(len(x), int(fin * SR))
        x[:n] *= (0.5 - 0.5 * np.cos(np.pi * np.arange(n) / n))[(...,) + (None,) * (x.ndim - 1)]
    if fout > 0:
        n = min(len(x), int(fout * SR))
        x[-n:] *= (0.5 + 0.5 * np.cos(np.pi * np.arange(n) / n))[(...,) + (None,) * (x.ndim - 1)]
    return x


def reverb(x, rt60, mix, seed, predelay=0.012):
    """stereo exp-noise IR reverb; returns dry+wet, padded by the tail."""
    r = R("rev" + seed)
    tail = int(rt60 * SR)
    xp = np.concatenate([x, np.zeros((tail, 2))])
    t = np.arange(tail) / SR
    out = xp.copy()
    for c in range(2):
        ir = r.standard_normal(tail) * 10 ** (-3 * t / rt60)
        ir = filt(ir, 5500)
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        out[:, c] += mix * signal.fftconvolve(xp[:, c], ir)[: len(xp)]
    return out


def peak_norm(x, peak=0.7):
    return x * (peak / (np.max(np.abs(x)) + 1e-12))


def set_rms(x, target_db):
    act = np.abs(x).max(axis=1) > 1e-4 if x.ndim == 2 else np.abs(x) > 1e-4
    r = np.sqrt(np.mean(x[act] ** 2))
    return x * (db(target_db) / (r + 1e-12))


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, np.round(x * 32767).astype(np.int16))


def measure(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    s = p.stderr
    lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", s)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", s)[-1])
    return lufs, tp


def limiter(x, thr_db=-2.0):
    thr = db(thr_db)
    pk = np.abs(x).max(axis=1)
    need = thr / np.maximum(pk, thr)
    need = minimum_filter1d(need, 513)
    need = uniform_filter1d(need, 257)
    return x * need[:, None]


# -------------------------------------------------------------- music parts
CHORDS = {  # root pitch class, intervals, bass midi, pad voicing
    "C": (0, [0, 4, 7], 36, [52, 55, 60, 64]),
    "Am": (9, [0, 3, 7], 33, [52, 57, 60, 64]),
    "F": (5, [0, 4, 7], 41, [53, 57, 60, 65]),
    "G": (7, [0, 4, 7], 43, [50, 55, 59, 62]),
    "Cadd9": (0, [0, 4, 7], 36, [52, 55, 62, 64, 67]),
}
SEG = [(0.0, "C"), (1.0, "C"), (3.0, "Am"), (5.0, "F"), (7.0, "G"), (9.0, "G"), (10.5, "C"), (12.0, "Am"),
       (13.0, "F"), (15.0, "G"), (17.0, "C"), (18.0, "Am"), (19.0, "F"), (20.0, "G"), (21.0, "Cadd9"), (DUR, None)]


def chord_at(t):
    c = None
    for s, n in SEG:
        if t >= s - 1e-9 and n:
            c = n
    return c


def seg_end(t):
    for s, n in SEG:
        if s > t + 1e-9:
            return s
    return DUR


def ext(ch, lo, hi):
    root, iv, _, _ = CHORDS[ch]
    return sorted(m for m in range(lo, hi) if (m - root) % 12 in iv)


def chip_note(f, dur, tau, duty, osr=4):
    n = int((dur + 0.02) * SR * osr)
    t = np.arange(n) / (SR * osr)
    w = 0.0
    for fm, d, g in ((f, duty, 1.0), (f * 1.0035, 0.5, 0.5)):
        ph = np.cumsum(np.full(n, fm / (SR * osr)))
        w = w + g * (np.where((ph % 1) < d, 1.0, -1.0) - (2 * d - 1))
    env = np.minimum(t / 0.003, 1) * np.exp(-t / tau) * np.clip((dur + 0.02 - t) / 0.02, 0, 1)
    return w * env


def arp_events():
    ev = []  # (t, midi, dur, vel, tau, duty)
    S = 0.125
    for k in range(int(1.0 / S), int(21.0 / S)):
        t = k * S
        ch = chord_at(t)
        if t < 2.0:
            if k % 2: continue
            tn = ext(ch, 72, 92)
            ev.append((t, tn[[0, 1, 2, 1][(k // 2) % 4]], 0.22, 0.5 * (t - 1.0 + 0.2) / 1.2, 0.14, 0.25))
        elif t < 6.0:
            if k % 2: continue
            tn = ext(ch, 72, 96)
            i = [0, 1, 2, 1, 0, 1, 2, 3][(k // 2) % 8]
            ev.append((t, tn[i], 0.24, 0.6 + 0.15 * (t - 2) / 4, 0.14, 0.25))
        elif t < 9.0:
            tn = ext(ch, 60, 101)
            kk = int(round((t - 6.0) / S))
            sec = kk // 8
            i = min(len(tn) - 1, sec + (kk % 8) + 0)
            ev.append((t, tn[i], 0.11, 0.6 + 0.35 * (t - 6) / 3, 0.09, 0.5 - 0.25 * (t - 6) / 3))
        elif t < 10.5:
            if k % 2 or t >= 10.25: continue
            tn = ext(ch, 67, 90)
            ev.append((t, tn[[0, 1, 2, 3][(k // 2) % 4]], 0.3, 0.25 + 0.12 * (t - 9), 0.2, 0.5))
        elif t < 13.0:
            if k % 2: continue
            tn = ext(ch, 72, 96)
            i = [0, 2, 1, 2, 0, 2, 3, 2][int(round((t - 10.5) / 0.25)) % 8]
            ev.append((t, tn[i], 0.2, 0.8, 0.12, 0.25))
        elif t < 17.0:
            if k % 4: continue
            tn = ext(ch, 76, 100)
            i = [0, 1, 2, 3][int(round((t - 13) / 0.5)) % 4]
            ev.append((t, tn[i], 0.4, 0.45 + 0.3 * (t - 13) / 4, 0.3, 0.5))
        else:
            tn = ext(ch, 72, 100)
            j = int(round((t - 17) / S)) % 8
            i = [0, 1, 2, 1, 2, 3, 2, 1][j]
            acc = 1.0 if j % 2 == 0 else 0.7
            if t >= 20.0: acc *= 1 + 0.2 * (t - 20)
            ev.append((t, tn[i], 0.09, 0.75 * acc, 0.05, 0.25 if j < 4 else 0.125))
    for j, m in enumerate([72, 76, 79, 84]):  # soft resolve pluck under the chime
        ev.append((21.0 + 0.09 * j, m, 0.6, 0.5, 0.45, 0.5))
    return ev


def kick(vel=1.0):
    n = int(0.36 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.022)
    ph = np.cumsum(f) / SR * TWO_PI
    y = np.sin(ph) * np.exp(-t / 0.13) * np.minimum(t / 0.0012, 1)
    y += 0.25 * filt(R("kclick").standard_normal(n), 2500) * np.exp(-t / 0.004)
    return np.tanh(1.4 * y) * vel


def hat(open_=False, seed=0):
    n = int((0.32 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    y = filt(R("hat%d" % seed).standard_normal(n), [6500, 16000], "band") * np.exp(-t / (0.08 if open_ else 0.014))
    return y


def snare():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    y = filt(R("snr").standard_normal(n), [1400, 6500], "band") * np.exp(-t / 0.05)
    y += 0.5 * np.sin(TWO_PI * 190 * t) * np.exp(-t / 0.035)
    return y


def tri(f, n):
    ph = np.cumsum(np.full(n, f / SR))
    return 2 / np.pi * np.arcsin(np.sin(TWO_PI * ph))


def bass_note(m, dur):
    n = int((dur + 0.05) * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / 0.008, 1) * np.exp(-t / (dur * 0.7)) * np.clip((dur + 0.05 - t) / 0.05, 0, 1)
    y = tri(float(mtof(m)), n) * env
    return np.tanh(2.0 * y) * 0.7  # light drive -> harmonics audible on small speakers


def interp_curve(pts, log=False):
    xs = np.array([p[0] for p in pts]) * SR
    ys = np.array([p[1] for p in pts], dtype=float)
    if log:
        return np.exp(np.interp(np.arange(N), xs, np.log(ys)))
    return np.interp(np.arange(N), xs, ys)


def build_music():
    # ---- arp (4x oversampled pulse waves, then decimate)
    osr = 4
    A = [np.zeros(N * osr), np.zeros(N * osr)]
    for i, (t, m, d, v, tau, duty) in enumerate(arp_events()):
        put(A[i % 2], chip_note(float(mtof(m)), d, tau, duty, osr) * v, t, SR * osr)
    A = [signal.resample_poly(a, 1, osr)[:N] for a in A]
    # pan: even notes left, odd right (slightly)
    mono = A[0] + A[1]
    arp = np.stack([A[0] * 0.8 + A[1] * 0.45, A[0] * 0.45 + A[1] * 0.8], axis=1)
    arp = np.stack([filt(arp[:, 0], 4800), filt(arp[:, 1], 4800)], axis=1)
    # dotted-8th ping-pong echo (0.375 s)
    echo = np.zeros_like(arp)
    d = int(0.375 * SR)
    src = filt(mono, 3200)
    for k in range(1, 4):
        c = k % 2
        put(echo[:, c], src * 0.42 ** k * 0.9, k * 0.375)
    echo_gain = interp_curve([(0, 0.5), (13, 0.5), (13.5, 1.3), (17, 1.3), (17.5, 0.5), (24, 0.5)])
    arp = arp + echo * echo_gain[:, None]
    arp = set_rms(arp, -21)

    # ---- drums
    kk = np.zeros((N, 2)); hh = np.zeros((N, 2)); sn = np.zeros((N, 2))
    kick_t = []
    for b in range(int(2.0 / 0.5), int(21.0 / 0.5)):
        t = b * 0.5
        if 9.0 <= t < 10.5 or 13.0 <= t < 15.0 or t >= 21.0: continue
        v = 1.0 if (b % 2 == 0) else 0.65
        if 15.0 <= t < 17.0: v *= 0.55
        if 10.5 <= t < 13.0: v *= 1.15
        kick_t.append((t, v))
        put(kk, pan(kick(v), 0), t)
    hat_i = 0
    for k in range(int(3.0 / 0.125), int(21.0 / 0.125)):
        t = k * 0.125
        if 9.0 <= t < 10.5 or 13.0 <= t < 15.0: continue
        off8 = abs((t / 0.25) - round(t / 0.25)) < 1e-6 and int(round(t / 0.25)) % 2 == 1   # 8th off-beat
        on8 = abs((t / 0.25) - round(t / 0.25)) < 1e-6
        if t < 5.0:
            ok, v = off8, 0.6
        elif t < 9.0:
            ok, v = on8, 0.5 + (0.3 if off8 else 0)
        elif t < 13.0:
            ok, v = on8, 0.7 if off8 else 0.4
        elif t < 17.0:
            ok, v = on8, 0.35
        else:
            ok, v = True, (0.75 if off8 else 0.5 if on8 else 0.3)
        if not ok: continue
        op = off8 and (10.5 <= t < 13.0 or t >= 17.0) and int(round(t / 0.25)) % 4 == 3
        hat_i += 1
        put(hh, pan(hat(op, hat_i % 5) * v, ((hat_i * 37) % 100) / 100 * 0.6 - 0.3), t)
    for t in list(np.arange(11.5, 13.0, 1.0)) + list(np.arange(15.5, 17.0, 1.0)) + list(np.arange(17.5, 21.0, 1.0)):
        put(sn, pan(snare() * (0.5 if t < 17 else 0.8), 0.1), t)
    kk *= db(-8) / np.abs(kk).max()
    hh *= db(-26) / np.abs(hh).max()
    sn *= db(-18) / np.abs(sn).max()
    duck = np.zeros(N)
    for t, v in kick_t:
        e = np.exp(-np.arange(int(0.3 * SR)) / (0.1 * SR)) * v
        put(duck, e, t)
    duck = 1 - 0.28 * np.clip(duck, 0, 1)

    # ---- bass
    bs = np.zeros(N)
    for si in range(len(SEG) - 1):
        s0, ch = SEG[si]
        if ch is None or s0 < 2.0: continue
        s1 = SEG[si + 1][0]
        bm = CHORDS[ch][2]
        if 9.0 <= s0 < 10.5:
            continue
        t = s0
        while t < s1 - 1e-6:
            rel = t - s0
            if 13.0 <= s0 < 15.0:
                if rel < 1e-6: put(bs, bass_note(bm, 1.8) * 0.9, t)
            elif s0 >= 21.0:
                if rel < 1e-6: put(bs, bass_note(bm, 2.4) * 0.9, t)
            elif s0 >= 17.0:   # bouncy off-beat bass
                put(bs, bass_note(bm, 0.2) * 0.9, t + 0.0)
                put(bs, bass_note(bm + 12, 0.14) * 0.6, t + 0.25)
                put(bs, bass_note(bm + 7, 0.2) * 0.7, t + 0.5)
                put(bs, bass_note(bm + 12, 0.14) * 0.6, t + 0.75)
            else:
                b = int(round(rel / 0.5)) % 4
                if b == 0: put(bs, bass_note(bm, 0.45), t)
                elif b == 1: put(bs, bass_note(bm + 7, 0.22) * 0.8, t)
                elif b == 2: put(bs, bass_note(bm, 0.3) * 0.9, t)
                else: put(bs, bass_note(bm + 12, 0.2) * 0.6, t)
            t += 0.5 if s0 < 13.0 or 15.0 <= s0 < 17.0 else 1.0
    bs = filt(bs, 900)
    bs = set_rms(bs, -22) * duck
    bass = pan(bs, 0)

    # ---- pad: detuned saws + sine, with automated gain and filter
    padL = np.zeros(N); padR = np.zeros(N)
    for si in range(len(SEG) - 1):
        s0, ch = SEG[si]
        if ch is None or s0 < 1.0: continue
        if si > 0 and SEG[si - 1][1] == ch and s0 in (9.0,): continue  # G continues through 9.0
        s1 = SEG[si + 1][0]
        if ch == "G" and s0 == 7.0: s1 = 10.5
        n = int((s1 - s0 + 0.7) * SR)
        t = np.arange(n) / SR
        env = np.interp(t, [0, 0.35, s1 - s0, s1 - s0 + 0.65], [0, 1, 1, 0])
        for m in CHORDS[ch][3]:
            f = float(mtof(m))
            for vi, (det, pp) in enumerate(((-8, -0.6), (0, 0.0), (8, 0.6))):
                ph = np.cumsum(np.full(n, f * 2 ** (det / 1200) / SR))
                v = (2 * (ph % 1) - 1) * 0.5 + 0.0
                gl, gr = np.cos((pp + 1) * np.pi / 4), np.sin((pp + 1) * np.pi / 4)
                put(padL, v * env * gl, s0); put(padR, v * env * gr, s0)
            sn_ = np.sin(TWO_PI * f * t) * env * 0.6
            put(padL, sn_ * 0.7, s0); put(padR, sn_ * 0.7, s0)
    fc = interp_curve([(0, 400), (1, 500), (3, 900), (6, 1200), (9, 1000), (10.4, 5000), (10.5, 1800), (13, 1500),
                       (16.5, 5500), (17.0, 3000), (17.5, 1600), (21, 1600), (21.05, 2800), (24, 700)], log=True)
    gp = interp_curve([(0, 0), (1, 0), (3, .5), (6, .6), (8, .7), (9, .9), (10.4, 1.1), (10.5, .65), (13, .65),
                       (15.5, 1.0), (17, 1.0), (17.5, .45), (21, .45), (21.05, .85), (22.5, .55), (24, 0)])
    pad = np.stack([tv_filter(padL, fc), tv_filter(padR, fc)], axis=1)
    pad = set_rms(pad, -25)
    pad = pad * gp[:, None] * duck[:, None]

    # ---- vinyl / noise bed
    r = R("vinyl")
    hiss = np.stack([filt(r.standard_normal(N), [120, 4200], "band"), filt(r.standard_normal(N), [120, 4200], "band")], 1)
    hiss = set_rms(hiss, -50)
    crack = np.zeros((N, 2))
    nc = int(DUR * 5.5)
    for t in np.sort(r.uniform(0.05, DUR - 0.2, nc)):
        a = r.uniform(0.02, 0.22) ** 1.5
        n = int(0.004 * SR)
        e = r.standard_normal(n) * np.exp(-np.arange(n) / (0.0008 * SR))
        put(crack, pan(filt(e, 900, "high") * a, r.uniform(-0.8, 0.8)), t)
    crack *= db(-40) / (np.abs(crack).max() + 1e-9)
    # slow "tape" breathing on the hiss
    breath = 1 + 0.25 * np.sin(TWO_PI * 0.13 * np.arange(N) / SR)
    vinyl = (hiss * breath[:, None] + crack)
    vinyl *= interp_curve([(0, 1.1), (1, 1.0), (9, 1.0), (24, 0.9)])[:, None]

    # ---- sum with reverb sends
    dry = arp * db(0) + kk + hh + sn + bass + pad
    send = arp * 0.45 + pad * 0.5 + hh * 0.2 + sn * 0.5
    wet = reverb(send, 1.6, 1.0, "m2")[:N] - np.concatenate([send, np.zeros((int(1.6 * SR), 2))])[:N]
    m = dry + 0.28 * wet + vinyl
    m = np.tanh(1.15 * m) / 1.15
    m = np.stack([filt(m[:, 0], 12500), filt(m[:, 1], 12500)], 1)
    m = np.stack([filt(m[:, 0], 28, "high"), filt(m[:, 1], 28, "high")], 1)
    # gentle width: side +8 %
    mid, side = (m[:, 0] + m[:, 1]) / 2, (m[:, 0] - m[:, 1]) / 2
    m = np.stack([mid + side * 1.08, mid - side * 1.08], 1)
    # master fade: music resolves, ends in true silence at 24.0
    m *= interp_curve([(0, 1), (22.2, 1), (24, 0)])[:, None] ** 2
    m[-1] = 0
    # near-silence in the first second (clicks only): ride vinyl, pad is already 0 until 1.0
    return m


# ------------------------------------------------------------------- SFX
def key_click(v):
    r = R("kc%d" % v)
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = [2600, 3200, 2300, 3700, 1900][v - 1]
    y = filt(r.standard_normal(n), [f / 1.5, f * 1.5], "band") * np.exp(-t / 0.004)
    y += 0.7 * np.sin(TWO_PI * (140 + 25 * v) * t) * np.exp(-t / 0.009)
    up = int(0.045 * SR)  # key release tick
    y[up:] += 0.28 * filt(r.standard_normal(n - up), [f / 1.2, f * 1.8], "band") * np.exp(-t[: n - up] / 0.002)
    if v == 5:  # "enter": heavier, lower
        y = filt(y, 2200) * 1.2 + 0.6 * np.sin(TWO_PI * 95 * t) * np.exp(-t / 0.02)
    return pan(y, [-0.1, 0.12, -0.05, 0.08, 0.0][v - 1])


def chip_mono(f, dur, tau, duty, osr=4, glide=0.0):
    n = int((dur + 0.02) * SR * osr)
    t = np.arange(n) / (SR * osr)
    fr = f * 2 ** (glide * np.exp(-t / 0.012))
    ph = np.cumsum(fr / (SR * osr))
    w = np.where((ph % 1) < duty, 1.0, -1.0) - (2 * duty - 1)
    env = np.minimum(t / 0.002, 1) * np.exp(-t / tau) * np.clip((dur + 0.02 - t) / 0.015, 0, 1)
    return signal.resample_poly(w * env, 1, osr)


def blip_step(i):
    m = [72, 74, 76, 79, 81, 84][i - 1]
    f = float(mtof(m))
    y = chip_mono(f, 0.16, 0.07, 0.25, glide=-0.5)
    n = len(y); t = np.arange(n) / SR
    y = y + 0.35 * np.sin(TWO_PI * f * 2 * t) * np.exp(-t / 0.05)
    y = filt(y, 7000)
    return pan(y, -0.1 + 0.04 * i)


PENT = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86]


def cell_tick(m):
    f = float(mtof(m))
    y = chip_mono(f, 0.05, 0.02, 0.125, glide=0.25)
    n = len(y); t = np.arange(n) / SR
    y += 0.4 * filt(R("ct").standard_normal(n), 3000, "high") * np.exp(-t / 0.002)
    return pan(filt(y, 8000), (m % 7) / 7 * 0.5 - 0.25)


def whoosh():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    fc = np.where(t < 1.0, 350 * (7500 / 350) ** (t / 1.0), 7500 * (1500 / 7500) ** ((t - 1.0) / 0.6))
    amp = np.where(t < 1.0, (t / 1.0) ** 2.2, np.exp(-(t - 1.0) / 0.12))
    ch = []
    for c in range(2):
        nz = R("wh%d" % c).standard_normal(n)
        ch.append(tv_filter(nz, fc, "band", order=2, bw=1.5))
    sweep = np.sin(np.cumsum(mtof(48 + 24 * np.clip(t, 0, 1.0) ** 2) / SR) * TWO_PI) * 0.12
    pn = np.sin(np.pi / 2 * np.clip(t / 1.4, 0, 1))
    y = np.stack([ch[0] * (1.2 - 0.6 * pn), ch[1] * (0.6 + 0.6 * pn)], 1)
    y = (y + sweep[:, None]) * amp[:, None]
    return fade(y, 0.02, 0.05)


def drop_thud():
    n = int(1.3 * SR)
    t = np.arange(n) / SR
    f = 36 + 80 * np.exp(-t / 0.06)
    y = np.sin(np.cumsum(f) / SR * TWO_PI) * np.exp(-t / 0.3) * np.minimum(t / 0.001, 1)
    y += 0.5 * filt(R("thud").standard_normal(n), 300) * np.exp(-t / 0.05)
    y += 0.25 * np.sin(TWO_PI * 72 * t) * np.exp(-t / 0.12)
    y = np.tanh(1.8 * y)
    return fade(pan(y, 0), 0, 0.2)


def pop():
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    f = 380 + 1900 * (1 - np.exp(-t / 0.012))
    y = np.sin(np.cumsum(f) / SR * TWO_PI) * np.exp(-t / 0.045) * 0.9
    y += 0.5 * filt(R("pop").standard_normal(n), 4000, "high") * np.exp(-t / 0.008)
    st = pan(y, 0)
    for j, (m, p, d) in enumerate(((96, -0.5, 0.0), (100, 0.5, 0.025), (103, -0.2, 0.05), (108, 0.3, 0.08))):
        k = int(d * SR)
        b = np.sin(TWO_PI * float(mtof(m)) * t[: n - k]) * np.exp(-t[: n - k] / 0.16) * 0.2
        st[k:] += pan(b, p)
    return fade(reverb(st, 0.5, 0.25, "pop")[: n], 0, 0.1)


def swell():
    n = int(4.0 * SR)
    t = np.arange(n) / SR
    amp = np.where(t < 3.5, (t / 3.5) ** 2.2, 0.5 + 0.5 * np.cos(np.pi * (t - 3.5) / 0.5))
    amp = np.where(t < 3.5, amp, np.clip(amp, 0, 1))
    fc = 300 * (6000 / 300) ** np.clip(t / 3.5, 0, 1)
    L = np.zeros(n); Rr = np.zeros(n)
    for m in (48, 55, 60, 67, 74):
        f = float(mtof(m))
        for det, pp in ((-9, -0.7), (0, 0), (9, 0.7)):
            ph = np.cumsum(np.full(n, f * 2 ** (det / 1200) / SR))
            v = 2 * (ph % 1) - 1
            L += v * np.cos((pp + 1) * np.pi / 4); Rr += v * np.sin((pp + 1) * np.pi / 4)
    L = tv_filter(L, fc); Rr = tv_filter(Rr, fc)
    sh = [filt(tv_filter(R("swn%d" % c).standard_normal(n), 1500 + 3500 * np.clip(t / 3.5, 0, 1), "high"), 8500) * 0.25 for c in range(2)]
    y = np.stack([L + sh[0] * 1.2, Rr + sh[1] * 1.2], 1) * amp[:, None]
    return fade(y, 0.05, 0.1)


def bell(m, dur=3.0, tau=0.75):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = float(mtof(m))
    y = np.zeros(n)
    for ratio, g, tt in ((1, 1.0, 1.0), (2.0, 0.45, 0.6), (3.01, 0.25, 0.4), (4.2, 0.12, 0.28), (5.43, 0.07, 0.2)):
        y += g * np.sin(TWO_PI * f * ratio * t) * np.exp(-t / (tau * tt))
    return y * np.minimum(t / 0.002, 1)


def chime_end():
    n = int(3.0 * SR)
    st = np.zeros((n, 2))
    for j, (m, p) in enumerate(((84, -0.3), (88, 0.3), (91, -0.15), (96, 0.2))):
        put(st, pan(bell(m) * (0.8 if j < 3 else 1.0), p), 0.07 * j)
    st = reverb(st, 1.4, 0.35, "chime")[:n]
    return fade(st, 0, 0.7)


def ui_tap():
    n = int(0.14 * SR)
    t = np.arange(n) / SR
    y = np.sin(np.cumsum(620 - 230 * (1 - np.exp(-t / 0.02))) / SR * TWO_PI) * np.exp(-t / 0.02)
    y += 0.4 * filt(R("tap").standard_normal(n), [1500, 5000], "band") * np.exp(-t / 0.003)
    return pan(y, 0)


def rain_soft():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    r = R("rain")
    bed = np.stack([filt(r.standard_normal(n), [1200, 7500], "band") for _ in range(2)], 1) * 0.35
    drops = np.zeros((n, 2))
    for tt in np.sort(r.uniform(0, 2.0, 70)):
        f = r.uniform(2200, 5200)
        k = int(0.03 * SR); tk = np.arange(k) / SR
        put(drops, pan(np.sin(TWO_PI * f * tk) * np.exp(-tk / 0.003) * r.uniform(0.2, 0.9), r.uniform(-0.9, 0.9)), tt)
    return fade((bed + drops * 0.8) * (0.8 + 0.2 * np.sin(TWO_PI * 0.7 * t))[:, None], 0.4, 0.6)


def zzz_bubble():
    n = int(1.5 * SR)
    st = np.zeros((n, 2))
    for j, (t0, f0, p) in enumerate(((0.0, 380, -0.25), (0.38, 450, 0.0), (0.80, 540, 0.25))):
        k = int(0.4 * SR); t = np.arange(k) / SR
        f = f0 * (1 + 1.2 * (1 - np.exp(-t / 0.05)))
        f = f * (1 + 0.01 * np.sin(TWO_PI * 9 * t))
        b = np.sin(np.cumsum(f) / SR * TWO_PI) * np.exp(-t / 0.07) * np.minimum(t / 0.004, 1)
        b += 0.25 * filt(R("zz%d" % j).standard_normal(k), [2500, 5000], "band") * np.exp(-t / 0.02)
        put(st, pan(b, p), t0)
    return fade(reverb(st, 0.6, 0.3, "zzz")[:n], 0.003, 0.2)


# ------------------------------------------------------------------ build
def build_sfx():
    S = {}   # name -> (stereo, peak_offset_seconds)
    for v in range(1, 6): S["key_click_%d" % v] = (key_click(v), 0.0)
    for i in range(1, 7): S["blip_step_%d" % i] = (blip_step(i), 0.0)
    S["cell_tick"] = (cell_tick(76), 0.0)
    for i, m in enumerate(PENT, 1): S["cell_tick_%02d" % i] = (cell_tick(m), 0.0)
    S["whoosh"] = (whoosh(), 1.0)
    S["drop_thud"] = (drop_thud(), 0.0)
    S["pop"] = (pop(), 0.0)
    S["swell"] = (swell(), 3.5)
    S["chime_end"] = (chime_end(), 0.0)
    S["ui_tap"] = (ui_tap(), 0.0)
    S["rain_soft"] = (rain_soft(), 0.0)
    S["zzz_bubble"] = (zzz_bubble(), 0.0)
    out = {}
    for k, (x, po) in S.items():
        out[k] = (peak_norm(x, 0.7), po)
        write_wav(os.path.join(SFX_DIR, k + ".wav"), out[k][0])
    return out


def build_cues(sfx):
    cues = []   # (t, name, gain_db, note)
    r = R("typing")
    t = 0.30
    i = 0
    while t < 1.84:
        cues.append((round(t, 3), "key_click_%d" % (1 + (i * 3 + int(r.integers(0, 3))) % 4), -13 + float(r.uniform(-2, 1)), "typing"))
        t += float(r.uniform(0.06, 0.12)); i += 1
    cues.append((1.90, "key_click_5", -9, "enter"))
    for t, i in zip([2.0, 2.5, 3.0, 4.0, 4.5, 5.5], range(1, 7)):
        cues.append((t, "blip_step_%d" % i, -9, "step %d: Checking/Queue/Codex writing/Testing/Drawing/Live" % i))
    for i in range(12):
        cues.append((6.0 + 0.125 * i, "cell_tick_%02d" % (i + 1), -12, "sprite cell %d assembles" % (i + 1)))
    cues.append((8.0, "whoosh", -9, "peaks at 9.0 (peak_offset 1.0 s)"))
    cues.append((10.5, "drop_thud", -3, "arrival drop"))
    cues.append((10.5, "pop", -8, "arrival drop, bright pop"))
    cues.append((13.0, "swell", -10, "room reveal swell, peaks at 16.5"))
    for j, tt in enumerate([13.75, 14.0, 14.125, 14.375, 14.5, 14.75, 14.875, 15.25]):
        cues.append((tt, "cell_tick_%02d" % (3 + (j * 5) % 9), -16, "pixel-dissolve sparkle"))
    for tt in (17.0, 17.5, 18.0, 18.5):
        cues.append((tt, "ui_tap", -10, "phone montage tap"))
    cues.append((19.0, "rain_soft", -13, "Moody (rain)"))
    cues.append((20.0, "zzz_bubble", -11, "Sleep (zzz)"))
    cues.append((20.5, "ui_tap", -9, "Poke"))
    cues.append((20.5, "pop", -9, "Poke special attack"))
    cues.append((21.0, "chime_end", -4, "end resolve; tail ~2.5 s, silent by 24.0"))
    return sorted(cues, key=lambda c: (c[0], c[1]))


def main():
    music = build_music()
    sfx = build_sfx()
    cues = build_cues(sfx)

    # music.wav at -14 LUFS
    g = 1.0
    for _ in range(3):
        x = limiter(music * g)
        write_wav(os.path.join(HERE, "music.wav"), x)
        l, tp = measure(os.path.join(HERE, "music.wav"))
        g *= db(-14.0 - l)
    music_g = g

    # mix: music slightly under, SFX on top, normalise whole to -14 LUFS
    sfx_bus = np.zeros((N, 2))
    for t, name, gdb, _ in cues:
        x = sfx[name][0] * db(gdb)
        put(sfx_bus, x, t)
    final_fade = interp_curve([(0, 1), (23.2, 1), (24, 0)])[:, None]
    g = music_g * 0.95
    sg = 1.0
    for _ in range(4):
        x = (music * g + sfx_bus * sg * g / music_g) * final_fade
        x = limiter(x)
        x[-1] = 0
        write_wav(os.path.join(HERE, "mix.wav"), x)
        l, tp = measure(os.path.join(HERE, "mix.wav"))
        k = db(-14.0 - l)
        g *= k
    ml, mtp = measure(os.path.join(HERE, "music.wav"))
    xl, xtp = measure(os.path.join(HERE, "mix.wav"))

    # cues.json (gain_db here is relative to the normalised sfx file; mix adds a master gain)
    out = {
        "bpm": BPM,
        "sample_rate": SR,
        "duration": DUR,
        "beats": [round(i * 60 / BPM, 3) for i in range(int(DUR * BPM / 60))],
        "sections": {"hook": [0, 2], "build": [2, 6], "sheet": [6, 9], "arrival": [9, 13], "room": [13, 17],
                     "pet": [17, 21], "end": [21, 24]},
        "key": "C major (C Am F G)",
        "master_gain_db": round(20 * np.log10(g / music_g), 2),
        "loudness": {"music_lufs": ml, "music_tp": mtp, "mix_lufs": xl, "mix_tp": xtp},
        "note": "t = time the sfx file STARTS in mix.wav. For whoosh the energy peaks at t+peak_offset (=9.0); for swell peak is t+3.5. "
                "Every cue is also available as an individual file in sfx/ for re-placing.",
        "cues": [{"t": t, "name": n, "file": "sfx/%s.wav" % n, "gain_db": round(gd, 1), "dur": round(len(sfx[n][0]) / SR, 3),
                  "peak_offset": sfx[n][1], "note": note} for t, n, gd, note in cues],
    }
    with open(os.path.join(HERE, "cues.json"), "w") as f:
        json.dump(out, f, indent=1)

    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", os.path.join(HERE, "mix.wav"),
                    "-filter_complex",
                    "[0:a]asplit[a][b];[a]showwavespic=s=1600x260:colors=#f2a65a|#5fb3a1[w];"
                    "[b]showspectrumpic=s=1600x360:legend=0[s];[w][s]vstack",
                    "-frames:v", "1", os.path.join(HERE, "mix.png")], check=True)
    print("music  LUFS %.1f  TP %.1f dBFS" % (ml, mtp))
    print("mix    LUFS %.1f  TP %.1f dBFS" % (xl, xtp))
    print("sfx files:", len(os.listdir(SFX_DIR)), " cues:", len(cues))


if __name__ == "__main__":
    main()
