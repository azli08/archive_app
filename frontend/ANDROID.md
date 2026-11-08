# Collectly for Android

The web frontend is wrapped with Capacitor so it can be installed as an Android app. The web UI remains the shared application; a compact bottom navigation is shown on phone-sized screens.

## Requirements

- Node.js 22 or newer
- Android Studio 2025.2.1 or newer, with an Android SDK platform installed
- An HTTPS address for the FastAPI backend that the phone can reach

Android Studio supplies the supported JDK. A backend bound to `127.0.0.1` on the development computer is not reachable from a phone. Do not put API secrets in the frontend environment; the API URL is public configuration.

## Configure the backend URL

Copy `android-api.example` to `.env.production.local` in this directory and replace the example address with the deployed HTTPS API URL, including `/api/v1`:

```powershell
Copy-Item .\android-api.example .\.env.production.local
```

Ensure the backend allows the Capacitor Android origin `https://localhost` in `CORS_ORIGINS`. The tracked `backend/.env.example` includes it. If `backend/.env` already exists, update its `CORS_ORIGINS` value as well. The app uses HTTPS for its local WebView and should connect to an HTTPS API; Android cleartext traffic is not enabled.

## Open and run

From `frontend/`:

```powershell
npm.cmd ci
npm.cmd run android:sync
npm.cmd run android:open
```

In Android Studio, wait for Gradle sync, select an emulator or connected Android phone, then press **Run**. Later frontend changes are copied to Android with:

```powershell
npm.cmd run android:sync
```

The `android:run` script builds, syncs, and launches on an available device from the terminal. Release APK/AAB signing and Play Store publishing are separate steps and are not configured yet.

## iPhone

The same Capacitor setup can target iOS, but generating and building the iOS app requires macOS with Xcode. This Windows project currently contains only the Android platform.
