#!/usr/bin/env bash
#
# Builds a signed release APK for one of the SFGC mobile apps, entirely on this
# machine — no Expo account and no EAS build queue.
#
#   ./scripts/build-apk.sh student
#   ./scripts/build-apk.sh teacher
#   ./scripts/build-apk.sh student --publish
#
# The finished APK is copied to web/public/downloads/, where the website picks
# it up when running locally.
#
# --publish additionally uploads it to a GitHub release and records the URL in
# web/public/downloads/manifest.json. That manifest is what the DEPLOYED site
# reads: a 45 MB APK per app per release is far too much to keep in git, so the
# binaries are gitignored and Vercel never sees them. Without --publish a build
# is visible on localhost only.
#
# Why a script rather than a one-off command: `expo prebuild` regenerates
# android/ from scratch and the generated app/build.gradle signs release builds
# with the shared React Native debug keystore. That is fine for testing but
# wrong for something handed to students, so the signing config has to be
# re-applied after every prebuild. Doing it here keeps that reproducible.

set -euo pipefail

APP="${1:-}"
if [[ "$APP" != "student" && "$APP" != "teacher" ]]; then
  echo "usage: $0 student|teacher [--publish]" >&2
  exit 1
fi

PUBLISH=0
if [[ "${2:-}" == "--publish" ]]; then
  PUBLISH=1
elif [[ -n "${2:-}" ]]; then
  echo "unknown option: $2 (expected --publish)" >&2
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

# Checked up front rather than after the build — Gradle takes minutes, and
# finding out about a missing login at the end wastes all of it.
if [[ "$PUBLISH" == 1 ]]; then
  command -v gh >/dev/null || {
    echo "--publish needs the GitHub CLI: https://cli.github.com" >&2
    exit 1
  }
  gh auth status >/dev/null 2>&1 || {
    echo "--publish needs a logged-in GitHub CLI. Run: gh auth login" >&2
    exit 1
  }
fi

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
# Strip any block a previous run appended first — Gradle would honour the last
# definition anyway, but re-running the script should not keep growing the file.
sed -i '/^# --- SFGC release signing/,/^SFGC_KEY_PASSWORD=/d' android/gradle.properties
{
  echo ""
  echo "# --- SFGC release signing (written by scripts/build-apk.sh) ---"
  echo "SFGC_STORE_FILE=$SFGC_STORE_FILE"
  echo "SFGC_KEY_ALIAS=$SFGC_KEY_ALIAS"
  echo "SFGC_STORE_PASSWORD=$SFGC_STORE_PASSWORD"
  echo "SFGC_KEY_PASSWORD=$SFGC_KEY_PASSWORD"
} >> android/gradle.properties

# Build only the two architectures real phones use. x86 and x86_64 exist for
# the Android emulator; shipping them adds ~35 MB to the download and a large
# chunk of compile time for something no student's device will ever load.
if ! grep -q '^reactNativeArchitectures=armeabi-v7a,arm64-v8a$' android/gradle.properties; then
  sed -i '/^reactNativeArchitectures=/d' android/gradle.properties
  echo "reactNativeArchitectures=armeabi-v7a,arm64-v8a" >> android/gradle.properties
fi

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

if [[ "$PUBLISH" != 1 ]]; then
  log "Done"
  echo "  $OUT_DIR/sfgc-${APP}.apk  ($SIZE)"
  echo "  Visible at /#apps when the site runs locally."
  echo "  Re-run with --publish to put it on the deployed site."
  exit 0
fi

# --------------------------------------------------------------- publish ----

log "Publishing to GitHub Releases"

# The path goes through argv, not the script text. Git Bash rewrites arguments
# that look like POSIX paths into Windows ones before handing them to native
# node; a path pasted inside the -e string gets no such treatment and node then
# fails to resolve /e/sfgc/... on Windows.
VERSION=$(node -e \
  "const fs=require('fs');console.log(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).expo.version)" \
  "$APP_DIR/app.json")
TAG="${APP}-v${VERSION}"
ASSET="sfgc-${APP}.apk"

# A tag per app so the two can be versioned independently. Re-running for the
# same version replaces the asset rather than failing, because rebuilding
# 1.0.0 after a fix is far more common than remembering to bump first.
if gh release view "$TAG" >/dev/null 2>&1; then
  echo "  updating existing release $TAG"
else
  echo "  creating release $TAG"
  gh release create "$TAG" \
    --title "SFGC ${APP^} v${VERSION}" \
    --notes "Android build of the SFGC ${APP} app, signed by the college. Install on Android 7.0 or newer." \
    --latest=false
fi

gh release upload "$TAG" "$OUT_DIR/$ASSET" --clobber

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
URL="https://github.com/${REPO}/releases/download/${TAG}/${ASSET}"

# The website reads this manifest; the APKs themselves stay out of git.
node - "$OUT_DIR/manifest.json" "$APP" "$URL" "$VERSION" "$OUT_DIR/$ASSET" <<'NODE'
const fs = require('fs')
const [file, app, url, version, apk] = process.argv.slice(2)

let manifest = {}
try {
  manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
} catch {
  // First publish, or a manifest someone hand-edited into invalid JSON.
}

manifest[app] = {
  url,
  version,
  size: fs.statSync(apk).size,
  published: new Date().toISOString(),
}

// Sorted so two apps published in either order give the same file — a
// reordered manifest would otherwise show up as a spurious diff.
const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n')
console.log(`  recorded ${app} v${version} in downloads/manifest.json`)
NODE

log "Done"
echo "  $OUT_DIR/sfgc-${APP}.apk  ($SIZE)"
echo "  $URL"
echo
echo "  Commit web/public/downloads/manifest.json and push — the download"
echo "  button on the deployed site follows it."
