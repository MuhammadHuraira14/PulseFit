/**
 * Scientifically grounded fitness, heart rate zones, and caloric calculation utilities.
 * Derived from ACSM (American College of Sports Medicine) and Tanaka et al. formulas.
 */

import { HRZone, HRZoneInfo, UserProfile } from '../types/fitness';

/**
 * Calculates Maximum Heart Rate using the Tanaka formula: 208 - (0.7 * age)
 * Proven more accurate than the traditional Fox (220 - age) formula across adult populations.
 */
export function calculateMaxHeartRate(age: number): number {
  const safeAge = Math.max(10, Math.min(100, Math.round(age)));
  return Math.round(208 - 0.7 * safeAge);
}

/**
 * Calculates Target Heart Rate Zones using the Karvonen Heart Rate Reserve (HRR) formula:
 * Target HR = ((HRmax - HRrest) * %intensity) + HRrest
 */
export function calculateHRZones(restingHr: number, maxHr: number): Record<HRZone, HRZoneInfo> {
  const safeResting = Math.max(35, Math.min(110, Math.round(restingHr)));
  const safeMax = Math.max(safeResting + 20, Math.min(225, Math.round(maxHr)));
  const hrr = safeMax - safeResting;

  const z1Min = Math.round(safeResting + hrr * 0.50);
  const z1Max = Math.round(safeResting + hrr * 0.60);

  const z2Min = z1Max;
  const z2Max = Math.round(safeResting + hrr * 0.70);

  const z3Min = z2Max;
  const z3Max = Math.round(safeResting + hrr * 0.80);

  const z4Min = z3Max;
  const z4Max = Math.round(safeResting + hrr * 0.90);

  const z5Min = z4Max;
  const z5Max = safeMax;

  return {
    zone1: {
      zone: 'zone1',
      name: 'Zone 1: Active Recovery',
      minHr: z1Min,
      maxHr: z1Max,
      percentageRange: '50% - 60% HRR',
      color: '#3b82f6', // blue-500
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/30',
      description: 'Gentle effort, stimulates recovery and blood circulation.',
      benefit: 'Post-workout cooldown, active rest, mobility',
    },
    zone2: {
      zone: 'zone2',
      name: 'Zone 2: Aerobic Base',
      minHr: z2Min,
      maxHr: z2Max,
      percentageRange: '60% - 70% HRR',
      color: '#10b981', // emerald-500
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/30',
      description: 'Conversational pace, optimizes fat oxidation and mitochondrial density.',
      benefit: 'Metabolic health, endurance base, all-day stamina',
    },
    zone3: {
      zone: 'zone3',
      name: 'Zone 3: Aerobic Cardio',
      minHr: z3Min,
      maxHr: z3Max,
      percentageRange: '70% - 80% HRR',
      color: '#eab308', // yellow-500
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/30',
      description: 'Moderate-hard effort, strengthens cardiovascular pump efficiency.',
      benefit: 'Lactate clearance, sustained tempo pacing',
    },
    zone4: {
      zone: 'zone4',
      name: 'Zone 4: Threshold / Anaerobic',
      minHr: z4Min,
      maxHr: z4Max,
      percentageRange: '80% - 90% HRR',
      color: '#f97316', // orange-500
      textColor: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-500/30',
      description: 'Hard effort, pushing above lactate threshold. Breathing is heavy.',
      benefit: 'Speed endurance, peak VO2 max stimulation',
    },
    zone5: {
      zone: 'zone5',
      name: 'Zone 5: Maximum Effort / Peak',
      minHr: z5Min,
      maxHr: z5Max,
      percentageRange: '90% - 100% HRR',
      color: '#ef4444', // red-500
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/15',
      borderColor: 'border-rose-500/30',
      description: 'All-out sprint effort. Sustainable only for brief intervals.',
      benefit: 'Neuromuscular power, anaerobic capacity',
    },
  };
}

/**
 * Determines current heart rate zone based on current BPM.
 */
export function getCurrentZone(currentHr: number, restingHr: number, maxHr: number): HRZoneInfo {
  const zones = calculateHRZones(restingHr, maxHr);
  if (currentHr < zones.zone1.minHr) {
    return {
      ...zones.zone1,
      name: 'Warm Up / Below Zone 1',
      description: 'Resting or light warm up state.',
    };
  }
  if (currentHr <= zones.zone1.maxHr) return zones.zone1;
  if (currentHr <= zones.zone2.maxHr) return zones.zone2;
  if (currentHr <= zones.zone3.maxHr) return zones.zone3;
  if (currentHr <= zones.zone4.maxHr) return zones.zone4;
  return zones.zone5;
}

/**
 * Calculates Caloric Expenditure using peer-reviewed Keytel et al. equation:
 * Men: [(-55.0969 + (0.6309 x HR) + (0.1988 x W) + (0.2017 x A)) / 4.184] x 60 x T
 * Women: [(-20.4022 + (0.4472 x HR) - (0.1263 x W) + (0.074 x A)) / 4.184] x 60 x T
 * T is time in hours.
 */
export function calculateCalories(
  heartRate: number,
  weightKg: number,
  age: number,
  durationSeconds: number,
  gender: UserProfile['gender'] = 'prefer_not_to_say'
): number {
  if (durationSeconds <= 0 || heartRate <= 40) return 0;
  const tHours = durationSeconds / 3600;

  let caloriesBurned = 0;
  if (gender === 'male') {
    const ratePerMin = ((-55.0969 + (0.6309 * heartRate) + (0.1988 * weightKg) + (0.2017 * age)) / 4.184);
    caloriesBurned = Math.max(0, ratePerMin * 60 * tHours);
  } else if (gender === 'female') {
    const ratePerMin = ((-20.4022 + (0.4472 * heartRate) - (0.1263 * weightKg) + (0.074 * age)) / 4.184);
    caloriesBurned = Math.max(0, ratePerMin * 60 * tHours);
  } else {
    // Blended gender-neutral calculation
    const maleRate = (-55.0969 + (0.6309 * heartRate) + (0.1988 * weightKg) + (0.2017 * age)) / 4.184;
    const femaleRate = (-20.4022 + (0.4472 * heartRate) - (0.1263 * weightKg) + (0.074 * age)) / 4.184;
    const avgRate = (maleRate + femaleRate) / 2;
    caloriesBurned = Math.max(0, avgRate * 60 * tHours);
  }

  return Math.round(caloriesBurned * 10) / 10;
}

/**
 * Formats duration in seconds to standard HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * Validates age consent against GDPR (Article 8) and COPPA requirements.
 * Under 16 requires verifiable parental consent in EU; under 13 strictly prohibited without full parental authorization.
 */
export function validateAgeConsent(
  age: number,
  guardianData?: { guardianName?: string; guardianEmail?: string }
): { isValid: boolean; requiresParentalConsent: boolean; error?: string } {
  if (isNaN(age) || age < 5 || age > 110) {
    return { isValid: false, requiresParentalConsent: false, error: 'Please enter a valid age between 5 and 110.' };
  }

  if (age >= 16) {
    return { isValid: true, requiresParentalConsent: false };
  }

  // Age between 5 and 15 requires guardian consent
  if (!guardianData?.guardianName?.trim() || !guardianData?.guardianEmail?.includes('@')) {
    return {
      isValid: false,
      requiresParentalConsent: true,
      error: 'Users under 16 require explicit parental/guardian consent with a valid guardian name and email address.',
    };
  }

  return { isValid: true, requiresParentalConsent: true };
}
