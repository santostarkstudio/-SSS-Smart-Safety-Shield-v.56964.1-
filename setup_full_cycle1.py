"""
AuraFarming - Full Soundtrack & Video Pipeline for Cycle 1
Author: santostark
"""

import os
import shutil
import wave
import cv2
import subprocess

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_MP4 = r"C:\Users\santo\Downloads\1000180359.mp4"
TARGET_MP4 = os.path.join(PROJECT_DIR, "cycle1.mp4")
TARGET_WAV = os.path.join(PROJECT_DIR, "cycle1.wav")

def get_ffmpeg_binary():
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if os.path.exists(exe):
            return exe
    except Exception:
        pass
    local = os.path.join(PROJECT_DIR, "ffmpeg.exe")
    if os.path.exists(local):
        return local
    return "ffmpeg"

def extract_full_audio():
    # 1. Copy source video to project directory
    if os.path.exists(SOURCE_MP4):
        print(f"[IMPORT] Copying {SOURCE_MP4} ({os.path.getsize(SOURCE_MP4):,} bytes) -> {TARGET_MP4}")
        shutil.copy2(SOURCE_MP4, TARGET_MP4)

    if not os.path.exists(TARGET_MP4):
        print(f"[ERROR] {TARGET_MP4} does not exist.")
        return

    # 2. Extract full audio track to WAV
    ffmpeg_bin = get_ffmpeg_binary()
    print(f"[CONVERTER] Extracting full lossless audio from {TARGET_MP4} -> {TARGET_WAV}...")
    cmd = [
        ffmpeg_bin, "-y",
        "-i", TARGET_MP4,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "2",
        TARGET_WAV
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if os.path.exists(TARGET_WAV) and os.path.getsize(TARGET_WAV) > 1000:
        with wave.open(TARGET_WAV, 'rb') as w:
            dur = w.getnframes() / float(w.getframerate())
            print(f"[SUCCESS] Cycle 1 Full Audio Track Ready: {dur:.2f} seconds ({os.path.getsize(TARGET_WAV):,} bytes)")
    else:
        print(f"[ERROR] Audio extraction failed: {res.stderr.decode('latin1', errors='ignore')}")

if __name__ == '__main__':
    extract_full_audio()
