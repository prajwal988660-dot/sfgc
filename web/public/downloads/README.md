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
cd apps/student-app
eas build -p android --profile preview
```

When the build finishes, EAS gives you a download URL. Download the `.apk`,
rename it to `sfgc-student.apk`, and put it in this folder. Repeat for the
teacher app.

## Before you publish a build

Check that the APK points at the deployed API and not a laptop:

```bash
# should print the deployed URL, not a 10.x or 192.168.x address
grep -A2 '"preview"' ../../apps/student-app/eas.json
```

## A note on file size

APKs are 40–70 MB. If you are deploying the website to a host with a repository
size limit, consider hosting the APKs on the EAS download URL instead and
changing `file` in `web/src/content/college.ts` to that absolute URL — the
section handles an external URL the same way, it just cannot show the size.
