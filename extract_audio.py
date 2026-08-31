"""
AuraFarming - Audio Track Extractor & Converter
Author: santostark
Converts video files (cycle1.mp4 / 1000180359.mp4, sigma.mp4, second.mp4, third.mp4) into clean WAV audio tracks.
"""

import os
import shutil
import subprocess
import platform

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
CYCLE1_SOURCE = r"C:\Users\santo\Downloads\1000180359.mp4"
CYCLE1_VIDEO = os.path.join(PROJECT_DIR, "cycle1.mp4")

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

def extract_audio(video_file, audio_output):
    if not os.path.exists(video_file):
        print(f"[SKIP] Video not found: {video_file}")
        return False
        
    ffmpeg_bin = get_ffmpeg_binary()
    print(f"[CONVERTING] {os.path.basename(video_file)} -> {os.path.basename(audio_output)}...")
    
    cmd = [
        ffmpeg_bin, "-y",
        "-i", video_file,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "44100",
        "-ac", "2",
        audio_output
    ]
    kwargs = {}
    if hasattr(subprocess, 'CREATE_NO_WINDOW'):
        kwargs['creationflags'] = subprocess.CREATE_NO_WINDOW
        
    try:
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **kwargs)
        if os.path.exists(audio_output) and os.path.getsize(audio_output) > 1000:
            print(f"[SUCCESS] Created music track: {os.path.basename(audio_output)} ({os.path.getsize(audio_output):,} bytes)")
            return True
        else:
            print(f"[FAILED] ffmpeg exited with code {res.returncode}")
    except Exception as e:
        print(f"[ERROR] {e}")
        
    return False

def main():
    print("========================================================")
    print("     AuraFarming - Audio & Song Extraction Utility")
    print("========================================================")
    
    # Check if 1000180359.mp4 is available in downloads and copy to project
    if os.path.exists(CYCLE1_SOURCE) and not os.path.exists(CYCLE1_VIDEO):
        try:
            print(f"[IMPORT] Copying {CYCLE1_SOURCE} -> {CYCLE1_VIDEO}")
            shutil.copy2(CYCLE1_SOURCE, CYCLE1_VIDEO)
        except Exception as e:
            print(f"[IMPORT ERROR] {e}")
            
    tracks = [
        (CYCLE1_VIDEO if os.path.exists(CYCLE1_VIDEO) else CYCLE1_SOURCE, os.path.join(PROJECT_DIR, "cycle1.wav")),
        (os.path.join(PROJECT_DIR, "sigma.mp4"), os.path.join(PROJECT_DIR, "sigma.wav")),
        (os.path.join(PROJECT_DIR, "second.mp4"), os.path.join(PROJECT_DIR, "second.wav")),
        (os.path.join(PROJECT_DIR, "third.mp4"), os.path.join(PROJECT_DIR, "third.wav")),
    ]
    
    for v_path, a_path in tracks:
        extract_audio(v_path, a_path)
        
    print("\nAll 4 soundtrack conversions finished! Audio tracks are ready for your edits.")

if __name__ == '__main__':
    main()
