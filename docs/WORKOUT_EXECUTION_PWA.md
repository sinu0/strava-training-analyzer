# Workout execution and PWA

[← README](../README.md)

## Secure access from a phone on the LAN

Service Worker, PWA install and Screen Wake Lock require a secure origin. localhost is an
exception only on the same device; http://192.168.x.x is not a working PWA environment.

1. Create a local, trusted certificate:

       tools/setup-lan-https.sh 192.168.1.20

2. Install the local CA from `mkcert -CAROOT` as trusted on the phone.
3. Start the HTTPS variant:

       docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build

4. Open https://192.168.1.20, confirm the padlock shows no warning and install the app.

The UI shows an explicit warning when the origin cannot provide PWA/offline. The base Compose
stays bound to loopback; the HTTPS override deliberately exposes only port 443.

## Offline model

The active execution snapshot is stored in IndexedDB, with a recoverable copy in localStorage.
Pause, resume, step, LAP and intensity are applied locally at once. When the network drops,
idempotent changes go to an ordered queue and are sent on the next online event. The timer
rebuilds state from timestamps; the UI interval only refreshes the view.

The Service Worker caches a minimal app shell and visited static assets. A new worker does not
call skipWaiting while an active workout is stored, so an update never reloads the player
mid-session.

## Garmin and export

FIT is encoded with the official com.garmin:fit SDK. File ID has a random unique serial,
messages are written as File ID → Workout → Workout Step, and repeats, open steps and
FTP-percentage targets use the current FIT profile. Exporting a scheduled workout always uses
the snapshot and FTP stored in the plan.

Automatic Garmin Connect upload is not implemented. The GARMIN capability stays UNAVAILABLE
until the app gets access to the Garmin Connect Developer Program and implements the official
OAuth 2.0. Downloading FIT/ZWO and copying FIT over USB to Garmin/NewFiles is the supported
fallback.

## Trainer mode (Bluetooth)

The player at `/workout/:id` is a trainer cockpit: live power (3 s), cadence and heart rate,
the current step with countdown and zone, interval plan, profile with the ridden power and
ERG / resistance / free-ride control. Keyboard shortcuts: space pause, ↑/↓ intensity ±1%,
→ skip step, ← repeat step.

Devices connect via Web Bluetooth:

- trainer — Fitness Machine Service (FTMS 0x1826), e.g. Elite Suito: data from Indoor Bike Data,
  control via Control Point (ERG, resistance); Cycling Power (0x1818) fallback is read-only;
- HR strap — Heart Rate Service (0x180D), e.g. Garmin HRM-Dual / HRM-Pro / HRM 600
  (older ANT+-only straps are not visible to the browser).

After a disconnect the app reconnects with backoff (1 → 30 s) and restores the ERG target.
Pause and workout end release the trainer resistance.

Browser requirements: Chrome/Edge on desktop (Linux with BlueZ; if the device picker does not
open, enable `chrome://flags/#enable-web-bluetooth`) or Chrome on Android over HTTPS (see the
LAN section). Safari/iOS does not support Web Bluetooth.

Demo mode without hardware: add `?devices=sim` to the player URL — trainer and strap are
simulated deterministically (the e2e tests use the same mode).

### In-app recording (optional)

The "Nagrywaj przejazd w aplikacji" (record ride in app) switch in the devices panel stores 1 Hz
samples (power, HR, cadence, speed) in IndexedDB in 60 s chunks. After the workout the chunks
are sent idempotently (`POST /api/v2/workouts/executions/{id}/samples`) and the summary offers a
FIT file (`GET /api/v2/workouts/executions/{id}/export/activity.fit`, official Garmin FIT SDK:
records, one lap per step, indoor cycling session). When off: the Garmin records the ride and
the evaluation arrives after Strava sync. If a Garmin records in parallel, let it only read data
from the Suito — the trainer listens to one controlling app.

## Manual device test

- install the CA and verify HTTPS without a warning;
- install the PWA on Android and iOS;
- start a workout, turn off the screen or switch apps for 2–3 minutes and come back;
- reload the page and restart the phone, then resume the same step and time;
- disconnect the network, pause, LAP and change intensity, restore the network and check sync;
- confirm sound, vibration and Wake Lock or an explicit device fallback;
- download the FIT, copy it to Garmin/NewFiles, then open the workout on a physical Garmin.

### Trainer and strap (Elite Suito + Garmin HRM)

- Chrome on Linux and Android: connect the Suito and the strap from the "Urządzenia" (Devices) panel, check name, battery and capabilities (ERG, resistance);
- in ERG change the step and intensity ±5% — trainer resistance should change within ~1 s;
- switch to "Opór" (Resistance) and move the slider, then "Wolna" (Free) — the trainer should stop controlling;
- pause releases resistance, resume restores the target;
- remove the strap / turn off the trainer for ~10 s — status "utracono — ponawiam…" (lost — retrying), then automatic recovery;
- enable recording, ride a few minutes, finish, download the FIT and open it in Garmin Connect or upload it to Strava.
