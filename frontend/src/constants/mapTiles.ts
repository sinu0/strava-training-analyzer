export const MAP_TILE_CONFIG = {
  cycling: {
    id: 'cycling',
    label: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://cyclosm.org/">CyclOSM</a>',
  },
  standard: {
    id: 'standard',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
} as const;

export type MapTileVariant = keyof typeof MAP_TILE_CONFIG;

export const DEFAULT_MAP_TILE_VARIANT: MapTileVariant = 'standard';
