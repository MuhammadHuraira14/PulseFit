import React, { useState } from 'react';
import { Bluetooth, Sparkles, X, ShieldCheck, Battery, Radio, AlertCircle } from 'lucide-react';
import { BleDeviceInfo } from '../types/fitness';
import { bleHeartRate } from '../services/bleHeartRate';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bleInfo: BleDeviceInfo;
  onStatusChange: (info: BleDeviceInfo) => void;
}

export const WearableModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bleInfo,
  onStatusChange,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnectPhysical = async () => {
    setErrorMsg(null);
    setIsConnecting(true);
    try {
      await bleHeartRate.connectPhysical();
      onStatusChange(bleHeartRate.getDeviceInfo());
      onClose();
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setErrorMsg('Pairing was cancelled or no device was selected.');
      } else if (err.message && err.message.includes('Web Bluetooth is not supported')) {
        setErrorMsg('Web Bluetooth is not supported in this browser environment. Please use the built-in Virtual BLE Simulator below!');
      } else {
        setErrorMsg(err.message || 'Unable to connect to Bluetooth device. Ensure Bluetooth is enabled.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartSimulation = (intensity: 'moderate' | 'hiit' | 'recovery' = 'moderate') => {
    setErrorMsg(null);
    bleHeartRate.startSimulation(intensity);
    onStatusChange(bleHeartRate.getDeviceInfo());
    onClose();
  };

  const handleDisconnect = () => {
    bleHeartRate.disconnect();
    onStatusChange(bleHeartRate.getDeviceInfo());
  };

  const isConnected = bleInfo.status === 'connected' || bleInfo.status === 'simulated';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wearable-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Bluetooth className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="wearable-modal-title" className="text-base font-semibold tracking-tight text-white">
                Wearable Heart Rate Monitor Integration
              </h2>
              <p className="text-xs text-slate-400">Bluetooth LE Heart Rate Profile (0x180D GATT standard)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close wearable connection modal"
            className="p-1 text-slate-400 hover:text-white rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-rose-300">Connection Note</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Current Connection Status */}
        <div className="mt-5 p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Device Status</span>
              <p className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                  aria-hidden="true"
                />
                {bleInfo.name}
              </p>
            </div>
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/60 rounded-md transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          {isConnected && (
            <div className="mt-3 pt-3 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Battery className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Battery: {bleInfo.batteryLevel ?? 100}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Radio className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Skin Contact: {bleInfo.sensorContact ? 'Detected' : 'Searching'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Selection */}
        <div className="mt-5 space-y-3">
          <button
            onClick={handleConnectPhysical}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-lg transition-all text-left group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-md">
                <Bluetooth className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-emerald-300">
                  Pair Physical Bluetooth HRM
                </p>
                <p className="text-[11px] text-slate-400">
                  Polar H10/Verity, Garmin HRM, Wahoo TICKR, Scosche, Apple Watch
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-400">Pair &rarr;</span>
          </button>

          <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-semibold text-white">Built-In Virtual HRM Simulator</p>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              No physical strap nearby? Launch our physiologically accurate BLE simulator to test live zone telemetry and calorie calculation immediately.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleStartSimulation('recovery')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-md border border-slate-700 text-center transition-colors"
              >
                Zone 1 (110 BPM)
              </button>
              <button
                onClick={() => handleStartSimulation('moderate')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-md border border-slate-700 text-center transition-colors"
              >
                Zone 2 (138 BPM)
              </button>
              <button
                onClick={() => handleStartSimulation('hiit')}
                className="py-1.5 px-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white rounded-md border border-slate-700 text-center transition-colors"
              >
                Zone 5 (165 BPM)
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Assurance */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong className="text-slate-300 font-medium">Biometric Privacy Guarantee:</strong> Heart rate data is parsed directly inside your browser memory using Web Bluetooth GATT protocols. Telemetry never leaves your local machine.
          </p>
        </div>
      </div>
    </div>
  );
};
