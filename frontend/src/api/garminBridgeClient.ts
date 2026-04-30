import axios from 'axios';

export const GARMIN_BRIDGE_BASE_URL =
  import.meta.env.VITE_GARMIN_BRIDGE_URL ?? 'http://127.0.0.1:8976';

export const GARMIN_BRIDGE_START_COMMAND = 'npm run garmin:bridge';

const garminBridgeClient = axios.create({
  baseURL: GARMIN_BRIDGE_BASE_URL,
  timeout: 1500,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default garminBridgeClient;
