# One2lv OS - Android APK Build Instructions

## Project Structure
```
One2lv_Android/
├── android/           # Native Android project
├── www/              # Web assets (HTML/CSS/JS)
├── capacitor.config.json
└── package.json
```

## Prerequisites
- Node.js (installed)
- Android Studio or Android SDK
- JDK 11 or higher
- Gradle 7.0+

## Build Instructions

### Option 1: Build with Android Studio
1. Open Android Studio
2. Open the `android/` folder as an existing Android project
3. Let Gradle sync complete
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Build with Command Line
```bash
cd android
./gradlew assembleDebug
```
APK output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 3: Build Release APK (Signed)
```bash
cd android
./gradlew assembleRelease
```

## Quick Commands

### Sync web assets to Android
```bash
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

### Run on connected device
```bash
npx cap run android
```

## App Configuration
- **App ID**: com.one2lv.os
- **App Name**: One2lv OS
- **Package**: com.one2lv.os

## Features
✅ Cyberpunk-themed UI
✅ Neural AI chat interface
✅ Virtual terminal with git support
✅ Vector memory system
✅ PNG state snapshots
✅ Offline-capable
✅ Touch-optimized for mobile

## API Configuration
The app supports:
- NVIDIA API (default)
- OpenAI API
- Custom endpoints

Configure your API key in the app settings.

## Permissions
The app requests:
- Internet access (for AI API calls)
- Storage access (for PNG state files)

## Testing
Test the web version first:
```bash
cd www
python3 -m http.server 8080
```
Then open http://localhost:8080 in browser

## Distribution
For Google Play Store release:
1. Generate signed APK with release keystore
2. Follow Google Play Console upload process
3. Update app version in `android/app/build.gradle`

## Troubleshooting

### Gradle sync fails
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### Web assets not updating
```bash
npx cap sync android
```

### Clear app data on device
Settings > Apps > One2lv OS > Storage > Clear data
