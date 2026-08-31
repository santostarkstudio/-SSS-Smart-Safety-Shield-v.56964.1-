import http.server
import socketserver
import socket
import os
import sys

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(__file__), "sss_app")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Allow PWA service worker and cross-origin access
        self.send_header('Service-Worker-Allowed', '/')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == "__main__":
    local_ip = get_local_ip()
    phone_url = f"http://{local_ip}:{PORT}"
    
    print("=" * 72)
    print("      SSS v.56964 — SANTO STARK STUDIO MOBILE HOST SERVER")
    print("=" * 72)
    print()
    print("  HOW TO INSTALL SSS ON YOUR REAL SMARTPHONE (ANDROID / IPHONE):")
    print()
    print("  1. Ensure your phone is connected to the same Wi-Fi network as this PC.")
    print("  2. Open Chrome (Android) or Safari (iPhone) on your phone.")
    print(f"  3. Type this URL in your phone browser:")
    print()
    print(f"       👉  {phone_url}  👈")
    print()
    print("  4. Tap the '📥 INSTALL' button (Android) or 'Share -> Add to Home Screen' (iOS).")
    print("  5. SSS icon will appear on your phone home screen and work 100% offline!")
    print()
    print("=" * 72)
    print("  Server is live! Press Ctrl+C in this window to stop.")
    print("=" * 72)

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
