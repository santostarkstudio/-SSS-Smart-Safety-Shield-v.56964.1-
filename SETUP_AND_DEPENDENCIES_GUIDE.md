# SSS v.56964 — Production Setup & Dependencies Guide
**Santo Stark Studio • Smart Safety Shield Native Application**

This guide contains everything you need to compile, run, and deploy the native Android and iOS apps for **SSS: Smart Safety Shield**.

---

## 🛠️ Required External Dependencies & Toolchains

To compile the native mobile app on your Windows PC, install these 3 free tools:

### 1. Flutter SDK (v3.19+)
* **Download**: [https://docs.flutter.dev/get-started/install/windows/mobile](https://docs.flutter.dev/get-started/install/windows/mobile)
* **What it does**: Compiles Dart code into native ARM machine code for Android (`.apk`/`.aab`) and iOS (`.ipa`).
* **Installation**: Download the zip $\rightarrow$ extract to `C:\src\flutter` $\rightarrow$ Add `C:\src\flutter\bin` to your Windows Environment System `PATH`.

### 2. Android Studio (with Android SDK & Command Line Tools)
* **Download**: [https://developer.android.com/studio](https://developer.android.com/studio)
* **What it does**: Provides the Android SDK, Gradle build tool, and Android Virtual Device (Emulator) for testing.
* **Installation**: Run the installer $\rightarrow$ In Android Studio, go to *SDK Manager* $\rightarrow$ *SDK Tools* $\rightarrow$ check **Android SDK Command-line Tools** and click *Apply*.

### 3. Node.js (v18+) (For Cloud Dispatch & Fleet Server)
* **Download**: [https://nodejs.org/](https://nodejs.org/)
* **What it does**: Runs the low-latency WebSocket and Twilio SMS dispatch server in `sss_backend/`.

---

## 🚀 Step-by-Step Build Commands

### Step 1: Run the Real-Time Fleet & Dispatch Backend
Open Command Prompt in `sss_backend/` and run:
```bash
cd sss_backend
npm install
npm start
```
*Server runs on port 8080 with WebSocket emergency broadcast enabled.*

---

### Step 2: Run / Test the Flutter Mobile App
Open Command Prompt in `sss_flutter/` and run:
```bash
cd sss_flutter
flutter pub get
flutter run
```
*Connect your Android phone via USB with USB Debugging enabled, or launch an Android emulator.*

---

### Step 3: Build the Production Android APK (Installable on any phone)
To generate the release `.apk` file that you can send on WhatsApp or install on any phone:
```bash
cd sss_flutter
flutter build apk --release
```
*The compiled APK will be created at:*  
`sss_flutter/build/app/outputs/flutter-apk/app-release.apk`

---

## 📱 Hardware & OS Permissions Handled by SSS

The app includes all required native Android & iOS permissions pre-configured:
* `ACCESS_FINE_LOCATION` & `ACCESS_BACKGROUND_LOCATION` (0ms GPS lock)
* `SEND_SMS` (Direct cellular GSM SMS fallback without internet)
* `MODIFY_AUDIO_SETTINGS` & `ACCESS_NOTIFICATION_POLICY` (Bypassing DND & silent mode)
* `BLUETOOTH_SCAN` & `BLUETOOTH_CONNECT` (BLE 5.0 Handlebar Clicker)
* `BODY_SENSORS` & `HIGH_SAMPLING_RATE_SENSORS` (Fall & impact detection)
* `FOREGROUND_SERVICE_LOCATION` (Uninterrupted 24/7 background guardian)
