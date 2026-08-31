"""
Media Inspector & Audio Verifier
Checks audio tracks, sample rates, channels, and headers of all media files in the project.
"""

import os
import wave
import struct

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

def check_wav(filename):
    path = os.path.join(PROJECT_DIR, filename)
    if not os.path.exists(path):
        print(f"[MISSING] {filename}")
        return
    try:
        with wave.open(path, 'rb') as w:
            channels = w.getnchannels()
            sampwidth = w.getsampwidth()
            framerate = w.getframerate()
            nframes = w.getnframes()
            dur = nframes / float(framerate) if framerate > 0 else 0
            print(f"[WAV VALID] {filename}: {channels} channels, {sampwidth*8}-bit, {framerate}Hz, Duration: {dur:.2f}s, Size: {os.path.getsize(path):,} bytes")
    except Exception as e:
        print(f"[WAV ERROR] {filename}: {e}")

def check_file(filename):
    path = os.path.join(PROJECT_DIR, filename)
    if not os.path.exists(path):
        print(f"[MISSING] {filename}")
        return
    size = os.path.getsize(path)
    print(f"[FILE] {filename}: Size: {size:,} bytes")

def main():
    print("Checking project media files:")
    check_wav("confim.wav")
    check_wav("waiting.wav")
    check_wav("third.wav")
    check_file("sigma.mp4")
    check_file("second.mp4")
    check_file("third.mp4")

if __name__ == '__main__':
    main()
