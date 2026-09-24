/** Battery Level (0x2A19): uint8 percentage. */
export function parseBatteryLevel(data: DataView): number {
  return Math.min(100, data.getUint8(0));
}
