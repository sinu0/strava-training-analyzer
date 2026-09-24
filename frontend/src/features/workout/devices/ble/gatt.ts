/** 16-bit Bluetooth SIG assigned numbers used by the app. */
export const GATT = {
  heartRateService: 0x180d,
  heartRateMeasurement: 0x2a37,
  batteryService: 0x180f,
  batteryLevel: 0x2a19,
  deviceInformation: 0x180a,
  cyclingPowerService: 0x1818,
  cyclingPowerMeasurement: 0x2a63,
  fitnessMachineService: 0x1826,
  fitnessMachineFeature: 0x2acc,
  indoorBikeData: 0x2ad2,
  supportedResistanceRange: 0x2ad6,
  supportedPowerRange: 0x2ad8,
  fitnessMachineControlPoint: 0x2ad9,
  fitnessMachineStatus: 0x2ada,
} as const;
