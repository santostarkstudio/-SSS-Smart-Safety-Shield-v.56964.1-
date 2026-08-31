import http.server
import socketserver
import socket
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

class SSSHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

if __name__ == '__main__':
    local_ip = get_local_ip()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SSSHandler) as httpd:
        print("=" * 65)
        print(" SSS v.56964.1 (NEXT GEN) — SMART SAFETY SHIELD LAN HOST")
        print(" Santo Stark Studio • Standalone PWA & Offline Emergency Server")
        print("=" * 65)
        print(f"\n[+] Local PC Browser:  http://localhost:{PORT}")
        print(f"[+] Real Phone URL:    http://{local_ip}:{PORT}")
        print("\nINSTRUCTIONS FOR MOBILE PHONE:")
        print(f"1. Connect your phone to the same Wi-Fi network.")
        print(f"2. Open Chrome/Safari on your phone and go to: http://{local_ip}:{PORT}")
        print("3. Tap 'INSTALL' in the app header or 'Add to Home Screen'.")
        print("=" * 65)
        print("[*] SSS v.56964.1 Server is RUNNING. Press Ctrl+C to stop.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[-] SSS v.56964.1 Server stopped.")
            sys.exit(0)
