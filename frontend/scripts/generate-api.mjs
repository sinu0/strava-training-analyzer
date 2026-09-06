import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const source = process.env.OPENAPI_SOURCE || '../backend/build/openapi.json';
const input = /^https?:/.test(source) ? new URL(source) : pathToFileURL(path.resolve(source));
const generated = astToString(await openapiTS(input, { alphabetize: true }));
const destination = new URL('../src/api/generated/schema.ts', import.meta.url);
if (process.argv.includes('--check')) {
  const current = await fs.readFile(destination, 'utf8');
  if (current !== generated) {
    throw new Error('Kontrakt API jest nieaktualny. Uruchom backend integrationTest, następnie npm run api:generate.');
  }
  console.log('Kontrakt OpenAPI jest zgodny z backendem.');
} else {
  await fs.writeFile(destination, generated);
  console.log('Wygenerowano typy API z ' + source);
}
