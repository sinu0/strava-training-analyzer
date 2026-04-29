/// <reference types="vite/client" />

declare module '*.mjs' {
  export const DEFAULT_CDP_PORT: number;

  export function getBrowserCandidates(): string[];

  export function buildChromeArgs(options: {
    profileDir: string;
    cdpPort: number;
    startUrl: string;
  }): string[];

  export function buildStealthScript(): () => void;
}
