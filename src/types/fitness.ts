/**
 * PulseFit Fitness Tracking & Telemetry Types
 * Compliant with privacy, medical disclaimers, and Web Bluetooth GATT standards.
 */

export type HRZone = 'zone1' | 'zone2' | 'zone3' | 'zone4' | 'zone5';

export interface HRZoneInfo {
  zone: HRZone;
  name: string;
  minHr: number;
  maxHr: number;
  percentageRange: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  benefit: string;
}

export interface TelemetryPoint {
  timestamp: number; // relative second from start
  heartRate: number;
  zone: HRZone;
  caloriesBurnedEstimate: number;
  sensorContact?: boolean;
  rrIntervalMs?: number; // for HRV analysis
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  repsOrDuration: string;
  targetZone: HRZone;
  restSeconds: number;
  instructions: string;
  muscleGroups: string[];
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  goal: 'cardio' | 'hypertrophy' | 'fat_loss' | 'recovery';
  level: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  targetZones: HRZone[];
  exercises: ExerciseItem[];
  frequencyPerWeek: number;
  equipment: string[];
}

export interface CompletedWorkout {
  id: string;
  title: string;
  planId?: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  caloriesBurned: number;
  zoneDistribution: Record<HRZone, number>; // seconds spent in each zone
  telemetry: TelemetryPoint[];
  laps: number[]; // timestamp mark for laps/sets
  notes?: string;
}

export interface UserProfile {
  age: number;
  gender: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  weightKg: number;
  heightCm: number;
  restingHr: number;
  maxHrCustom?: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'cardio' | 'hypertrophy' | 'fat_loss' | 'recovery';
}

export interface ConsentRecord {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  biometricConsent: boolean; // Explicit GDPR Art. 9 consent for biometric heart rate
  isAgeVerified: boolean; // Over 16 or verified parental consent
  parentalConsent?: {
    guardianName: string;
    guardianEmail: string;
    consentTimestamp: string;
  };
  consentDate: string;
}

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean; // Opt-in
  preferences: boolean; // Opt-in
  hasInteracted: boolean;
}

export type BleStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'simulated';

export interface BleDeviceInfo {
  name: string;
  batteryLevel?: number;
  sensorContact: boolean;
  status: BleStatus;
  deviceType: 'physical' | 'simulated';
}
