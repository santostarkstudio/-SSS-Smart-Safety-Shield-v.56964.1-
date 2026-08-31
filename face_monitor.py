"""
AuraFarming Auto-Editor
Author: santostark

Fully automated, real-time Python application for AI face tracking, recording,
and aggressive cinematic montage generation synced to music across 4 dynamic cycles:
Cycle 1: "Aura Strike" (1000180359.mp4 full soundtrack & video sync, speed ramps, neon grade, chromatic flares)
Cycle 2: "Sigma" Edit (Moody, desaturated grade, speed ramping, motion-blur flash transitions)
Cycle 3: "Second" Edit (Warm filmic grade, continuous Ken Burns zoom, letterbox, 0.6s micro-cuts)
Cycle 4: "Phonk Zoom" Edit (14 fast micro-cuts, sliding cutout overlay, vertical slide wipes, impact shakes, GTA WASTED stinger)
"""

import cv2
import tkinter as tk
from PIL import Image, ImageTk
import numpy as np
import time
import os
import glob
import random
import threading
import math
import subprocess
import platform
import shutil
import wave
import ctypes

# Optional native Windows audio fallback
try:
    import winsound
except ImportError:
    winsound = None


# ============== PATH CONFIGURATION ==============

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDING_DIR = os.path.join(PROJECT_DIR, "recording")

# Cycle 1: Aura Strike (1000180359.mp4)
CYCLE1_SOURCE = r"C:\Users\santo\Downloads\1000180359.mp4"
CYCLE1_VIDEO = os.path.join(PROJECT_DIR, "cycle1.mp4")
CYCLE1_AUDIO = os.path.join(PROJECT_DIR, "cycle1.wav")

# Cycle 2: Sigma
SIGMA_VIDEO = os.path.join(PROJECT_DIR, "sigma.mp4")
SIGMA_AUDIO = os.path.join(PROJECT_DIR, "sigma.wav")

# Cycle 3: Second
SECOND_VIDEO = os.path.join(PROJECT_DIR, "second.mp4")
SECOND_AUDIO = os.path.join(PROJECT_DIR, "second.wav")

# Cycle 4: Phonk Zoom
THIRD_VIDEO = os.path.join(PROJECT_DIR, "third.mp4")
THIRD_AUDIO = os.path.join(PROJECT_DIR, "third.wav")

WAITING_WAV = os.path.join(PROJECT_DIR, "waiting.wav")
CONFIRM_WAV = os.path.join(PROJECT_DIR, "confim.wav")
EDIT_OUTPUT = os.path.join(PROJECT_DIR, "sigma_edit_output.mp4")

# ============== EDIT CONFIGURATION ==============

RECORD_DURATION_SEC = 15     # Total recording duration (5 micro-clips x 3s)
CLIP_CHUNK_SEC = 3           # Duration of each micro-clip recorded
EDIT_CLIP_DURATION = 3       # Base clip length for montage
EDIT_USER_CLIPS = 5          # Number of user clip segments in montage
EDIT_SIGMA_CLIPS = 0         # Additional sigma asset cuts (0 = 100% user footage)
FADE_FRAMES = 8              # Frames for dip-to-black intro/outro transitions


# ============== ROBUST FFMPEG & AUDIO EXTRACTOR ==============

def get_ffmpeg_binary():
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(exe):
            return exe
    except Exception:
        pass

    local_ffmpeg = os.path.join(PROJECT_DIR, "ffmpeg.exe")
    if os.path.exists(local_ffmpeg):
        return local_ffmpeg

    return "ffmpeg"


def extract_audio_from_video(video_path, output_audio_path):
    if not os.path.exists(video_path):
        return False
    if os.path.exists(output_audio_path) and os.path.getsize(output_audio_path) > 1000:
        return True
        
    ffmpeg_bin = get_ffmpeg_binary()
    cmd = [
        ffmpeg_bin, "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "2",
        output_audio_path
    ]
    kwargs = {}
    if hasattr(subprocess, 'CREATE_NO_WINDOW'):
        kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        
    try:
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **kwargs)
        if res.returncode == 0 and os.path.exists(output_audio_path) and os.path.getsize(output_audio_path) > 1000:
            print(f"[AUDIO ENGINE] Extracted full soundtrack: {os.path.basename(output_audio_path)}")
            return True
    except Exception:
        pass
        
    return False


