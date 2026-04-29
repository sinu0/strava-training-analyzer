import os from 'node:os';
import path from 'node:path';

export const DEFAULT_CDP_PORT = 9223;

const WINDOWS_CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
];

const LINUX_CHROME_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];

const MAC_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

export function getBrowserCandidates() {
  if (process.platform === 'win32') {
    return WINDOWS_CHROME_PATHS;
  }
  if (process.platform === 'darwin') {
    return MAC_CHROME_PATHS;
  }
  return LINUX_CHROME_PATHS;
}

export function buildChromeArgs({ profileDir, cdpPort, startUrl }) {
  return [
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${cdpPort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=AutomationControlled',
    startUrl,
  ];
}

export function buildStealthScript() {
  return () => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true,
    });

    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true,
    });

    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
      configurable: true,
    });

    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        value: { runtime: {} },
        configurable: true,
      });
    }
  };
}
