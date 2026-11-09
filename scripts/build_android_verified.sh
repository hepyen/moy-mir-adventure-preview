#!/bin/sh
# Single safe path for native release builds. Must not use default Vite github-pages base.
set -eu
cd "$(dirname "$0")/.."
npm run build -- --mode android
npx cap sync android
: "${JAVA_HOME:=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
: "${ANDROID_HOME:=/opt/homebrew/share/android-commandlinetools}"
export JAVA_HOME ANDROID_HOME
./android/gradlew -p android assembleDebug --offline --console=plain
python3 scripts/verify_android_apk.py android/app/build/outputs/apk/debug/app-debug.apk