def get_audio_duration(file_path, default=15.0):
    if not os.path.exists(file_path):
        return default
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".wav":
        try:
            with wave.open(file_path, 'rb') as w:
                return w.getnframes() / float(w.getframerate())
        except Exception:
            pass
    try:
        cap = cv2.VideoCapture(file_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        cap.release()
        if fps > 0 and frames > 0:
            return frames / fps
    except Exception:
        pass
    return default


def ensure_all_audio_tracks():
    if not os.path.exists(CYCLE1_VIDEO) and os.path.exists(CYCLE1_SOURCE):
        try:
            print(f"[IMPORT] Copying {CYCLE1_SOURCE} -> {CYCLE1_VIDEO}")
            shutil.copy2(CYCLE1_SOURCE, CYCLE1_VIDEO)
        except Exception:
            pass

    src_c1 = CYCLE1_VIDEO if os.path.exists(CYCLE1_VIDEO) else CYCLE1_SOURCE
    if os.path.exists(src_c1):
        extract_audio_from_video(src_c1, CYCLE1_AUDIO)

    extract_audio_from_video(SIGMA_VIDEO, SIGMA_AUDIO)
    extract_audio_from_video(SECOND_VIDEO, SECOND_AUDIO)
    if not os.path.exists(THIRD_AUDIO) and os.path.exists(THIRD_VIDEO):
        extract_audio_from_video(THIRD_VIDEO, THIRD_AUDIO)


def get_cycle_soundtrack(cycle_name):
    if cycle_name in ["aura", "cycle1"]:
        if os.path.exists(CYCLE1_AUDIO):
            return CYCLE1_AUDIO
        elif os.path.exists(CYCLE1_VIDEO):
            return CYCLE1_VIDEO
        elif os.path.exists(CYCLE1_SOURCE):
            return CYCLE1_SOURCE
        return SIGMA_AUDIO if os.path.exists(SIGMA_AUDIO) else SIGMA_VIDEO
    elif cycle_name == "sigma":
        return SIGMA_AUDIO if os.path.exists(SIGMA_AUDIO) else SIGMA_VIDEO
    elif cycle_name == "second":
        return SECOND_AUDIO if os.path.exists(SECOND_AUDIO) else SECOND_VIDEO
    else:
        return THIRD_AUDIO if os.path.exists(THIRD_AUDIO) else THIRD_VIDEO


# ============== ROBUST CROSS-PLATFORM AUDIO ENGINE ==============

class WindowsMCIPlayer:
    def __init__(self):
        self.winmm = ctypes.windll.winmm if platform.system() == "Windows" else None
        
    def play(self, file_path, async_play=True):
        if self.winmm is None or not os.path.exists(file_path):
            return False
            
        self.stop()
        abs_path = os.path.abspath(file_path).replace('/', '\\')
        cmd_open = f'open "{abs_path}" type mpegvideo alias aura_audio'
        res = self.winmm.mciSendStringW(cmd_open, None, 0, 0)
        if res != 0:
            cmd_open = f'open "{abs_path}" alias aura_audio'
            res = self.winmm.mciSendStringW(cmd_open, None, 0, 0)
            
        if res == 0:
            play_cmd = 'play aura_audio from 0' if async_play else 'play aura_audio from 0 wait'
            self.winmm.mciSendStringW(play_cmd, None, 0, 0)
            return True
        return False
        
    def stop(self):
        if self.winmm is not None:
            try:
                self.winmm.mciSendStringW('stop aura_audio', None, 0, 0)
                self.winmm.mciSendStringW('close aura_audio', None, 0, 0)
            except Exception:
                pass
                
    def terminate(self):
        self.stop()


_mci_player = WindowsMCIPlayer() if platform.system() == "Windows" else None


def play_audio(file_path, async_play=True):
    if not os.path.exists(file_path):
        return None

    system = platform.system()
    ext = os.path.splitext(file_path)[1].lower()

    if system == "Windows" and winsound is not None:
        wav_candidate = file_path if ext == ".wav" else os.path.splitext(file_path)[0] + ".wav"
        if os.path.exists(wav_candidate):
            try:
                flags = winsound.SND_FILENAME
                if async_play:
                    flags |= winsound.SND_ASYNC
                winsound.PlaySound(wav_candidate, flags)

                class WinsoundHandle:
                    def terminate(self):
                        try:
                            winsound.PlaySound(None, winsound.SND_PURGE)
                        except Exception:
                            pass
                    def stop(self):
                        self.terminate()

                return WinsoundHandle()
            except Exception:
                pass

    if system == "Windows" and _mci_player is not None:
        try:
            if _mci_player.play(file_path, async_play=async_play):
                return _mci_player
        except Exception:
            pass

    cmd = []
    kwargs = {}
    if system == "Darwin":
        cmd = ['afplay', file_path]
    elif system == "Windows":
        cmd = ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', file_path]
        if hasattr(subprocess, 'CREATE_NO_WINDOW'):
            kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
    else:
        cmd = ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', file_path]

    try:
        if async_play:
            return subprocess.Popen(cmd, **kwargs)
        else:
            return subprocess.run(cmd, **kwargs)
    except Exception:
        return None


# ============== FACE DETECTOR INITIALIZER ==============

_cached_cascade = None

def get_face_detector():
    global _cached_cascade
    if _cached_cascade is not None and not _cached_cascade.empty():
        return _cached_cascade
        
    local_path = os.path.join(PROJECT_DIR, "haarcascade_frontalface_default.xml")
    if os.path.exists(local_path):
        c = cv2.CascadeClassifier(local_path)
        if not c.empty():
            _cached_cascade = c
            return _cached_cascade
            
    if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
        cv_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        if os.path.exists(cv_path):
            c = cv2.CascadeClassifier(cv_path)
            if not c.empty():
                _cached_cascade = c
                return _cached_cascade

    try:
        import site
        for sp in site.getsitepackages():
            candidate = os.path.join(sp, "cv2", "data", "haarcascade_frontalface_default.xml")
            if os.path.exists(candidate):
                c = cv2.CascadeClassifier(candidate)
                if not c.empty():
                    _cached_cascade = c
                    return _cached_cascade
    except Exception:
        pass

    try:
        import urllib.request
        url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        print("[AI] Downloading face detector model (haarcascade_frontalface_default.xml)...")
        urllib.request.urlretrieve(url, local_path)
        if os.path.exists(local_path):
            c = cv2.CascadeClassifier(local_path)
            if not c.empty():
                _cached_cascade = c
                return _cached_cascade
    except Exception as e:
        print(f"[AI] Cascade download note: {e}")

    _cached_cascade = cv2.CascadeClassifier()
    return _cached_cascade


# ============== FAST COLOR & FILTER PIPELINES ==============

_contrast_lut = np.clip((np.arange(256, dtype=np.float32) - 128) * 1.25 + 128, 0, 255).astype(np.uint8)
_warm_r_lut = np.clip(np.arange(256, dtype=np.int16) + 20, 0, 255).astype(np.uint8)
_warm_b_lut = np.clip(np.arange(256, dtype=np.int16) - 16, 0, 255).astype(np.uint8)
_vignette_lut_cache = {}
_noise_cache = {}
_noise_idx = 0


def fast_cinematic_grade(frame):
    img = cv2.LUT(frame, _contrast_lut)
    b, g, r = cv2.split(img)
    b = cv2.add(b, 8)
    r = cv2.add(r, 6)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    b = cv2.addWeighted(b, 0.82, gray, 0.18, 0)
    g = cv2.addWeighted(g, 0.82, gray, 0.18, 0)
    r = cv2.addWeighted(r, 0.82, gray, 0.18, 0)
    return cv2.merge([b, g, r])


def fast_cinematic_grade_warm(frame):
    b, g, r = cv2.split(frame)
    b = cv2.LUT(b, _warm_b_lut)
    r = cv2.LUT(r, _warm_r_lut)
    img = cv2.merge([b, g, r])
    h, w = frame.shape[:2]
    small = cv2.resize(img, (w // 4, h // 4))
    blur_small = cv2.GaussianBlur(small, (15, 15), 0)
    blur = cv2.resize(blur_small, (w, h))
    return cv2.addWeighted(img, 0.85, blur, 0.25, 0)


def apply_fast_vignette(frame, strength=0.65):
    h, w = frame.shape[:2]
    key = (h, w)
    if key not in _vignette_lut_cache:
        kx = cv2.getGaussianKernel(w, w * 0.48)
        ky = cv2.getGaussianKernel(h, h * 0.48)
        mask = ky * kx.T
        mask = mask / mask.max()
        mask = 1.0 - strength * (1.0 - mask)
        v_mask = (mask * 255).astype(np.uint8)
        _vignette_lut_cache[key] = cv2.merge([v_mask, v_mask, v_mask])
    vignette = _vignette_lut_cache[key]
    return cv2.multiply(frame, vignette, scale=1.0 / 255.0)


def apply_fast_grain(frame, amount=8):
    global _noise_idx
    h, w = frame.shape[:2]
    key = (h, w)
    if key not in _noise_cache:
        buffers = []
        for _ in range(8):
            noise = np.random.randint(-amount, amount, (h, w, 3), dtype=np.int16)
            buffers.append(noise)
        _noise_cache[key] = buffers
    noise = _noise_cache[key][_noise_idx % 8]
    _noise_idx += 1
    return np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def apply_chromatic_aberration(frame, shift=6):
    b, g, r = cv2.split(frame)
    rows, cols = r.shape
    r = cv2.warpAffine(r, np.float32([[1, 0, shift], [0, 1, 0]]), (cols, rows))
    b = cv2.warpAffine(b, np.float32([[1, 0, -shift], [0, 1, 0]]), (cols, rows))
    return cv2.merge([b, g, r])


def apply_letterbox(frame, ratio=0.12):
    h, w = frame.shape[:2]
    bar = int(h * ratio / 2)
    frame[:bar, :] = 0
    frame[h - bar:, :] = 0
    return frame


def apply_zoom(frame, zoom_factor):
    if zoom_factor <= 1.001:
        return frame
    h, w = frame.shape[:2]
    nw, nh = int(w / zoom_factor), int(h / zoom_factor)
    x1, y1 = (w - nw) // 2, (h - nh) // 2
    return cv2.resize(frame[y1:y1 + nh, x1:x1 + nw], (w, h))


def apply_speed_ramp(frames):
    n = len(frames)
    if n < 30:
        return frames
    out_frames = []
    p0 = (0, 0)
    p1 = (int(n * 0.15), int(n * 0.4))
    p2 = (int(n * 0.85), int(n * 0.6))
    p3 = (n - 1, n - 1)
    
    def get_j(i):
        if i <= p1[0]:
            progress = i / p1[0] if p1[0] > 0 else 0
            return p0[1] + progress * (p1[1] - p0[1])
        elif i <= p2[0]:
            progress = (i - p1[0]) / (p2[0] - p1[0])
            return p1[1] + progress * (p2[1] - p1[1])
        else:
            progress = (i - p2[0]) / (p3[0] - p2[0])
            return p2[1] + progress * (p3[1] - p2[1])
            
    for i in range(n):
        j_float = get_j(i)
        j_int = max(0, min(n - 1, int(round(j_float))))
        out_frames.append(frames[j_int])
    return out_frames


# ============== TRANSITIONS & EFFECTS ==============

def motion_blur_flash_transition(clip_a, clip_b, transition_frames=6):
    if len(clip_a) < transition_frames or len(clip_b) < transition_frames:
        return clip_a + clip_b
    result = list(clip_a[:-transition_frames])
    for i in range(transition_frames):
        alpha = (i + 1) / transition_frames
        frame = clip_a[-(transition_frames - i)]
        k_size = max(1, int(17 * alpha))
        if k_size % 2 == 0:
            k_size += 1
        kernel = np.zeros((k_size, k_size))
        kernel[int((k_size - 1) / 2), :] = np.ones(k_size) / k_size
        blurred = cv2.filter2D(frame, -1, kernel)
        zf = 1.0 + alpha * 0.20
        zoomed = apply_zoom(blurred, zf)
        white = np.full_like(zoomed, 255)
        flashed = cv2.addWeighted(zoomed, 1.0 - alpha * 0.85, white, alpha * 0.85, 0)
        if alpha > 0.5:
            flashed = apply_chromatic_aberration(flashed, shift=int(6 * alpha))
        result.append(flashed)
    for i in range(transition_frames):
        alpha = 1.0 - (i / transition_frames)
        frame = clip_b[i]
        k_size = max(1, int(17 * alpha))
        if k_size % 2 == 0:
            k_size += 1
        kernel = np.zeros((k_size, k_size))
        kernel[int((k_size - 1) / 2), :] = np.ones(k_size) / k_size
        blurred = cv2.filter2D(frame, -1, kernel)
        zf = 1.0 + alpha * 0.20
        zoomed = apply_zoom(blurred, zf)
        white = np.full_like(zoomed, 255)
        flashed = cv2.addWeighted(zoomed, 1.0 - alpha * 0.85, white, alpha * 0.85, 0)
        if alpha > 0.5:
            flashed = apply_chromatic_aberration(flashed, shift=int(6 * alpha))
        result.append(flashed)
    result.extend(clip_b[transition_frames:])
    return result


def zoom_flash_transition(clip_a, clip_b, transition_frames=6):
    if len(clip_a) < transition_frames or len(clip_b) < transition_frames:
        return clip_a + clip_b
    result = list(clip_a[:-transition_frames])
    for i in range(transition_frames):
        alpha = (i + 1) / transition_frames
        zf = 1.0 + alpha * 0.25
        zoomed = apply_zoom(clip_a[-(transition_frames - i)], zf)
        white = np.full(zoomed.shape, 255, dtype=np.uint8)
        flashed = cv2.addWeighted(zoomed, 1.0 - alpha, white, alpha, 0)
        result.append(flashed)
    for i in range(transition_frames):
        alpha = 1.0 - (i / transition_frames)
        zf = 1.0 + alpha * 0.25
        zoomed = apply_zoom(clip_b[i], zf)
        white = np.full(zoomed.shape, 255, dtype=np.uint8)
        flashed = cv2.addWeighted(zoomed, 1.0 - alpha, white, alpha, 0)
        result.append(flashed)
    result.extend(clip_b[transition_frames:])
    return result


def vertical_slide_wipe_transition(clip_a, clip_b, transition_frames=4):
    if len(clip_a) < transition_frames or len(clip_b) < transition_frames:
        return clip_a + clip_b
    result = list(clip_a[:-transition_frames])
    h, w = clip_a[0].shape[:2]
    for i in range(transition_frames):
        alpha = (i + 1) / transition_frames
        y_offset = int(h * (1.0 - alpha))
        frame_a = clip_a[-(transition_frames - i)]
        frame_b = clip_b[i]
        comp = frame_a.copy()
        if y_offset < h:
            comp[y_offset:h, :] = frame_b[0:(h - y_offset), :]
        result.append(comp)
    result.extend(clip_b[transition_frames:])
    return result


def apply_impact_shake(frame, opacity=0.5):
    k = 25
    kernel = np.zeros((k, k))
    kernel[int((k - 1) / 2), :] = np.ones(k) / k
    blurred = cv2.filter2D(frame, -1, kernel)
    rows, cols = frame.shape[:2]
    M = np.float32([[1, 0, random.randint(-15, 15)], [0, 1, random.randint(-15, 15)]])
    shaken = cv2.warpAffine(blurred, M, (cols, rows))
    return cv2.addWeighted(frame, 1.0 - opacity, shaken, opacity, 0)


def apply_phonk_wasted_stinger(clip):
    if len(clip) == 0:
        return clip
    res = []
    text = "WASTED"
    font = cv2.FONT_HERSHEY_TRIPLEX
    scale = 3.0
    thick = 6
    for i, frame in enumerate(clip):
        if i == 0:
            res.append(np.full_like(frame, 255))
        elif i < 12:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.convertScaleAbs(gray, alpha=1.6, beta=-35)
            f = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
            progress = min(1.0, (i - 1) / 5.0)
            b = int(255 * (1.0 - progress) + 30 * progress)
            g = int(255 * (1.0 - progress) + 30 * progress)
            r = int(255 * (1.0 - progress) + 255 * progress)
            ts = cv2.getTextSize(text, font, scale, thick)[0]
            tx = (f.shape[1] - ts[0]) // 2
            ty = (f.shape[0] + ts[1]) // 2
            cv2.putText(f, text, (tx, ty), font, scale, (0, 0, 0), thick + 6, cv2.LINE_AA)
            cv2.putText(f, text, (tx, ty), font, scale, (b, g, r), thick, cv2.LINE_AA)
            res.append(f)
        else:
            res.append(frame)
    return res


def apply_cutout_slide(clip):
    if len(clip) == 0:
        return clip
    first_frame = clip[0]
    h, w = first_frame.shape[:2]
    detector = get_face_detector()
    faces = []
    if detector is not None and not detector.empty():
        try:
            small_gray = cv2.resize(cv2.cvtColor(first_frame, cv2.COLOR_BGR2GRAY), (w // 4, h // 4))
            faces = detector.detectMultiScale(small_gray, 1.1, 4)
        except Exception:
            faces = []
            
    if len(faces) > 0:
        fx_, fy_, fw_, fh_ = max(faces, key=lambda f: f[2] * f[3])
        x, y, fw, fh = fx_ * 4, fy_ * 4, fw_ * 4, fh_ * 4
    else:
        fw, fh = int(w * 0.35), int(h * 0.45)
        x, y = (w - fw) // 2, int(h * 0.2)
        
    pad_x = int(fw * 0.8)
    pad_y_top = int(fh * 0.6)
    pad_y_bot = int(fh * 1.6)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y_top)
    x2 = min(w, x + fw + pad_x)
    y2 = min(h, y + fh + pad_y_bot)
    
    cutout_w, cutout_h = x2 - x1, y2 - y1
    cutout, mask = None, None
    if cutout_w > 0 and cutout_h > 0:
        cutout_img = first_frame[y1:y2, x1:x2].copy()
        mask = np.zeros((cutout_h, cutout_w), dtype=np.float32)
        cv2.ellipse(mask, (cutout_w // 2, cutout_h // 2), (cutout_w // 2, cutout_h // 2), 0, 0, 360, 1.0, -1)
        mask = cv2.GaussianBlur(mask, (31, 31), 0)
        new_w, new_h = int(cutout_w * 1.6), int(cutout_h * 1.6)
        cutout = cv2.resize(cutout_img, (new_w, new_h))
        mask = cv2.resize(mask, (new_w, new_h))
        
    res = []
    fc = len(clip)
    for i, frame in enumerate(clip):
        out = frame.copy()
        if cutout is not None:
            progress = min(1.0, i / (fc * 0.45))
            ease = 1.0 - (1.0 - progress) ** 3 
            c_h, c_w = cutout.shape[:2]
            curr_x = (w - c_w) // 2
            curr_y = int(h + ((h - c_h + int(h * 0.08)) - h) * ease)
            y1, y2 = max(0, curr_y), min(h, curr_y + c_h)
            x1, x2 = max(0, curr_x), min(w, curr_x + c_w)
            cy1 = 0 if curr_y >= 0 else -curr_y
            cy2 = cy1 + (y2 - y1)
            cx1 = 0 if curr_x >= 0 else -curr_x
            cx2 = cx1 + (x2 - x1)
            if y2 > y1 and x2 > x1:
                roi = out[y1:y2, x1:x2].astype(np.float32)
                m = mask[cy1:cy2, cx1:cx2]
                m_inv = 1.0 - m
                c_crop = cutout[cy1:cy2, cx1:cx2].astype(np.float32)
                for c in range(3):
                    roi[:, :, c] = roi[:, :, c] * m_inv + c_crop[:, :, c] * m
                out[y1:y2, x1:x2] = roi.astype(np.uint8)
        res.append(out)
    return res


def center_crop_and_resize(img, target_size):
    target_w, target_h = target_size
    h, w = img.shape[:2]
    target_aspect = target_w / target_h
    img_aspect = w / h
    if img_aspect > target_aspect:
        new_w = int(h * target_aspect)
        x_start = (w - new_w) // 2
        img_cropped = img[:, x_start:x_start + new_w]
    else:
        new_h = int(w / target_aspect)
        y_start = (h - new_h) // 2
        img_cropped = img[y_start:y_start + new_h, :]
    return cv2.resize(img_cropped, target_size)


def face_crop_and_resize(img, target_size, face_bbox):
    target_w, target_h = target_size
    h, w = img.shape[:2]
    target_aspect = target_w / target_h
    img_aspect = w / h
    if face_bbox is None:
        cx, cy = w // 2, h // 2
    else:
        fx, fy, fw, fh = face_bbox
        cx, cy = fx + fw // 2, fy + fh // 2
    if img_aspect > target_aspect:
        new_w = int(h * target_aspect)
        x_start = max(0, min(w - new_w, cx - new_w // 2))
        img_cropped = img[:, x_start:x_start + new_w]
    else:
        new_h = int(w / target_aspect)
        y_start = max(0, min(h - new_h, cy - new_h // 2))
        img_cropped = img[y_start:y_start + new_h, :]
    return cv2.resize(img_cropped, target_size)


def extract_clips(video_files, clip_dur, num_clips, target_size, fps=30):
    if not video_files:
        return []
    clips = []
    for _ in range(num_clips):
        path = random.choice(video_files)
        cap = cv2.VideoCapture(path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        vfps = cap.get(cv2.CAP_PROP_FPS) or fps
        needed = max(1, int(clip_dur * vfps))
        start = random.randint(0, max(0, total - needed))
        cap.set(cv2.CAP_PROP_POS_FRAMES, start)
        frames = []
        for _ in range(needed):
            ret, f = cap.read()
            if not ret or f is None:
                break
            frames.append(center_crop_and_resize(f, target_size))
        cap.release()
        if frames:
            clips.append(frames)
    return clips


def generate_edit(recording_dir, sigma_path, output_path, target_size=(720, 1280), fps=30, edit_style="aura", progress_cb=None):
    """
    Master 4-Cycle Dynamic Edit Generator:
    - Cycle 1 ('aura'): Full soundtrack synced to 1000180359, alternating zoom pulses, speed ramps, chromatic flares.
    - Cycle 2 ('sigma'): Moody, desaturated teal/orange grade, speed ramps, motion-blur transitions.
    - Cycle 3 ('second'): Warm filmic grade, continuous Ken Burns zoom, letterbox, 0.6s cuts.
    - Cycle 4 ('third'): Phonk zoom 14 micro-cuts, cutout slide, vertical slide wipes, impact shakes, WASTED stinger.
    """
    def p(msg, pct=0):
        if progress_cb:
            progress_cb(msg, pct)

    user_files = sorted(glob.glob(os.path.join(recording_dir, "clip_*.mp4")))
    if not user_files:
        p("No recorded footage found!", 0)
        return False
        
    final = []
    
    # ================= CYCLE 1: AURA STRIKE (1000180359.mp4 - FULL AUDIO & VIDEO) =================
    if edit_style in ["aura", "cycle1"]:
        audio_src = get_cycle_soundtrack(edit_style)
        target_dur = get_audio_duration(audio_src, default=12.0)
        p(f"Generating full Aura Strike edit ({target_dur:.1f}s full soundtrack)...", 20)
        
        num_cuts = max(5, int(target_dur / 1.4))
        clip_dur = target_dur / num_cuts
        
        raw_clips = extract_clips(user_files, clip_dur, num_cuts, target_size, fps)
        if not raw_clips:
            return False
            
        p("Applying Aura Strike cinematic grade & speed ramps...", 45)
        processed_clips = []
        for ci, clip in enumerate(raw_clips):
            fc = len(clip)
            for fi in range(fc):
                if ci % 2 == 0:
                    zf = 1.0 + (fi / max(1, fc)) * 0.18
                else:
                    zf = 1.18 - (fi / max(1, fc)) * 0.18
                f = apply_zoom(clip[fi], zf)
                f = fast_cinematic_grade(f)
                f = apply_fast_grain(f, amount=8)
                f = apply_fast_vignette(f, strength=0.72)
                if ci % 2 == 1:
                    f = apply_chromatic_aberration(f, shift=5)
                clip[fi] = f
                
            processed_clips.append(apply_speed_ramp(clip))
            
        p("Applying whip transitions & flash drops...", 70)
        final = processed_clips[0]
        for i in range(min(FADE_FRAMES, len(final))):
            final[i] = cv2.convertScaleAbs(final[i], alpha=(i / FADE_FRAMES), beta=0)
            
        for i in range(1, len(processed_clips)):
            final = motion_blur_flash_transition(final, processed_clips[i], transition_frames=5)
            
        for i in range(min(FADE_FRAMES, len(final))):
            final[-(i + 1)] = cv2.convertScaleAbs(final[-(i + 1)], alpha=(i / FADE_FRAMES), beta=0)

    # ================= CYCLE 2: SIGMA EDIT =================
    elif edit_style == "sigma":
        p("Extracting footage (20%)...", 20)
        user_clips = extract_clips(user_files, EDIT_CLIP_DURATION, EDIT_USER_CLIPS, target_size, fps)
        sigma_clips = []
        if EDIT_SIGMA_CLIPS > 0 and os.path.exists(sigma_path):
            sigma_clips = extract_clips([sigma_path], EDIT_CLIP_DURATION, EDIT_SIGMA_CLIPS, target_size, fps)
        if not user_clips and not sigma_clips:
            return False

        merged = []
        for i in range(max(len(user_clips), len(sigma_clips))):
            if i < len(user_clips):
                merged.append(apply_speed_ramp(user_clips[i]))
            if i < len(sigma_clips):
                merged.append(sigma_clips[i])

        p("Applying cinematic grade (45%)...", 45)
        for ci, clip in enumerate(merged):
            for fi in range(len(clip)):
                if ci % 2 == 0:
                    clip[fi] = apply_zoom(clip[fi], 1.12)
                f = fast_cinematic_grade(clip[fi])
                f = apply_fast_grain(f, amount=10)
                f = apply_fast_vignette(f, strength=0.65)
                clip[fi] = f

        p("Applying motion-blur transitions (70%)...", 70)
        final = merged[0]
        for i in range(min(FADE_FRAMES, len(final))):
            final[i] = cv2.convertScaleAbs(final[i], alpha=(i / FADE_FRAMES), beta=0)
        for i in range(1, len(merged)):
            final = motion_blur_flash_transition(final, merged[i], transition_frames=6)
        for i in range(min(FADE_FRAMES, len(final))):
            final[-(i + 1)] = cv2.convertScaleAbs(final[-(i + 1)], alpha=(i / FADE_FRAMES), beta=0)

    # ================= CYCLE 3: SECOND EDIT =================
    elif edit_style == "second":
        p("Extracting fast cuts (25%)...", 25)
        intro = extract_clips(user_files, 3.0, 1, target_size, fps)
        fast_cuts = extract_clips(user_files, 0.6, 6, target_size, fps)
        if not intro or not fast_cuts:
            return False
        merged = intro + fast_cuts
        
        p("Applying warm grade & zoom (50%)...", 50)
        for ci, clip in enumerate(merged):
            fc = len(clip)
            for fi in range(fc):
                zf = 1.0 + (fi / max(1, fc)) * 0.12
                f = apply_zoom(clip[fi], zf)
                f = fast_cinematic_grade_warm(f)
                f = apply_fast_grain(f, amount=6)
                f = apply_letterbox(f, ratio=0.12)
                clip[fi] = f
                
        p("Applying zoom-flash cuts (75%)...", 75)
        final = merged[0]
        for i in range(1, len(merged)):
            final = zoom_flash_transition(final, merged[i], transition_frames=6)

    # ================= CYCLE 4: PHONK ZOOM =================
    elif edit_style in ["third", "phonk"]:
        p("Extracting continuous footage (20%)...", 20)
        frames = []
        for f in user_files:
            cap = cv2.VideoCapture(f)
            while True:
                ret, frame = cap.read()
                if not ret or frame is None or len(frames) >= 300:
                    break
                frames.append(center_crop_and_resize(frame, target_size))
            cap.release()
            if len(frames) >= 300:
                break
                
        if len(frames) < 300:
            while len(frames) < 300 and len(frames) > 0:
                frames.append(frames[-1].copy())
        if not frames:
            return False
            
        p("Generating Phonk 14 micro-cuts (50%)...", 50)
        intro = frames[0:90]
        cuts = []
        for j in range(14):
            idx = 90 + j * 15
            cuts.append(frames[idx:min(len(frames), idx + 15)])
            
        def process_zoom_seg(seg):
            res = []
            fc = len(seg)
            for fi in range(fc):
                zf = 1.0 + (fi / max(1, fc)) * 0.10
                f = apply_zoom(seg[fi], zf)
                f = fast_cinematic_grade(f)
                f = apply_fast_grain(f, amount=12)
                res.append(f)
            return res
            
        segments = [process_zoom_seg(intro)]
        stinger_indices = random.sample(range(14), 2)
        cutout_indices = random.sample([i for i in range(14) if i not in stinger_indices], 2)
        
        for i, cut in enumerate(cuts):
            seg = process_zoom_seg(cut)
            if i in cutout_indices:
                seg = apply_cutout_slide(seg)
            if i in stinger_indices:
                seg = apply_phonk_wasted_stinger(seg)
            segments.append(seg)
            
        p("Applying slide wipes & shakes (75%)...", 75)
        final = segments[0]
        for i in range(1, len(segments)):
            l_prev = len(final)
            final = vertical_slide_wipe_transition(final, segments[i], transition_frames=4)
            if l_prev < len(final):
                final[l_prev] = apply_impact_shake(final[l_prev], opacity=0.7)
            if l_prev + 1 < len(final):
                final[l_prev + 1] = apply_impact_shake(final[l_prev + 1], opacity=0.4)

    if not final:
        p("Compilation failed", 0)
        return False

    p(f"Writing {len(final)} video frames (85%)...", 85)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, target_size)
    if not writer.isOpened():
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        writer = cv2.VideoWriter(output_path, fourcc, fps, target_size)
    for f in final:
        writer.write(f)
    writer.release()
    
    # Mux full soundtrack
    audio_src = get_cycle_soundtrack(edit_style)
    p(f"Muxing audio track '{os.path.basename(audio_src)}' in full quality (95%)...", 95)
    if os.path.exists(audio_src):
        ffmpeg_bin = get_ffmpeg_binary()
        temp_out = output_path.replace(".mp4", "_temp_mux.mp4")
        cmd = [
            ffmpeg_bin, "-y", 
            "-i", output_path, 
            "-i", audio_src, 
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k",
            "-map", "0:v:0", 
            "-map", "1:a:0", 
            "-shortest", 
            temp_out
        ]
        kwargs = {}
        if hasattr(subprocess, 'CREATE_NO_WINDOW'):
            kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        try:
            res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **kwargs)
            if res.returncode == 0 and os.path.exists(temp_out) and os.path.getsize(temp_out) > 1000:
                os.replace(temp_out, output_path)
        except Exception:
            pass

    p("EDIT COMPLETE", 100)
    return True


# ============== AUTONOMOUS MASTER CONTROLLER ==============

class FaceTrackerApp:
    PUNCH_DURATION = 0.35
    PUNCH_ZOOM_MAX = 1.18

    def __init__(self, window, window_title):
        self.window = window
        self.window.title(window_title)
        self.window.configure(bg='#121212')

        self.width, self.height = 1280, 720

        self.canvas = tk.Canvas(
            window, width=self.width, height=self.height,
            bg='#121212', highlightthickness=0
        )
        self.canvas.pack(padx=20, pady=20)

        # Status bar
        self.status_var = tk.StringVar(value="INITIALIZING AURAFARMING SYSTEM...")
        self.status_bar = tk.Label(
            window, textvariable=self.status_var,
            bg='#121212', fg='#64ff64',
            font=('Courier', 12, 'bold'), anchor='w'
        )
        self.status_bar.pack(fill='x', padx=20)

        # Phase banner
        self.phase_label = tk.Label(
            window,
            text="AURAFARMING AUTO-EDITOR — FULLY AUTONOMOUS LOOP",
            bg='#121212', fg='#888888',
            font=('Courier', 10), anchor='center'
        )
        self.phase_label.pack(fill='x', padx=20, pady=(5, 10))

        # Core State
        self.state = "WAITING"
        self.punch_start_time = None
        self.start_time = time.time()
        self.cam_ready = False

        # Recording state
        self.clip_writer = None
        self.clip_index = 0
        self.record_start_time = 0
        self._clip_start = 0

        # Edit playback state
        self.edit_cap = None
        self.playback_start_time = 0
        self.playback_cycle = 0
        self.last_edit_frame = None

        # Face tracking & HUD state
        self.last_face_bbox = None
        self.frame_count = 0
        
        # PiP animation dimensions
        self.current_pip_bw = 500.0
        self.current_pip_bh = 500.0
        self.current_tph = 300.0
        
        # 4 Dynamic Cycles (starting with Cycle 1: "aura" / 1000180359)
        self.edit_style_cycle = ["aura", "sigma", "second", "third"]
        self.edit_style_idx = 0
        self.edit_style = self.edit_style_cycle[self.edit_style_idx]

        # Backend hardware
        self.cap = None
        self.face_cascade = None
        self.running = True
        self.audio_process = None

        os.makedirs(RECORDING_DIR, exist_ok=True)

        self.window.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.window.bind('<space>', lambda e: setattr(self, 'punch_start_time', time.time()))

        # Start background hardware and audio initialization
        threading.Thread(target=self._init_backend, daemon=True).start()
        self.update()

    def _init_backend(self):
        print("[HARDWARE] Pre-extracting soundtrack audio files...")
        ensure_all_audio_tracks()
        
        print("[HARDWARE] Checking camera and face detector...")
        cap = None
        try:
            if platform.system() == "Windows":
                c = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            else:
                c = cv2.VideoCapture(0)
                
            if c.isOpened():
                ret, test_frame = c.read()
                if ret and test_frame is not None:
                    cap = c
                    print("[HARDWARE] Webcam connected successfully on index 0.")
                else:
                    c.release()
        except Exception:
            pass

        if cap is not None and cap.isOpened():
            self.cap = cap
            w = self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            h = self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            if w > 0 and h > 0:
                ar = h / w
                self.width = 1280
                self.height = int(self.width * ar)
                self.window.after(0, lambda: self.canvas.config(width=self.width, height=self.height))
        else:
            print("[HARDWARE] Notice: Running simulation feed.")
            
        self.face_cascade = get_face_detector()
        self.start_time = time.time()
        self.cam_ready = True
        
        self.window.after(1500, self._auto_start_recording)

    def _auto_start_recording(self):
        self.state = "RECORDING"
        self.record_start_time = time.time()
        self._start_new_clip()
        self.status_var.set(f"● REC [{self.edit_style.upper()} CYCLE] — Auto-recording 5 micro-clips ({RECORD_DURATION_SEC}s)...")
        self.phase_label.config(text=f"PHASE 2/4: RECORDING 5 MICRO-CLIPS ({RECORD_DURATION_SEC}s TOTAL)")

    def _auto_stop_and_generate(self):
        self._stop_clip_writer()
        self.state = "GENERATING"
        self.status_var.set(f"GENERATING {self.edit_style.upper()} EDIT (0%)...")
        self.phase_label.config(text=f"PHASE 3/4: GENERATING {self.edit_style.upper()} EDIT MONTAGE")

        def run():
            def progress(msg, pct=0):
                self.window.after(0, lambda m=msg: self.status_var.set(f"EDIT [{self.edit_style.upper()}]: {m}"))
            
            if self.state == "GENERATING":
                progress("Compiling OpenCV matrix effects...")
                waiting_proc = play_audio(WAITING_WAV, async_play=True)
                
                success = generate_edit(
                    RECORDING_DIR, SIGMA_VIDEO, EDIT_OUTPUT,
                    target_size=(720, 1280), fps=30,
                    edit_style=self.edit_style, progress_cb=progress
                )
                
                if waiting_proc:
                    try:
                        waiting_proc.terminate()
                    except Exception:
                        pass
                
                if success:
                    try:
                        play_audio(CONFIRM_WAV, async_play=False)
                    except Exception:
                        pass
                        
                self.window.after(0, lambda: self._auto_start_playback(success))

        threading.Thread(target=run, daemon=True).start()

    def _auto_start_playback(self, success):
        if not success:
            self._auto_restart_cycle()
            return
            
        self.state = "PLAYBACK"
        self.edit_cap = cv2.VideoCapture(EDIT_OUTPUT)
        self.playback_start_time = time.time()
        
        if getattr(self, 'audio_process', None):
            try:
                self.audio_process.terminate()
            except Exception:
                pass
            
        audio_file = get_cycle_soundtrack(self.edit_style)
        print(f"[AUDIO] Playing soundtrack for {self.edit_style.upper()} edit: {os.path.basename(audio_file)}")
        self.audio_process = play_audio(audio_file, async_play=True)
        
        self.playback_cycle += 1
        self.last_edit_frame = None
        self.status_var.set(f"▶ PLAYING {self.edit_style.upper()} EDIT (Cycle {self.playback_cycle})")
        self.phase_label.config(text=f"PHASE 4/4: PLAYBACK [{self.edit_style.upper()} EDIT] — Playing in Floating PiP")

    def _auto_restart_cycle(self):
        if getattr(self, 'audio_process', None):
            try:
                self.audio_process.terminate()
            except Exception:
                pass
            
        if self.edit_cap:
            self.edit_cap.release()
            self.edit_cap = None
            
        self._stop_clip_writer()
            
        # 4-Cycle rotation: Aura -> Sigma -> Second -> Phonk -> Aura
        self.edit_style_idx = (self.edit_style_idx + 1) % len(self.edit_style_cycle)
        self.edit_style = self.edit_style_cycle[self.edit_style_idx]
            
        for f in glob.glob(os.path.join(RECORDING_DIR, "clip_*.mp4")):
            try:
                os.remove(f)
            except Exception:
                pass
        self.clip_index = 0
        self._auto_start_recording()

    def _start_new_clip(self):
        self._stop_clip_writer()
        self.clip_index += 1
        path = os.path.join(RECORDING_DIR, f"clip_{self.clip_index:03d}.mp4")
        self.clip_writer = cv2.VideoWriter(
            path, cv2.VideoWriter_fourcc(*'mp4v'), 30, (720, 1280)
        )
        self._clip_start = time.time()

    def _stop_clip_writer(self):
        if self.clip_writer:
            self.clip_writer.release()
            self.clip_writer = None

    def draw_waiting_screen(self):
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (20, 20, 25)
        cx, cy = self.width // 2, self.height // 2
        r = 110
        color = (100, 255, 100)
        pulse = (math.sin(time.time() * 4) + 1) / 2

        pts = []
        for deg in [30, 90, 150, 210, 270, 330]:
            pts.append([int(cx + r * math.cos(math.radians(deg))),
                        int(cy + r * math.sin(math.radians(deg)))])
        pts = np.array(pts, np.int32)
        cv2.polylines(frame, [pts], True, color, 2, cv2.LINE_AA)
        
        for deg in [90, 210, 330]:
            cv2.line(frame, (cx, cy),
                     (int(cx + r * math.cos(math.radians(deg))),
                      int(cy + r * math.sin(math.radians(deg)))), color, 2, cv2.LINE_AA)
                      
        cv2.line(frame, (cx, cy - r - 40), (cx, cy + r + 40), color, 2, cv2.LINE_AA)
        cv2.line(frame, (cx - r - 60, cy), (cx + r + 60, cy), color, 2, cv2.LINE_AA)
        cv2.circle(frame, (cx, cy - r - 60 - int(10 * pulse)), 4, color, -1, cv2.LINE_AA)

        text = "AURAFARMING INITIALIZING . . ."
        font = cv2.FONT_HERSHEY_DUPLEX
        ts = cv2.getTextSize(text, font, 1.0, 2)[0]
        tx, ty = cx - ts[0] // 2, cy + ts[1] // 2
        cv2.rectangle(frame, (tx - 10, ty - ts[1] - 10), (tx + ts[0] + 10, ty + 10), (20, 20, 25), -1)
        if int(time.time() * 2) % 2 == 0:
            cv2.putText(frame, text, (tx, ty), font, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
        return frame

    def draw_3d_hud_cube(self, img, bbox):
        fx, fy, fw, fh = bbox
        cx = fx + fw // 2
        cy = fy + fh // 2
        cube_size = max(fw, fh) * 0.75
        focal = 500.0
        t = time.time()
        
        rx, ry, rz = t * 1.5, t * 2.1, t * 0.8
        cos_x, sin_x = math.cos(rx), math.sin(rx)
        cos_y, sin_y = math.cos(ry), math.sin(ry)
        cos_z, sin_z = math.cos(rz), math.sin(rz)
        
        unit_verts = [
            [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
            [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
        ]
        
        proj_pts = []
        for (x, y, z) in unit_verts:
            x *= cube_size * 0.5
            y *= cube_size * 0.5
            z *= cube_size * 0.5
            
            y1 = y * cos_x - z * sin_x
            z1 = y * sin_x + z * cos_x
            x1 = x
            
            x2 = x1 * cos_y + z1 * sin_y
            z2 = -x1 * sin_y + z1 * cos_y
            y2 = y1
            
            x3 = x2 * cos_z - y2 * sin_z
            y3 = x2 * sin_z + y2 * cos_z
            z3 = z2
            
            distance = max(1.0, focal + z3)
            factor = focal / distance
            proj_pts.append((int(cx + x3 * factor), int(cy + y3 * factor)))
            
        edges = [
            (0, 1), (1, 2), (2, 3), (3, 0),
            (4, 5), (5, 6), (6, 7), (7, 4),
            (0, 4), (1, 5), (2, 6), (3, 7)
        ]
        
        hud_color = (100, 255, 100) if self.state == "RECORDING" else (255, 230, 50)
        for e1, e2 in edges:
            cv2.line(img, proj_pts[e1], proj_pts[e2], hud_color, 1, cv2.LINE_AA)
        for pt in proj_pts:
            cv2.circle(img, pt, 2, (255, 255, 255), -1, cv2.LINE_AA)
            
        bracket_len = max(8, int(min(fw, fh) * 0.25))
        pad = int(min(fw, fh) * 0.1)
        bx1, by1 = max(0, fx - pad), max(0, fy - pad)
        bx2, by2 = min(img.shape[1] - 1, fx + fw + pad), min(img.shape[0] - 1, fy + fh + pad)
        
        cv2.line(img, (bx1, by1), (bx1 + bracket_len, by1), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx1, by1), (bx1, by1 + bracket_len), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx2, by1), (bx2 - bracket_len, by1), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx2, by1), (bx2, by1 + bracket_len), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx1, by2), (bx1 + bracket_len, by2), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx1, by2), (bx1, by2 - bracket_len), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx2, by2), (bx2 - bracket_len, by2), hud_color, 2, cv2.LINE_AA)
        cv2.line(img, (bx2, by2), (bx2, by2 - bracket_len), hud_color, 2, cv2.LINE_AA)
        
        reticle_r = 10
        cv2.circle(img, (cx, cy), reticle_r, hud_color, 1, cv2.LINE_AA)
        cv2.line(img, (cx - reticle_r - 4, cy), (cx - 3, cy), hud_color, 1, cv2.LINE_AA)
        cv2.line(img, (cx + 3, cy), (cx + reticle_r + 4, cy), hud_color, 1, cv2.LINE_AA)
        cv2.line(img, (cx, cy - reticle_r - 4), (cx, cy - 3), hud_color, 1, cv2.LINE_AA)
        cv2.line(img, (cx, cy + 3), (cx, cy + reticle_r + 4), hud_color, 1, cv2.LINE_AA)
        
        pulse = int(255 * ((math.sin(t * 8) + 1) * 0.5))
        text_color = (100, 255, pulse) if self.state == "RECORDING" else (255, 230, 50)
        cv2.putText(img, "● SUBJECT - LOCKED [3D HUD]", (bx1, by2 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, text_color, 1, cv2.LINE_AA)
        cv2.putText(img, f"TARGET [{cx:04d}, {cy:04d}]", (bx1, by1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (200, 200, 200), 1, cv2.LINE_AA)

    def draw_rotating_cube_pip(self, pw, ph):
        frame = np.zeros((ph, pw, 3), dtype=np.uint8)
        speed = 5.0 if self.state == "GENERATING" else 1.2
        color = (50, 50, 255) if self.state == "GENERATING" else (100, 255, 100)
        text = "COMPILING EDIT..." if self.state == "GENERATING" else "STANDBY..."
            
        t = time.time() * speed
        rx, ry = t * 0.6, t * 0.9
        cx, cy = pw // 2, ph // 2
        size = min(pw, ph) * 0.32
        
        pts = np.array([
            [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
            [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
        ], dtype=float)
        
        cos_x, sin_x = math.cos(rx), math.sin(rx)
        cos_y, sin_y = math.cos(ry), math.sin(ry)
        projected = []
        for p in pts:
            y_new = p[1] * cos_x - p[2] * sin_x
            z_new = p[1] * sin_x + p[2] * cos_x
            x_new = p[0] * cos_y + z_new * sin_y
            projected.append((int(cx + x_new * size), int(cy + y_new * size)))
            
        edges = [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)]
        for e in edges:
            cv2.line(frame, projected[e[0]], projected[e[1]], color, 1, cv2.LINE_AA)
        cv2.putText(frame, text, (10, ph - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 1, cv2.LINE_AA)
        return frame

    def get_pip_frame(self, pw, ph):
        if self.state == "PLAYBACK" and self.edit_cap is not None:
            if self.playback_start_time == 0:
                self.playback_start_time = time.time()
            elapsed = time.time() - self.playback_start_time
            target_frame_idx = int(elapsed * 30.0)
            curr_frame_idx = int(self.edit_cap.get(cv2.CAP_PROP_POS_FRAMES))
            while curr_frame_idx <= target_frame_idx:
                ret, f = self.edit_cap.read()
                if not ret or f is None:
                    self.window.after(0, self._auto_restart_cycle)
                    return self.draw_rotating_cube_pip(pw, ph)
                self.last_edit_frame = cv2.resize(f, (pw, ph))
                curr_frame_idx += 1
            if self.last_edit_frame is not None:
                return self.last_edit_frame
        return self.draw_rotating_cube_pip(pw, ph)

    def draw_hud(self, frame):
        h, w = frame.shape[:2]
        if self.state == "WAITING":
            status = "STANDBY"
            color = (0, 255, 255)
        elif self.state == "RECORDING":
            status = f"REC [{self.edit_style.upper()}]"
            color = (0, 0, 255)
        elif self.state == "PLAYBACK":
            status = f"PLAYBACK [{self.edit_style.upper()}]"
            color = (0, 255, 0)
        else:
            status = f"GENERATING [{self.edit_style.upper()}]"
            color = (50, 150, 255)
        
        cv2.putText(frame, status, (30, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.85, color, 2, cv2.LINE_AA)

        if self.state == "RECORDING":
            progress = min(1.0, (time.time() - self.record_start_time) / RECORD_DURATION_SEC)
            bar_w = int((w - 60) * progress)
            cv2.rectangle(frame, (30, 60), (30 + bar_w, 68), (0, 200, 255), -1)
            cv2.rectangle(frame, (30, 60), (w - 30, 68), (100, 255, 100), 1)
            remaining = max(0, RECORD_DURATION_SEC - (time.time() - self.record_start_time))
            cv2.putText(frame, f"CLIP {self.clip_index}/5  {remaining:.1f}s REMAINING", (32, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    def update(self):
        if self.state == "WAITING" or not self.cam_ready:
            frame = self.draw_waiting_screen()
        else:
            frame = self._get_live_frame()
            if frame is None:
                frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)

        cv2_im = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        self.photo = ImageTk.PhotoImage(image=Image.fromarray(cv2_im))
        self.canvas.create_image(0, 0, image=self.photo, anchor=tk.NW)
        if self.running:
            self.window.after(15, self.update)

    def _generate_synthetic_frame(self):
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        for y in range(self.height):
            v = int(35 + 20 * (y / self.height))
            frame[y, :] = (v, v - 5, v + 10)
        t = time.time()
        cx = int(self.width // 2 + math.sin(t * 1.2) * 120)
        cy = int(self.height // 2 + math.cos(t * 1.5) * 60)
        cv2.circle(frame, (cx, cy), 90, (70, 70, 90), -1, cv2.LINE_AA)
        cv2.ellipse(frame, (cx, cy + 180), (140, 110), 0, 0, 360, (50, 50, 70), -1, cv2.LINE_AA)
        self.last_face_bbox = (cx - 70, cy - 80, 140, 160)
        return frame

    def _get_live_frame(self):
        frame = None
        if self.cap is not None and self.cap.isOpened():
            ret, captured = self.cap.read()
            if ret and captured is not None:
                frame = cv2.flip(captured, 1)
                frame = cv2.resize(frame, (self.width, self.height))
                self.frame_count += 1
                if self.frame_count % 3 == 0 and self.face_cascade and not self.face_cascade.empty():
                    try:
                        small_gray = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (self.width // 4, self.height // 4))
                        faces = self.face_cascade.detectMultiScale(small_gray, 1.1, 5, minSize=(15, 15))
                        if len(faces) > 0:
                            fx_, fy_, fw_, fh_ = max(faces, key=lambda r: r[2] * r[3])
                            detected_box = (fx_ * 4, fy_ * 4, fw_ * 4, fh_ * 4)
                            if self.last_face_bbox is None:
                                self.last_face_bbox = detected_box
                            else:
                                alpha = 0.45
                                self.last_face_bbox = (
                                    int(self.last_face_bbox[0] * (1 - alpha) + detected_box[0] * alpha),
                                    int(self.last_face_bbox[1] * (1 - alpha) + detected_box[1] * alpha),
                                    int(self.last_face_bbox[2] * (1 - alpha) + detected_box[2] * alpha),
                                    int(self.last_face_bbox[3] * (1 - alpha) + detected_box[3] * alpha)
                                )
                    except Exception:
                        pass
        if frame is None:
            frame = self._generate_synthetic_frame()

        if self.state == "RECORDING" and self.clip_writer is not None:
            rec_frame = face_crop_and_resize(frame, (720, 1280), self.last_face_bbox)
            self.clip_writer.write(rec_frame)
            if time.time() - self._clip_start >= CLIP_CHUNK_SEC:
                self._start_new_clip()
            if time.time() - self.record_start_time >= RECORD_DURATION_SEC:
                self._auto_stop_and_generate()

        frame = fast_cinematic_grade(frame)
        zoom = 1.0
        in_punch = False
        if self.punch_start_time:
            el = time.time() - self.punch_start_time
            if el < self.PUNCH_DURATION:
                prog = el / self.PUNCH_DURATION
                zoom = 1.0 + (self.PUNCH_ZOOM_MAX - 1.0) * (1 - (1 - prog) ** 3)
                in_punch = True
            else:
                self.punch_start_time = None

        frame = apply_zoom(frame, zoom)
        if in_punch:
            frame = apply_chromatic_aberration(frame, shift=8)
        frame = apply_fast_vignette(frame)
        frame = apply_fast_grain(frame, amount=6)

        h, w = frame.shape[:2]
        if self.last_face_bbox is not None:
            self.draw_3d_hud_cube(frame, self.last_face_bbox)

        self.draw_hud(frame)

        target_pip_bw = 720.0 if self.state == "PLAYBACK" else 300.0
        target_pip_bh = 1280.0 if self.state == "PLAYBACK" else 300.0
        target_tph = int(h * 0.82) if self.state == "PLAYBACK" else int(h * 0.32)
        
        self.current_pip_bw += (target_pip_bw - self.current_pip_bw) * 0.15
        self.current_pip_bh += (target_pip_bh - self.current_pip_bh) * 0.15
        self.current_tph += (target_tph - self.current_tph) * 0.15

        tph = int(self.current_tph)
        tpw = int(self.current_pip_bw * (tph / self.current_pip_bh))
        
        pip = self.get_pip_frame(tpw, tph)
        pip_border_color = (0, 255, 255) if self.state == "PLAYBACK" else (100, 255, 100)
        cv2.rectangle(pip, (0, 0), (tpw - 1, tph - 1), pip_border_color, 2)

        pad_y, pad_x = 40, 25
        sy, ey = pad_y, pad_y + tph
        sx, ex = w - pad_x - tpw, w - pad_x
        if sy >= 0 and ey <= h and sx >= 0 and ex <= w:
            frame[sy:ey, sx:ex] = pip

        label = f"EDIT PIP [{self.edit_style.upper()}]" if self.state == "PLAYBACK" else "CAM MONITOR"
        cv2.putText(frame, label, (w - pad_x - 140, pad_y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

        frame = apply_letterbox(frame, ratio=0.10)
        return frame

    def on_closing(self):
        self.running = False
        if getattr(self, 'audio_process', None):
            try:
                self.audio_process.terminate()
            except Exception:
                pass
        if _mci_player is not None:
            _mci_player.stop()
        if self.cap:
            self.cap.release()
        if self.edit_cap:
            self.edit_cap.release()
        if self.clip_writer:
            self.clip_writer.release()
        self.window.destroy()


if __name__ == '__main__':
    root = tk.Tk()
    app = FaceTrackerApp(root, "AuraFarming Auto-Editor — santostark")
    root.mainloop()
