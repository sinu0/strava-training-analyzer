import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const distDirectory = new URL('../dist/', import.meta.url);
const files = readdirSync(assetsDirectory).filter((file) => file.endsWith('.js'));

const budgets = [
  { label: 'wejście aplikacji', pattern: /^index-[\w-]+\.js$/, maxGzipKb: 115 },
  { label: 'ekran Dzisiaj', pattern: /^TodayPage-[\w-]+\.js$/, maxGzipKb: 30 },
  { label: 'ekran Tras', pattern: /^RoutePlannerPage-[\w-]+\.js$/, maxGzipKb: 25 },
];

let failed = false;

for (const budget of budgets) {
  const file = files.find((candidate) => budget.pattern.test(candidate));
  if (!file) {
    console.error(`Brak artefaktu dla budżetu: ${budget.label}`);
    failed = true;
    continue;
  }
  const gzipKb = gzipSync(readFileSync(join(assetsDirectory.pathname, file))).byteLength / 1024;
  const status = gzipKb <= budget.maxGzipKb ? 'OK' : 'PRZEKROCZONY';
  console.log(`${budget.label}: ${gzipKb.toFixed(2)} kB gzip / ${budget.maxGzipKb} kB — ${status}`);
  if (gzipKb > budget.maxGzipKb) failed = true;
}

const indexHtml = readFileSync(join(distDirectory.pathname, 'index.html'), 'utf8');
const initialFiles = [...new Set(
  [...indexHtml.matchAll(/(?:src|href)="\/(assets\/[^" ]+\.js)"/g)].map((match) => match[1]),
)];
const initialGzipKb = initialFiles.reduce((total, file) => (
  total + gzipSync(readFileSync(join(distDirectory.pathname, file))).byteLength / 1024
), 0);
const initialBudgetKb = 210;
const initialStatus = initialGzipKb <= initialBudgetKb ? 'OK' : 'PRZEKROCZONY';
console.log(`początkowy JavaScript: ${initialGzipKb.toFixed(2)} kB gzip / ${initialBudgetKb} kB — ${initialStatus}`);
if (initialGzipKb > initialBudgetKb) failed = true;

const largest = files
  .map((file) => ({
    file,
    gzipKb: gzipSync(readFileSync(join(assetsDirectory.pathname, file))).byteLength / 1024,
  }))
  .sort((left, right) => right.gzipKb - left.gzipKb)[0];

if (largest && largest.gzipKb > 110) {
  console.error(`Największy chunk ${largest.file} ma ${largest.gzipKb.toFixed(2)} kB gzip (limit 110 kB).`);
  failed = true;
}

if (failed) process.exitCode = 1;
