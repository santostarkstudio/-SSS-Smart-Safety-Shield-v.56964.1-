"""
AuraFarming Auto-Editor — Web Application Backend
Author: santostark

Flask-based web server providing real-time MJPEG camera streaming with 3D HUD face tracking,
autonomous 4-phase editing loop across 4 dynamic cycles (Cycle 1: Aura Strike / 1000180359,
Cycle 2: Sigma, Cycle 3: Second, Cycle 4: Phonk Zoom), full-soundtrack in-browser audio engine,
and video download API.
"""

import sys
import os
import glob
import time
import math
import random
import threading
import subprocess
import platform
import shutil
import wave
import json

# Auto-install Flask if missing so the web server NEVER crashes
try:
    from flask import Flask, render_template, Response, jsonify, send_file, request, send_from_directory
except ImportError:
    print("[SERVER] Installing Flask dependency...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "flask"])
    from flask import Flask, render_template, Response, jsonify, send_file, request, send_from_directory

import cv2
import numpy as np

app = Flask(__name__, template_folder="templates", static_folder="static")

# ============== PATH CONFIGURATION ==============

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
RECORDING_DIR = os.path.join(PROJECT_DIR, "recording")
STATIC_DIR = os.path.join(PROJECT_DIR, "static")

# Cycle 1: Aura Strike (User asset: 1000180359.mp4)
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

os.makedirs(RECORDING_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# ============== CONFIGURATION CONSTANTS ==============

RECORD_DURATION_SEC = 15     # Total recording duration (5 micro-clips x 3s)
CLIP_CHUNK_SEC = 3           # Duration of each micro-clip recorded
EDIT_CLIP_DURATION = 3       # Base clip length for montage
EDIT_USER_CLIPS = 5          # Number of user clip segments in montage
EDIT_SIGMA_CLIPS = 0         # Additional sigma asset cuts (0 = 100% user footage)
FADE_FRAMES = 8              # Frames for dip-to-black intro/outro transitions

STATE_WAITING    = "WAITING"     # Standby & boot
STATE_RECORDING  = "RECORDING"   # Auto-record 5 micro-clips
STATE_GENERATING = "GENERATING"  # Fast compilation & styling
STATE_PLAYBACK   = "PLAYBACK"    # Synchronized floating PiP playback


# ============== ROBUST FFMPEG & AUDIO EXTRACTOR ==============

def get_ffmpeg_binary():
    """Find a working ffmpeg binary from imageio-ffmpeg, local directory, or system PATH"""
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
    """Extract audio track from an MP4 video file into a clean WAV soundtrack in full length"""
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
    """Get the exact duration in seconds of an audio or video file"""
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
    """Pre-convert all MP4 videos to WAV music files for 100% audio compatibility"""
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
    """Returns the best audio source file for a given cycle (WAV preferred)"""
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


# ============== FACE DETECTOR ==============

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


# ============== FAST VECTORIZED EFFECTS & LUT PIPELINES ==============

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
    - Cycle 1 ('aura'): 100% full soundtrack matching 1000180359, rhythmic micro-cuts, alternating optical zoom pulses, speed ramps, chromatic flares.
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
        
        # Calculate dynamic cuts to span the entire audio soundtrack
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
                # Alternating push-in and pull-out zooms
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
        p("Extracting footage...", 20)
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

        p("Applying cinematic grade...", 45)
        for ci, clip in enumerate(merged):
            for fi in range(len(clip)):
                if ci % 2 == 0:
                    clip[fi] = apply_zoom(clip[fi], 1.12)
                f = fast_cinematic_grade(clip[fi])
                f = apply_fast_grain(f, amount=10)
                f = apply_fast_vignette(f, strength=0.65)
                clip[fi] = f

        p("Applying motion-blur transitions...", 70)
        final = merged[0]
        for i in range(min(FADE_FRAMES, len(final))):
            final[i] = cv2.convertScaleAbs(final[i], alpha=(i / FADE_FRAMES), beta=0)
        for i in range(1, len(merged)):
            final = motion_blur_flash_transition(final, merged[i], transition_frames=6)
        for i in range(min(FADE_FRAMES, len(final))):
            final[-(i + 1)] = cv2.convertScaleAbs(final[-(i + 1)], alpha=(i / FADE_FRAMES), beta=0)

    # ================= CYCLE 3: SECOND EDIT =================
    elif edit_style == "second":
        p("Extracting fast cuts...", 25)
        intro = extract_clips(user_files, 3.0, 1, target_size, fps)
        fast_cuts = extract_clips(user_files, 0.6, 6, target_size, fps)
        if not intro or not fast_cuts:
            return False
        merged = intro + fast_cuts
        
        p("Applying warm grade & zoom...", 50)
        for ci, clip in enumerate(merged):
            fc = len(clip)
            for fi in range(fc):
                zf = 1.0 + (fi / max(1, fc)) * 0.12
                f = apply_zoom(clip[fi], zf)
                f = fast_cinematic_grade_warm(f)
                f = apply_fast_grain(f, amount=6)
                f = apply_letterbox(f, ratio=0.12)
                clip[fi] = f
                
        p("Applying zoom-flash cuts...", 75)
        final = merged[0]
        for i in range(1, len(merged)):
            final = zoom_flash_transition(final, merged[i], transition_frames=6)

    # ================= CYCLE 4: PHONK ZOOM =================
    elif edit_style in ["third", "phonk"]:
        p("Extracting continuous footage...", 20)
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
            
        p("Generating Phonk 14 micro-cuts...", 50)
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
            
        p("Applying slide wipes & shakes...", 75)
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

    p(f"Writing {len(final)} video frames...", 85)
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
    p(f"Muxing audio track '{os.path.basename(audio_src)}' in full quality...", 95)
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

class WebAuraEngine:
    def __init__(self):
        self.lock = threading.Lock()
        self.state = STATE_WAITING
        self.running = True
        
        self.width = 1280
        self.height = 720
        self.cap = None
        self.face_cascade = None
        
        self.last_face_bbox = None
        self.frame_count = 0
        self.punch_start_time = None
        self.PUNCH_DURATION = 0.35
        self.PUNCH_ZOOM_MAX = 1.18

        # 4-Phase tracking
        self.record_start_time = 0
        self.clip_start_time = 0
        self.clip_index = 0
        self.clip_writer = None
        
        self.generating_progress_pct = 0
        self.generating_status_text = "INITIALIZING..."
        
        self.playback_start_time = 0
        self.playback_cycle = 0
        self.edit_cap = None
        self.last_edit_frame = None
        self.last_edit_timestamp = 0
        
        # 4 Dynamic Cycles (starting with Cycle 1: "aura" / 1000180359)
        self.edit_styles = ["aura", "sigma", "second", "third"]
        self.edit_style_idx = 0
        self.edit_style = self.edit_styles[self.edit_style_idx]
        
        self.latest_live_frame = None
        self.latest_pip_frame = None

        # Start background worker threads
        threading.Thread(target=self._init_hardware_and_audio, daemon=True).start()
        threading.Thread(target=self._state_machine_loop, daemon=True).start()
        threading.Thread(target=self._video_capture_loop, daemon=True).start()

    def _init_hardware_and_audio(self):
        print("[WEB ENGINE] Pre-converting soundtracks to WAV...")
        ensure_all_audio_tracks()
        self.face_cascade = get_face_detector()
        
        print("[WEB ENGINE] Connecting to camera...")
        try:
            if platform.system() == "Windows":
                c = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            else:
                c = cv2.VideoCapture(0)
            if c.isOpened():
                ret, test = c.read()
                if ret and test is not None:
                    self.cap = c
                    print("[WEB ENGINE] Connected to physical webcam index 0.")
        except Exception:
            pass

        # Standby for 2 seconds then auto-start recording
        time.sleep(2.0)
        with self.lock:
            self._start_recording_phase()

    def _start_recording_phase(self):
        self.state = STATE_RECORDING
        self.record_start_time = time.time()
        self.clip_index = 0
        self._start_next_clip()

    def _start_next_clip(self):
        self._stop_clip_writer()
        self.clip_index += 1
        path = os.path.join(RECORDING_DIR, f"clip_{self.clip_index:03d}.mp4")
        self.clip_writer = cv2.VideoWriter(
            path, cv2.VideoWriter_fourcc(*'mp4v'), 30, (720, 1280)
        )
        self.clip_start_time = time.time()

    def _stop_clip_writer(self):
        if self.clip_writer:
            self.clip_writer.release()
            self.clip_writer = None

    def _state_machine_loop(self):
        while self.running:
            time.sleep(0.05)
            with self.lock:
                # Phase 2: Recording management
                if self.state == STATE_RECORDING:
                    elapsed = time.time() - self.record_start_time
                    if time.time() - self.clip_start_time >= CLIP_CHUNK_SEC and self.clip_index < EDIT_USER_CLIPS:
                        self._start_next_clip()
                    elif elapsed >= RECORD_DURATION_SEC:
                        self._stop_clip_writer()
                        self.state = STATE_GENERATING
                        self.generating_progress_pct = 0
                        self.generating_status_text = f"Compiling {self.edit_style.upper()} montage..."
                        threading.Thread(target=self._run_generation_task, daemon=True).start()

    def _run_generation_task(self):
        def progress(msg, pct):
            with self.lock:
                self.generating_status_text = msg
                self.generating_progress_pct = pct

        success = generate_edit(
            RECORDING_DIR, SIGMA_VIDEO, EDIT_OUTPUT,
            target_size=(720, 1280), fps=30,
            edit_style=self.edit_style, progress_cb=progress
        )

        with self.lock:
            if success and os.path.exists(EDIT_OUTPUT):
                self.state = STATE_PLAYBACK
                self.edit_cap = cv2.VideoCapture(EDIT_OUTPUT)
                self.playback_start_time = time.time()
                self.playback_cycle += 1
                self.last_edit_timestamp = time.time()
                self.last_edit_frame = None
            else:
                self._restart_cycle()

    def _restart_cycle(self):
        if self.edit_cap:
            self.edit_cap.release()
            self.edit_cap = None
        self._stop_clip_writer()
        
        # Advance 4-cycle loop: Aura -> Sigma -> Second -> Phonk -> Aura
        self.edit_style_idx = (self.edit_style_idx + 1) % len(self.edit_styles)
        self.edit_style = self.edit_styles[self.edit_style_idx]
        
        # Clean clip files
        for f in glob.glob(os.path.join(RECORDING_DIR, "clip_*.mp4")):
            try:
                os.remove(f)
            except Exception:
                pass
        self._start_recording_phase()

    def trigger_punch_zoom(self):
        with self.lock:
            self.punch_start_time = time.time()

    def set_active_style(self, style_name):
        with self.lock:
            if style_name in self.edit_styles:
                self.edit_style = style_name
                self.edit_style_idx = self.edit_styles.index(style_name)

    # ===== HUD & FRAME GENERATION =====

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
        
        hud_color = (0, 255, 128) if self.state == STATE_RECORDING else (255, 200, 0)
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
        text_color = (100, 255, pulse) if self.state == STATE_RECORDING else (255, 230, 50)
        cv2.putText(img, "● TARGET LOCKED [3D HUD]", (bx1, by2 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.42, text_color, 1, cv2.LINE_AA)
        cv2.putText(img, f"COORD [{cx:04d}, {cy:04d}]", (bx1, by1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (200, 200, 200), 1, cv2.LINE_AA)

    def draw_rotating_cube_pip(self, pw, ph):
        frame = np.zeros((ph, pw, 3), dtype=np.uint8)
        speed = 5.0 if self.state == STATE_GENERATING else 1.2
        color = (50, 80, 255) if self.state == STATE_GENERATING else (0, 255, 128)
        text = "COMPILING EDIT..." if self.state == STATE_GENERATING else "STANDBY..."
        
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
        cv2.putText(frame, text, (15, ph - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
        return frame

    def _video_capture_loop(self):
        while self.running:
            raw_frame = None
            if self.cap and self.cap.isOpened():
                ret, c_frame = self.cap.read()
                if ret and c_frame is not None:
                    raw_frame = cv2.flip(c_frame, 1)
                    raw_frame = cv2.resize(raw_frame, (self.width, self.height))
            
            if raw_frame is None:
                raw_frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
                for y in range(self.height):
                    v = int(30 + 15 * (y / self.height))
                    raw_frame[y, :] = (v, v - 5, v + 10)
                t = time.time()
                cx = int(self.width // 2 + math.sin(t * 1.2) * 120)
                cy = int(self.height // 2 + math.cos(t * 1.5) * 60)
                cv2.circle(raw_frame, (cx, cy), 90, (70, 70, 90), -1, cv2.LINE_AA)
                cv2.ellipse(raw_frame, (cx, cy + 180), (140, 110), 0, 0, 360, (50, 50, 70), -1, cv2.LINE_AA)
                self.last_face_bbox = (cx - 70, cy - 80, 140, 160)

            # Detect Face
            self.frame_count += 1
            if self.frame_count % 3 == 0 and self.face_cascade and not self.face_cascade.empty():
                try:
                    small_gray = cv2.resize(cv2.cvtColor(raw_frame, cv2.COLOR_BGR2GRAY), (self.width // 4, self.height // 4))
                    faces = self.face_cascade.detectMultiScale(small_gray, 1.1, 5, minSize=(15, 15))
                    if len(faces) > 0:
                        fx_, fy_, fw_, fh_ = max(faces, key=lambda r: r[2] * r[3])
                        detected = (fx_ * 4, fy_ * 4, fw_ * 4, fh_ * 4)
                        if self.last_face_bbox is None:
                            self.last_face_bbox = detected
                        else:
                            alpha = 0.45
                            self.last_face_bbox = (
                                int(self.last_face_bbox[0] * (1 - alpha) + detected[0] * alpha),
                                int(self.last_face_bbox[1] * (1 - alpha) + detected[1] * alpha),
                                int(self.last_face_bbox[2] * (1 - alpha) + detected[2] * alpha),
                                int(self.last_face_bbox[3] * (1 - alpha) + detected[3] * alpha)
                            )
                except Exception:
                    pass

            # Recording write
            with self.lock:
                if self.state == STATE_RECORDING and self.clip_writer is not None:
                    rec_frame = face_crop_and_resize(raw_frame, (720, 1280), self.last_face_bbox)
                    self.clip_writer.write(rec_frame)

            # Live Styling
            frame = fast_cinematic_grade(raw_frame)
            
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

            # Overlays
            if self.last_face_bbox is not None:
                self.draw_3d_hud_cube(frame, self.last_face_bbox)

            # PiP Frame calculation
            pip_w, pip_h = 360, 640
            pip_frame = None
            if self.state == STATE_PLAYBACK and self.edit_cap is not None:
                elapsed = time.time() - self.playback_start_time
                target_frame_idx = int(elapsed * 30.0)
                curr_idx = int(self.edit_cap.get(cv2.CAP_PROP_POS_FRAMES))
                while curr_idx <= target_frame_idx:
                    ret, f = self.edit_cap.read()
                    if not ret or f is None:
                        with self.lock:
                            self._restart_cycle()
                        break
                    self.last_edit_frame = cv2.resize(f, (pip_w, pip_h))
                    curr_idx += 1
                pip_frame = self.last_edit_frame if self.last_edit_frame is not None else self.draw_rotating_cube_pip(pip_w, pip_h)
            else:
                pip_frame = self.draw_rotating_cube_pip(pip_w, pip_h)

            frame = apply_letterbox(frame, ratio=0.08)

            with self.lock:
                self.latest_live_frame = frame
                self.latest_pip_frame = pip_frame
                
            time.sleep(0.025)


# Global Engine Instance
engine = WebAuraEngine()


# ============== FLASK ROUTING & STREAMING ==============

@app.route('/')
def index():
    return render_template('index.html')


def generate_mjpeg_stream(is_pip=False):
    while True:
        frame = None
        with engine.lock:
            if is_pip:
                frame = engine.latest_pip_frame.copy() if engine.latest_pip_frame is not None else None
            else:
                frame = engine.latest_live_frame.copy() if engine.latest_live_frame is not None else None
                
        if frame is None:
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            
        ret, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        if not ret:
            continue
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(0.033)


@app.route('/video_feed')
def video_feed():
    return Response(generate_mjpeg_stream(is_pip=False),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/pip_feed')
def pip_feed():
    return Response(generate_mjpeg_stream(is_pip=True),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/status')
def api_status():
    with engine.lock:
        state = engine.state
        active_style = engine.edit_style
        clip_index = engine.clip_index
        cycle_count = engine.playback_cycle
        
        remaining_rec = 0
        if state == STATE_RECORDING:
            remaining_rec = max(0, RECORD_DURATION_SEC - (time.time() - engine.record_start_time))
            
        return jsonify({
            "state": state,
            "style": active_style,
            "clip_index": clip_index,
            "total_clips": EDIT_USER_CLIPS,
            "recording_remaining_sec": round(remaining_rec, 1),
            "recording_progress_pct": int(min(1.0, (RECORD_DURATION_SEC - remaining_rec) / RECORD_DURATION_SEC) * 100) if state == STATE_RECORDING else 0,
            "generating_progress_pct": engine.generating_progress_pct,
            "generating_status": engine.generating_status_text,
            "playback_cycle": cycle_count,
            "face_locked": engine.last_face_bbox is not None,
            "edit_ready": os.path.exists(EDIT_OUTPUT),
            "edit_timestamp": engine.last_edit_timestamp
        })


@app.route('/api/trigger_punch', methods=['POST'])
def api_trigger_punch():
    engine.trigger_punch_zoom()
    return jsonify({"success": True, "action": "punch_zoom"})


@app.route('/api/set_cycle', methods=['POST'])
def api_set_cycle():
    data = request.get_json() or {}
    style = data.get("style", "aura")
    engine.set_active_style(style)
    return jsonify({"success": True, "style": engine.edit_style})


@app.route('/api/force_record', methods=['POST'])
def api_force_record():
    with engine.lock:
        engine._start_recording_phase()
    return jsonify({"success": True, "action": "recording_started"})


@app.route('/api/force_generate', methods=['POST'])
def api_force_generate():
    with engine.lock:
        engine._stop_clip_writer()
        engine.state = STATE_GENERATING
        engine.generating_progress_pct = 0
        engine.generating_status_text = "Compiling edit..."
        threading.Thread(target=engine._run_generation_task, daemon=True).start()
    return jsonify({"success": True, "action": "generating_started"})


@app.route('/api/download_latest')
def api_download_latest():
    if os.path.exists(EDIT_OUTPUT):
        return send_file(
            EDIT_OUTPUT,
            mimetype="video/mp4",
            as_attachment=True,
            download_name=f"aurafarming_{engine.edit_style}_edit.mp4"
        )
    return jsonify({"error": "No edit generated yet"}), 404


@app.route('/audio/<filename>')
def serve_audio(filename):
    audio_path = os.path.join(PROJECT_DIR, filename)
    if os.path.exists(audio_path):
        return send_from_directory(PROJECT_DIR, filename)
    return jsonify({"error": "Audio not found"}), 404


@app.route('/video/latest')
def serve_video():
    if os.path.exists(EDIT_OUTPUT):
        return send_file(EDIT_OUTPUT, mimetype="video/mp4")
    return jsonify({"error": "Video not found"}), 404


if __name__ == '__main__':
    print("========================================================")
    print("       AuraFarming Auto-Editor — Web Server")
    print("       Author: santostark")
    print("       Running on http://localhost:5000")
    print("       Running on http://127.0.0.1:5000")
    print("========================================================")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
