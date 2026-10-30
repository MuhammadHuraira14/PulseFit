/**
 * Web Bluetooth GATT Heart Rate Monitor Integration & Physiological Simulator.
 * Complies with Bluetooth SIG Heart Rate Profile (HRP) 0x180D & Characteristic 0x2A37.
 */

import { BleDeviceInfo, BleStatus } from '../types/fitness';

export type HeartRateCallback = (data: {
  heartRate: number;
  sensorContact: boolean;
  rrIntervalMs?: number;
  batteryLevel?: number;
}) => void;

export class BleHeartRateManager {
  private device: any = null;
  private server: any = null;
  private hrCharacteristic: any = null;
  private batteryCharacteristic: any = null;
  private onDataCallback: HeartRateCallback | null = null;
  private onStatusChangeCallback: ((info: BleDeviceInfo) => void) | null = null;

  // Simulator state
  private isSimulating = false;
  private simulationInterval: any = null;
  private simTargetHr = 135;
  private simCurrentHr = 72;
  private simPhase: 'warmup' | 'work' | 'recovery' | 'peak' = 'warmup';
  private simSeconds = 0;

  private currentInfo: BleDeviceInfo = {
    name: 'Not connected',
    status: 'disconnected',
    sensorContact: false,
    deviceType: 'physical',
  };

  public setCallbacks(
    onData: HeartRateCallback,
    onStatusChange: (info: BleDeviceInfo) => void
  ) {
    this.onDataCallback = onData;
    this.onStatusChangeCallback = onStatusChange;
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getDeviceInfo(): BleDeviceInfo {
    return { ...this.currentInfo };
  }

  private updateStatus(status: BleStatus, name?: string, contact?: boolean, battery?: number) {
    this.currentInfo = {
      ...this.currentInfo,
      status,
      name: name ?? this.currentInfo.name,
      sensorContact: contact !== undefined ? contact : this.currentInfo.sensorContact,
      batteryLevel: battery !== undefined ? battery : this.currentInfo.batteryLevel,
    };
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.currentInfo);
    }
  }

  /**
   * Connects to a real Bluetooth LE Heart Rate Monitor (Polar, Garmin, Wahoo, Apple Watch, etc.)
   */
  public async connectPhysical(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. You can use the built-in BLE Monitor Simulator!');
    }

    try {
      this.stopSimulation();
      this.updateStatus('scanning', 'Scanning for BLE Heart Rate Monitors...');

      // Request device with standard Heart Rate GATT service
      // @ts-ignore
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service'],
      });

      if (!this.device) {
        this.updateStatus('disconnected', 'Not connected');
        return false;
      }

      this.updateStatus('connecting', this.device.name || 'Bluetooth HRM');

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));

      this.server = await this.device.gatt.connect();

      // Read Heart Rate Service
      const hrService = await this.server.getPrimaryService('heart_rate');
      this.hrCharacteristic = await hrService.getCharacteristic('heart_rate_measurement');
      await this.hrCharacteristic.startNotifications();
      this.hrCharacteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleHeartRateMeasurement.bind(this)
      );

      // Try reading battery service if available
      try {
        const batteryService = await this.server.getPrimaryService('battery_service');
        this.batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryData = await this.batteryCharacteristic.readValue();
        const batteryPct = batteryData.getUint8(0);
        this.currentInfo.batteryLevel = batteryPct;
      } catch {
        // Battery service is optional in many HRM bands
      }

      this.currentInfo.deviceType = 'physical';
      this.updateStatus('connected', this.device.name || 'Bluetooth HRM', true);
      return true;
    } catch (err: any) {
      console.warn('Bluetooth connection error/cancelled:', err);
      this.updateStatus('disconnected', 'Not connected');
      throw err;
    }
  }

  private handleHeartRateMeasurement(event: any) {
    const value: DataView = event.target.value;
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    const sensorContactBit = (flags >> 1) & 0x3;
    const sensorContact = sensorContactBit === 3; // 0x3 means contact detected

    let offset = 1;
    let heartRate = 0;
    if (rate16Bits) {
      heartRate = value.getUint16(offset, /*littleEndian=*/ true);
      offset += 2;
    } else {
      heartRate = value.getUint8(offset);
      offset += 1;
    }

    const energyExpendedPresent = (flags >> 3) & 0x1;
    if (energyExpendedPresent) {
      offset += 2;
    }

    const rrIntervalPresent = (flags >> 4) & 0x1;
    let rrIntervalMs: number | undefined;
    if (rrIntervalPresent && offset + 2 <= value.byteLength) {
      const rawRr = value.getUint16(offset, /*littleEndian=*/ true);
      rrIntervalMs = Math.round((rawRr / 1024) * 1000);
    }

    if (this.onDataCallback) {
      this.onDataCallback({
        heartRate,
        sensorContact,
        rrIntervalMs,
        batteryLevel: this.currentInfo.batteryLevel,
      });
    }
  }

  private handleDisconnection() {
    this.updateStatus('disconnected', 'Disconnected', false);
  }

  /**
   * Disconnects any active connection or simulator.
   */
  public disconnect() {
    this.stopSimulation();
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.hrCharacteristic = null;
    this.updateStatus('disconnected', 'Not connected', false);
  }

  /**
   * Starts a physiologically modeled BLE Heart Rate Monitor Simulator.
   * Enables full real-time telemetry testing without needing physical hardware.
   */
  public startSimulation(targetIntensity: 'moderate' | 'hiit' | 'recovery' = 'moderate') {
    this.disconnect();
    this.isSimulating = true;
    this.currentInfo.deviceType = 'simulated';
    this.currentInfo.batteryLevel = 94;

    switch (targetIntensity) {
      case 'hiit':
        this.simTargetHr = 165;
        break;
      case 'recovery':
        this.simTargetHr = 110;
        break;
      case 'moderate':
      default:
        this.simTargetHr = 138;
        break;
    }

    this.simCurrentHr = 74;
    this.simSeconds = 0;
    this.updateStatus('simulated', 'Polar H10 (Virtual BLE Monitor)', true, 94);

    this.simulationInterval = setInterval(() => {
      this.simSeconds += 1;

      // Realistic HR drift towards target with physiological sinus arrhythmia & noise
      const diff = this.simTargetHr - this.simCurrentHr;
      const step = diff * 0.08 + (Math.random() - 0.5) * 3;
      this.simCurrentHr = Math.max(55, Math.min(195, Math.round(this.simCurrentHr + step)));

      // Calculate approximate RR interval in milliseconds (60000 / HR) with micro-variability
      const baseRr = 60000 / this.simCurrentHr;
      const rrVariation = (Math.sin(this.simSeconds * 0.4) * 25) + ((Math.random() - 0.5) * 15);
      const rrIntervalMs = Math.round(baseRr + rrVariation);

      if (this.onDataCallback) {
        this.onDataCallback({
          heartRate: this.simCurrentHr,
          sensorContact: true,
          rrIntervalMs,
          batteryLevel: Math.max(10, 94 - Math.floor(this.simSeconds / 120)),
        });
      }
    }, 1000);
  }

  public adjustSimulatedTarget(targetHr: number) {
    this.simTargetHr = targetHr;
  }

  public stopSimulation() {
    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

// Global singleton instance for easy app-wide access
export const bleHeartRate = new BleHeartRateManager();
