import { access, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { chromium } from 'playwright';
import {
  DEFAULT_CDP_PORT,
  buildChromeArgs,
  buildStealthScript,
  getBrowserCandidates,
} from './garmin-bridge-launcher.mjs';

const HOST = process.env.GARMIN_BRIDGE_HOST ?? '127.0.0.1';
const PORT = Number(process.env.GARMIN_BRIDGE_PORT ?? '8976');
const CDP_PORT = Number(process.env.GARMIN_BRIDGE_CDP_PORT ?? DEFAULT_CDP_PORT);
const PROFILE_DIR = process.env.GARMIN_BRIDGE_PROFILE_DIR
  ?? path.join(os.homedir(), '.strava-training-analyzer', 'garmin-bridge');
const BROWSER_PATH = process.env.GARMIN_BRIDGE_BROWSER_PATH ?? null;

const CONNECT_HOME_URL = 'https://connect.garmin.com/modern/';
const PROFILE_URL = 'https://connect.garmin.com/modern/proxy/userprofile-service/socialProfile';
const PROXY_BASE = 'https://connect.garmin.com/modern/proxy';
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const LOGIN_POLL_MS = 2000;
const CDP_WAIT_TIMEOUT_MS = 15000;

const state = {
  busy: false,
  sessionReady: false,
  requiresInteraction: false,
  lastSyncAt: null,
  lastError: null,
};

let contextPromise;
let browserPromise;
let browserProcess;
let listenersAttached = false;

async function ensureContext() {
  if (!contextPromise) {
    await mkdir(PROFILE_DIR, { recursive: true });
    contextPromise = launchBrowserContext();
  }

  return contextPromise;
}

async function launchBrowserContext() {
  const chromeExecutable = await resolveChromeExecutable();
  if (chromeExecutable) {
    console.log(`Garmin Bridge: uruchamiam zwykły Chrome przez CDP: ${chromeExecutable}`);
    return launchChromeOverCdp(chromeExecutable);
  }

  console.log('Garmin Bridge: nie znalazłem systemowego Chrome, używam fallback Playwright Chromium.');
  return launchPlaywrightContext();
}

async function resolveChromeExecutable() {
  const candidates = BROWSER_PATH ? [BROWSER_PATH] : getBrowserCandidates();
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // ignore missing candidate
    }
  }
  return null;
}

async function launchChromeOverCdp(executablePath) {
  const args = buildChromeArgs({
    profileDir: PROFILE_DIR,
    cdpPort: CDP_PORT,
    startUrl: CONNECT_HOME_URL,
  });

  browserProcess = spawn(executablePath, args, {
    stdio: 'ignore',
  });

  browserProcess.on('exit', () => {
    browserProcess = null;
  });

  await waitForCdp();
  browserPromise = chromium.connectOverCDP(`http://${HOST}:${CDP_PORT}`);
  const browser = await browserPromise;
  const [context] = browser.contexts();
  if (!context) {
    throw new Error('Chrome CDP uruchomił się bez dostępnego kontekstu przeglądarki.');
  }

  await hardenContext(context);
  return context;
}

async function launchPlaywrightContext() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 1400, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=AutomationControlled',
    ],
    locale: 'en-US',
  });
  await hardenContext(context);
  return context;
}

async function waitForCdp() {
  const deadline = Date.now() + CDP_WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://${HOST}:${CDP_PORT}/json/version`);
      if (response.ok) {
        return;
      }
    } catch {
      // browser not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error('Chrome uruchomiony dla bridge nie wystawił portu CDP na czas.');
}

async function hardenContext(context) {
  await context.addInitScript(buildStealthScript());
  await context.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
  });
}

async function getPage() {
  const context = await ensureContext();
  if (!listenersAttached) {
    attachContextListeners(context);
    listenersAttached = true;
  }
  const existingPage = context.pages()[0];
  if (existingPage) {
    return existingPage;
  }

  return context.newPage();
}

function attachContextListeners(context) {
  context.on('page', (page) => {
    page.on('response', (response) => {
      if (response.url().includes('/portal/api/login') && response.status() === 403) {
        state.lastError = 'Garmin odrzucił logowanie w przeglądarce bridge (HTTP 403). Bridge używa teraz zwykłego Chrome, ale jeśli problem wraca, zamknij stare okna bridge i spróbuj ponownie.';
      }
    });
  });
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function fetchJsonInPage(page, url, { allowEmpty = false } = {}) {
  const result = await page.evaluate(async ({ requestUrl }) => {
    try {
      const response = await fetch(requestUrl, { credentials: 'include' });
      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        text: error instanceof Error ? error.message : String(error),
      };
    }
  }, { requestUrl: url });

  if (!result.ok) {
    if (allowEmpty && (result.status === 204 || result.status === 404)) {
      return null;
    }
    throw new Error(`Garmin endpoint returned HTTP ${result.status} for ${url}`);
  }

  if (!result.text) {
    return allowEmpty ? null : {};
  }

  return JSON.parse(result.text);
}

async function getSocialProfile(page) {
  return fetchJsonInPage(page, PROFILE_URL, { allowEmpty: true });
}

