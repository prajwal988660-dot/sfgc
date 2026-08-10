# APK downloads

Drop the built Android apps here with **exactly these names**:

```
sfgc-student.apk
sfgc-teacher.apk
```

The download section on the homepage (`/#apps`) reads this folder at render
time. A file that is present becomes a live "Download APK" button showing its
real size and build date; a file that is missing shows "Coming soon" instead of
a broken link. There is no config to edit.

## Getting the files

```bash
./scripts/build-apk.sh student
./scripts/build-apk.sh teacher
```

The script builds a signed release APK on this machine and copies it here under
the right name — nothing to rename or move by hand. It needs a JDK (the one
bundled with Android Studio is fine), the Android SDK, and a
`credentials/signing.properties` in the app directory holding the keystore
passwords. The first run downloads the Gradle dependencies and takes a while;
later runs reuse them.

`npm run build:apk` inside an app still runs the hosted EAS build instead, if
you would rather queue it than compile locally. That path hands back a download
URL, and the file has to be renamed to match the names above.

## Before you publish a build

The API URL is baked in at build time from the app's `.env`, so a LAN address
produces an app that only works on your wifi. The script checks this and asks
before continuing, but to look yourself:

```bash
# should print the deployed URL, not a 10.x or 192.168.x address
cat ../../apps/student-app/.env
```

## A note on file size

APKs are 40–50 MB. They carry a full copy of the React Native runtime for each
CPU architecture, so the script limits the build to the two that real phones
use (`armeabi-v7a`, `arm64-v8a`) and drops the x86 slices the emulator wants.

If you are deploying the website to a host with a repository size limit,
consider hosting the APKs elsewhere and changing `file` in
`web/src/content/college.ts` to that absolute URL — the section handles an
external URL the same way, it just cannot show the size.
