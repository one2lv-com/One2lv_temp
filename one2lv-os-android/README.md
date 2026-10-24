# One2lv OS - Android Edition

<div align="center">

```
 ██████╗ ███╗   ██╗███████╗██████╗ ██╗    ██╗   ██╗     ██████╗ ███████╗
██╔═══██╗████╗  ██║██╔════╝╚════██╗██║    ██║   ██║    ██╔═══██╗██╔════╝
██║   ██║██╔██╗ ██║█████╗   █████╔╝██║    ██║   ██║    ██║   ██║███████╗
██║   ██║██║╚██╗██║██╔══╝  ██╔═══╝ ██║    ╚██╗ ██╔╝    ██║   ██║╚════██║
╚██████╔╝██║ ╚████║███████╗███████╗███████╗╚████╔╝     ╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝ ╚═══╝       ╚═════╝ ╚══════╝
```

**Cyberpunk AI Operating System - Android Native**

</div>

## 🌌 Overview

One2lv OS is a next-generation AI-powered operating system with a cyberpunk aesthetic, now available as a native Android application.

### ✨ Features

- 🧠 **Neural AI Chat** - Autonomous AI agent with tool-calling capabilities
- 💾 **Vector Memory System** - Long-term memory with semantic search
- 🖥️ **Virtual Terminal** - Full bash-like environment with git support
- 🎨 **Cyberpunk UI** - Glitch effects, neon colors, animated grid
- 📸 **PNG State Capsules** - Serialize entire OS state to images
- 🔌 **Offline Capable** - Core functionality works without network
- 📱 **Mobile Optimized** - Touch-friendly interface for Android

## 🚀 Quick Start

### Prerequisites
- Android Studio (latest version)
- JDK 11 or higher
- Android SDK API 24+
- Node.js (for development)

### Installation

1. **Extract this archive**
2. **Open in Android Studio**
   ```bash
   # Open the 'android' folder in Android Studio
   ```
3. **Sync Gradle**
   - Let Android Studio sync dependencies
4. **Build APK**
   - Build > Build Bundle(s) / APK(s) > Build APK(s)
5. **Install on device**
   - Connect Android device or start emulator
   - Run the app

### Command Line Build
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🎮 Usage

### Initial Setup
1. Launch One2lv OS on your Android device
2. Tap "▲ NVIDIA" to select API provider
3. Enter your API key (supports NVIDIA, OpenAI, or custom endpoints)
4. Tap "▶ JACK" to save configuration

### Neural Chat
- Type messages in the chat interface
- AI agent can execute terminal commands
- Memories are automatically saved and retrieved

### Terminal Commands
```bash
ls              # List files
cd <dir>        # Change directory
cat <file>      # Read file
echo "x" > file # Write file
git init        # Initialize repo
git add .       # Stage files
git commit -m "msg" # Commit changes
help            # Show available commands
```

### State Management
- **◉ PNG** - Save entire OS state to PNG image
- **◌ LOAD** - Restore state from PNG
- **⬇ DL** - Download chat history as JSON
- **⬆ UL** - Upload chat history
- **✕ CLR** - Wipe all data

## 🔧 Development

### Project Structure
```
One2lv_Android/
├── android/                    # Native Android project
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── assets/public/  # Web assets
│   │   │       └── AndroidManifest.xml
│   │   └── build.gradle
│   └── build.gradle
├── www/                        # Web source
│   └── index.html             # Main app
├── capacitor.config.json       # Capacitor config
└── package.json
```

### Modify Web Interface
1. Edit `www/index.html`
2. Sync changes: `npx cap sync android`
3. Rebuild APK

### Update Android Configuration
- Edit `android/app/src/main/AndroidManifest.xml`
- Edit `android/app/build.gradle`

### Supported APIs
- **NVIDIA**: `https://integrate.api.nvidia.com/v1/chat/completions`
- **OpenAI**: `https://api.openai.com/v1/chat/completions`
- **Custom**: Any OpenAI-compatible endpoint

## 📦 Distribution

### Debug APK
```bash
cd android
./gradlew assembleDebug
```

### Release APK (Signed)
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore one2lv-release.keystore \
     -alias one2lv -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Configure signing in `android/app/build.gradle`
3. Build release:
   ```bash
   ./gradlew assembleRelease
   ```

### Google Play Store
1. Create signed release APK
2. Create app listing in Google Play Console
3. Upload APK and complete store listing
4. Submit for review

## 🛠️ Troubleshooting

### Gradle Sync Fails
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### Web Assets Not Updating
```bash
npx cap sync android
```

### App Crashes on Launch
- Check Android Studio Logcat
- Verify API key is valid
- Clear app data: Settings > Apps > One2lv OS > Clear data

### Network Errors
- Verify internet connection
- Check API endpoint URL
- Confirm API key has proper permissions

## 🎨 Customization

### Colors
Edit CSS variables in `www/index.html`:
```css
:root {
    --cyan: #00f0ff;
    --magenta: #ff00d4;
    --yellow: #fcee0a;
    --pink: #ff003c;
    --green: #00ff9f;
}
```

### App Name & Icon
1. Update `appName` in `capacitor.config.json`
2. Replace icon files in `android/app/src/main/res/mipmap-*/`
3. Update `android_label` in `AndroidManifest.xml`

### Splash Screen
Configure in `capacitor.config.json`:
```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "backgroundColor": "#050008"
}
```

## 📱 System Requirements

### Minimum
- Android 7.0 (API 24)
- 50 MB storage
- Internet connection (for AI features)

### Recommended
- Android 10+ (API 29+)
- 100 MB storage
- 2 GB RAM

## 🔐 Security & Privacy

- API keys stored locally in app storage
- No data sent to One2lv servers
- All AI requests go directly to your configured endpoint
- State PNGs encrypted with your data

## 📄 License

MIT License - Free for personal and commercial use

## 🤝 Contributing

This is an open-source project. Contributions welcome!

## 🔗 Links

- **GitHub**: https://github.com/one2lv-com
- **Discord**: Join for support and updates

## ⚡ Quick Reference

| Action | Gesture |
|--------|---------|
| Send message | Tap ▶ button or Enter |
| Execute command | Type in terminal, press Enter |
| Save state | Tap ◉ PNG |
| Load state | Tap ◌ LOAD, select PNG |
| Clear data | Tap ✕ CLR |
| Configure API | Top bar inputs + ▶ JACK |

---

<div align="center">

**Built with Capacitor • Powered by AI • Styled in Cyberpunk**

🌌🧲 **ONE2LV** 🧲🌌

</div>