async function ensureAuthenticated(page) {
  await page.goto(CONNECT_HOME_URL, { waitUntil: 'domcontentloaded' });

  const existingProfile = await getSocialProfile(page);
  if (existingProfile) {
    state.sessionReady = true;
    state.requiresInteraction = false;
    state.lastError = null;
    return existingProfile;
  }

  state.requiresInteraction = true;
  state.lastError = 'Wymagane logowanie Garmin w przeglądarce bridge.';
  console.log(
    'Garmin Bridge: zaloguj się w otwartym oknie Garmin Connect i dokończ ewentualną CAPTCHA.',
  );
  await page.bringToFront();

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await page.waitForTimeout(LOGIN_POLL_MS);
    const profile = await getSocialProfile(page);
    if (profile) {
      state.sessionReady = true;
      state.requiresInteraction = false;
      state.lastError = null;
      return profile;
    }
  }

  throw new Error('Nie udało się potwierdzić logowania Garmin w czasie 5 minut.');
}

function buildEndpointUrls(displayName, date) {
  return {
    summary: `${PROXY_BASE}/usersummary-service/usersummary/daily/${displayName}?calendarDate=${date}`,
    heartRate: `${PROXY_BASE}/wellness-service/wellness/dailyHeartRate/${displayName}?date=${date}`,
    sleep: `${PROXY_BASE}/wellness-service/wellness/dailySleepData/${displayName}?date=${date}`,
    hrv: `${PROXY_BASE}/hrv-service/hrv/${displayName}?date=${date}`,
  };
}

function getSleepScore(sleep) {
  return sleep?.sleepScores?.overall?.value ?? null;
}

function buildImportDay(date, summary, heartRate, sleep, hrv) {
  const restingHrBpm = heartRate?.restingHeartRate ?? summary?.restingHeartRate ?? null;

  if (
    restingHrBpm == null
    && summary?.totalSteps == null
    && sleep?.sleepTimeSeconds == null
    && hrv?.hrvSummary?.lastNightAvg == null
  ) {
    return null;
  }

  return {
    date,
    restingHrBpm,
    hrvRmssd: hrv?.hrvSummary?.lastNightAvg ?? null,
    sleepScore: getSleepScore(sleep),
    bodyBattery: summary?.bodyBatteryMostRecentValue ?? null,
    stressAvg: summary?.averageStressLevel ?? null,
    sleepDurationSeconds: sleep?.sleepTimeSeconds ?? null,
    steps: summary?.totalSteps ?? null,
    activeCalories: summary?.activeKilocalories ?? null,
    deepSleepSeconds: sleep?.deepSleepSeconds ?? null,
    lightSleepSeconds: sleep?.lightSleepSeconds ?? null,
    remSleepSeconds: sleep?.remSleepSeconds ?? null,
    awakeSleepSeconds: sleep?.awakeSleepSeconds ?? null,
    syncedAt: new Date().toISOString(),
  };
}

function enumerateDates(from, to) {
  const dates = [];
  const current = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

async function syncRange({ from, to, backendUrl }) {
  state.busy = true;
  const page = await getPage();

  try {
    const profile = await ensureAuthenticated(page);
    const displayName = profile?.displayName ?? profile?.socialProfile?.displayName ?? profile?.userName;
    if (!displayName) {
      throw new Error('Nie udało się odczytać identyfikatora profilu Garmin po zalogowaniu.');
    }

    const importDays = [];
    for (const date of enumerateDates(from, to)) {
      const urls = buildEndpointUrls(displayName, date);
      const [summary, heartRate, sleep, hrv] = await Promise.all([
        fetchJsonInPage(page, urls.summary, { allowEmpty: true }),
        fetchJsonInPage(page, urls.heartRate, { allowEmpty: true }),
        fetchJsonInPage(page, urls.sleep, { allowEmpty: true }),
        fetchJsonInPage(page, urls.hrv, { allowEmpty: true }),
      ]);

      const importDay = buildImportDay(date, summary, heartRate, sleep, hrv);
      if (importDay) {
        importDays.push(importDay);
      }
    }

    const importResponse = await fetch(`${backendUrl}/api/garmin/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: importDays }),
    });

    if (!importResponse.ok) {
      throw new Error(`Backend import failed with HTTP ${importResponse.status}`);
    }

    const result = await importResponse.json();
    state.lastSyncAt = new Date().toISOString();
    state.lastError = null;
    state.sessionReady = true;
    return result;
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    state.busy = false;
  }
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    writeJson(response, 404, { error: 'Not found' });
    return;
  }

  if (request.method === 'OPTIONS') {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && request.url === '/status') {
    writeJson(response, 200, {
      online: true,
      busy: state.busy,
      sessionReady: state.sessionReady,
      requiresInteraction: state.requiresInteraction,
      lastSyncAt: state.lastSyncAt,
      lastError: state.lastError,
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/sync') {
    if (state.busy) {
      writeJson(response, 409, { error: 'Synchronizacja Garmin jest już uruchomiona.' });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const result = await syncRange(body);
      writeJson(response, 200, result);
    } catch (error) {
      writeJson(response, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  writeJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`Garmin Bridge nasłuchuje na http://${HOST}:${PORT}`);
  console.log(`Sesja przeglądarki będzie trzymana w: ${PROFILE_DIR}`);
});

async function shutdown() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      // ignore close errors on shutdown
    }
  }

  if (browserProcess) {
    browserProcess.kill();
  }
}

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});
