#!/usr/bin/env bash
#
# Builds a signed release APK for one of the SFGC mobile apps, entirely on this
# machine — no Expo account and no EAS build queue.
#
#   ./scripts/build-apk.sh student
#   ./scripts/build-apk.sh teacher
#
# The finished APK is copied to web/public/downloads/, which is where the
# website's download section looks for it.
#
# Why a script rather than a one-off command: `expo prebuild` regenerates
# android/ from scratch and the generated app/build.gradle signs release builds
# with the shared React Native debug keystore. That is fine for testing but
# wrong for something handed to students, so the signing config has to be
# re-applied after every prebuild. Doing it here keeps that reproducible.

set -euo pipefail

APP="${1:-}"
if [[ "$APP" != "student" && "$APP" != "teacher" ]]; then
  echo "usage: $0 student|teacher" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/${APP}-app"
CRED_DIR="$APP_DIR/credentials"
OUT_DIR="$REPO_ROOT/web/public/downloads"

export JAVA_HOME="${JAVA_HOME:-/c/Program Files/Android/Android Studio/jbr}"
export ANDROID_HOME="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

log() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- checks ----

[[ -x "$JAVA_HOME/bin/java" ]] || { echo "No JDK at JAVA_HOME=$JAVA_HOME" >&2; exit 1; }
[[ -d "$ANDROID_HOME" ]]       || { echo "No Android SDK at ANDROID_HOME=$ANDROID_HOME" >&2; exit 1; }
[[ -f "$CRED_DIR/signing.properties" ]] || {
  echo "Missing $CRED_DIR/signing.properties — see scripts/build-apk.sh header" >&2
  exit 1
}

# shellcheck disable=SC1090
source "$CRED_DIR/signing.properties"

log "Building SFGC ${APP} APK"
echo "  java   : $("$JAVA_HOME/bin/java" -version 2>&1 | head -1)"
echo "  sdk    : $ANDROID_HOME"
echo "  api url: $(grep -h EXPO_PUBLIC_API_URL "$APP_DIR/.env" 2>/dev/null || echo 'not set')"

# The APK bakes in EXPO_PUBLIC_API_URL at build time. A LAN address here would
# produce an app that only works on the developer's wifi — catch it early
# rather than after distributing it.
if grep -qE 'localhost|127\.0\.0\.1|192\.168\.|10\.[0-9]+\.' "$APP_DIR/.env" 2>/dev/null; then
  echo
  echo "  WARNING: .env points at a private address. Students will not be able" >&2
  echo "           to reach it. Set EXPO_PUBLIC_API_URL to the deployed API." >&2
  read -r -p "  Continue anyway? [y/N] " reply
  [[ "$reply" == "y" || "$reply" == "Y" ]] || exit 1
fi

cd "$APP_DIR"

# -------------------------------------------------------------- prebuild ----

if [[ ! -d android ]]; then
  log "Generating the native project"
  npx expo prebuild --platform android
else
  log "Reusing the existing android/ directory (delete it to regenerate)"
fi

# --------------------------------------------------------------- signing ----

log "Applying the release signing config"

cp "$CRED_DIR/$SFGC_STORE_FILE" android/app/

# Gradle reads these from gradle.properties; they never enter version control.
{
  echo ""
  echo "# --- SFGC release signing (written by scripts/build-apk.sh) ---"
  echo "SFGC_STORE_FILE=$SFGC_STORE_FILE"
  echo "SFGC_KEY_ALIAS=$SFGC_KEY_ALIAS"
  echo "SFGC_STORE_PASSWORD=$SFGC_STORE_PASSWORD"
  echo "SFGC_KEY_PASSWORD=$SFGC_KEY_PASSWORD"
} >> android/gradle.properties

# Insert a `release` signingConfig next to the template's `debug` one, then
# point the release buildType at it instead of the debug keystore.
node - "$PWD/android/app/build.gradle" <<'NODE'
const fs = require('fs')
const file = process.argv[2]
let src = fs.readFileSync(file, 'utf8')

if (src.includes('signingConfigs.release')) {
  console.log('  already patched')
  process.exit(0)
}

src = src.replace(
  /(signingConfigs\s*\{)/,
  `$1
        release {
            storeFile file(SFGC_STORE_FILE)
            storePassword SFGC_STORE_PASSWORD
            keyAlias SFGC_KEY_ALIAS
            keyPassword SFGC_KEY_PASSWORD
        }`,
)

// Only the release buildType's signingConfig — the debug one stays as it is.
src = src.replace(
  /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/s,
  '$1signingConfig signingConfigs.release',
)

fs.writeFileSync(file, src)
console.log('  patched app/build.gradle')
NODE

grep -q 'signingConfig signingConfigs.release' android/app/build.gradle || {
  echo "Failed to apply the release signing config" >&2
  exit 1
}

# --------------------------------------------------------------- assemble ----

log "Running Gradle (first run downloads dependencies — this takes a while)"
cd android
JAVA_HOME="$JAVA_HOME" ./gradlew assembleRelease --no-daemon
cd ..

# ---------------------------------------------------------------- publish ----

APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
[[ -f "$APK_PATH" ]] || { echo "Expected an APK at $APK_PATH but found none" >&2; exit 1; }

mkdir -p "$OUT_DIR"
cp "$APK_PATH" "$OUT_DIR/sfgc-${APP}.apk"

SIZE=$(du -h "$OUT_DIR/sfgc-${APP}.apk" | cut -f1)

log "Done"
echo "  $OUT_DIR/sfgc-${APP}.apk  ($SIZE)"
echo "  It is now live on the website's download section at /#apps"
