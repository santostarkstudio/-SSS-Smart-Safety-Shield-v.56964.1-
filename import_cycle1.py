import os
import shutil
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

def setup_cycle1():
    print(f"Checking source: {SOURCE_MP4}")
    if os.path.exists(SOURCE_MP4):
        print(f"Copying {SOURCE_MP4} ({os.path.getsize(SOURCE_MP4):,} bytes) -> {TARGET_MP4}")
        shutil.copy2(SOURCE_MP4, TARGET_MP4)
    else:
        print(f"Warning: {SOURCE_MP4} not found directly, checking project dir...")

    if os.path.exists(TARGET_MP4):
        ffmpeg_bin = get_ffmpeg_binary()
        print(f"Extracting soundtrack using {ffmpeg_bin} -> {TARGET_WAV}...")
        cmd = [
            ffmpeg_bin, "-y",
            "-i", TARGET_MP4,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "44100",
            "-ac", "2",
            TARGET_WAV
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(TARGET_WAV) and os.path.getsize(TARGET_WAV) > 1000:
            print(f"SUCCESS: Created {TARGET_WAV} ({os.path.getsize(TARGET_WAV):,} bytes)")
        else:
            print(f"Extraction result code: {res.returncode}")

if __name__ == '__main__':
    setup_cycle1()
