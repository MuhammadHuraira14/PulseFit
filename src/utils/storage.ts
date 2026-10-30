import { UserProfile, CompletedWorkout, ConsentRecord, CookiePreferences } from '../types/fitness';

const STORAGE_KEYS = {
  PROFILE: 'pulse_user_profile',
  CONSENT: 'pulse_consent_record',
  COOKIES: 'pulse_cookie_prefs',
  WORKOUTS: 'pulse_workout_history',
  CUSTOM_PLANS: 'pulse_custom_plans',
};

export const DEFAULT_PROFILE: UserProfile = {
  age: 28,
  gender: 'prefer_not_to_say',
  weightKg: 72,
  heightCm: 175,
  restingHr: 62,
  fitnessLevel: 'intermediate',
  goal: 'cardio',
};

export const DEFAULT_CONSENT: ConsentRecord = {
  termsAccepted: false,
  privacyAccepted: false,
  biometricConsent: false,
  isAgeVerified: false,
  consentDate: '',
};

export const DEFAULT_COOKIES: CookiePreferences = {
  essential: true,
  analytics: false,
  preferences: true,
  hasInteracted: false,
};

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadConsent(): ConsentRecord {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSENT);
    if (!raw) return DEFAULT_CONSENT;
    return { ...DEFAULT_CONSENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function saveConsent(consent: ConsentRecord): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CONSENT, JSON.stringify(consent));
}

export function loadCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_COOKIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COOKIES);
    if (!raw) return DEFAULT_COOKIES;
    return { ...DEFAULT_COOKIES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COOKIES;
  }
}

export function saveCookiePreferences(prefs: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COOKIES, JSON.stringify(prefs));
}

export function loadWorkoutHistory(): CompletedWorkout[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) return getInitialDemoWorkouts();
    return JSON.parse(raw);
  } catch {
    return getInitialDemoWorkouts();
  }
}

export function saveWorkout(workout: CompletedWorkout): CompletedWorkout[] {
  const current = loadWorkoutHistory();
  const updated = [workout, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updated));
  }
  return updated;
}

export function deleteWorkout(workoutId: string): CompletedWorkout[] {
  const current = loadWorkoutHistory();
  const updated = current.filter((w) => w.id !== workoutId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updated));
  }
  return updated;
}

/**
 * GDPR Article 20: Data Portability. Exports all personal user data as JSON.
export interface ExportOptions {
  customProfile?: UserProfile;
  customWorkouts?: CompletedWorkout[];
  includeRawTelemetry?: boolean;
  pretty?: boolean;
}

/**
 * GDPR Article 20: Right to Data Portability.
 * Exports full user profile, consents, preferences, and workout logs as a structured, machine-readable JSON document.
 */
export function exportUserDataJson(options?: ExportOptions): string {
  const profile = options?.customProfile || loadProfile();
  const consents = loadConsent();
  const cookies = loadCookiePreferences();
  const rawWorkouts = options?.customWorkouts || loadWorkoutHistory();

  const formattedWorkouts = rawWorkouts.map((w) => ({
    id: w.id,
    title: w.title,
    planId: w.planId || null,
    startTimeIso: new Date(w.startTime).toISOString(),
    endTimeIso: new Date(w.endTime).toISOString(),
    durationSeconds: w.durationSeconds,
    durationFormatted: `${Math.floor(w.durationSeconds / 60)}m ${w.durationSeconds % 60}s`,
    avgHeartRateBpm: w.avgHeartRate,
    maxHeartRateBpm: w.maxHeartRate,
    minHeartRateBpm: w.minHeartRate,
    caloriesBurnedKcal: w.caloriesBurned,
    zoneDistributionSeconds: w.zoneDistribution,
    lapsCount: w.laps?.length || 0,
    lapsTimestamps: w.laps || [],
    notes: w.notes || '',
    telemetrySamplesCount: w.telemetry?.length || 0,
    ...(options?.includeRawTelemetry ? { telemetry: w.telemetry || [] } : {}),
  }));

  const data = {
    $schema: 'https://pulsefit.app/schemas/v2/user-data-portability.json',
    exportMetadata: {
      application: 'PulseFit - Real-Time Fitness Tracker',
      version: '2.1.0',
      exportTimestamp: new Date().toISOString(),
      statutoryCompliance: [
        'GDPR Article 20: Right to Data Portability',
        'CCPA Section 1798.100: Consumer Right to Access and Data Portability',
        'Health Data Sovereignty & Portability Protocol',
      ],
      mediaType: 'application/json',
      encoding: 'UTF-8',
      dataSubjectReference: `pulsefit-user-${Date.now().toString(36)}`,
    },
    profile: {
      age: profile.age,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      restingHrBpm: profile.restingHr,
      customMaxHr: profile.maxHrCustom || null,
      fitnessLevel: profile.fitnessLevel,
      goal: profile.goal,
      gender: profile.gender,
    },
    regulatoryConsents: {
      biometricProcessingConsent: consents.biometricConsent,
      termsAccepted: consents.termsAccepted,
      privacyAccepted: consents.privacyAccepted,
      ageVerified: consents.isAgeVerified,
      parentalConsent: consents.parentalConsent || null,
      consentRecordedDate: consents.consentDate,
    },
    privacyPreferences: {
      essentialStorage: cookies.essential,
      analyticsConsent: cookies.analytics,
      preferenceStorage: cookies.preferences,
    },
    workoutHistory: {
      totalWorkoutsCount: formattedWorkouts.length,
      totalActiveTimeSeconds: formattedWorkouts.reduce((acc, curr) => acc + curr.durationSeconds, 0),
      totalCaloriesBurnedKcal: formattedWorkouts.reduce((acc, curr) => acc + curr.caloriesBurnedKcal, 0),
      sessions: formattedWorkouts,
    },
  };

  return JSON.stringify(data, null, options?.pretty === false ? 0 : 2);
}

/**
 * Exports workout history as standard CSV.
 */
export function exportWorkoutsCsv(): string {
  const workouts = loadWorkoutHistory();
  const headers = ['Workout ID', 'Title', 'Date', 'Duration (min)', 'Avg HR (BPM)', 'Max HR (BPM)', 'Calories (kcal)'];
  const rows = workouts.map((w) => [
    w.id,
    `"${w.title.replace(/"/g, '""')}"`,
    new Date(w.startTime).toLocaleDateString(),
    Math.round((w.durationSeconds / 60) * 10) / 10,
    w.avgHeartRate,
    w.maxHeartRate,
    w.caloriesBurned,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * GDPR Article 17: Right to Erasure / Data Deletion.
 * Completely purges all stored personal telemetry, profiles, logs, and reset tokens.
 */
export function purgeAllUserData(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  localStorage.removeItem('pulse_sound_muted');
}

function getInitialDemoWorkouts(): CompletedWorkout[] {
  const now = Date.now();
  const oneDay = 86400000;

  return [
    {
      id: 'demo-workout-1',
      title: 'Morning Aerobic Zone 2 Endurance',
      startTime: now - oneDay * 1.5,
      endTime: now - oneDay * 1.5 + 1800000,
      durationSeconds: 1800,
      avgHeartRate: 138,
      maxHeartRate: 154,
      minHeartRate: 72,
      caloriesBurned: 312,
      zoneDistribution: {
        zone1: 240,
        zone2: 1260,
        zone3: 300,
        zone4: 0,
        zone5: 0,
      },
      telemetry: [],
      laps: [600, 1200],
      notes: 'Maintained smooth nasal breathing throughout steady Zone 2 effort.',
    },
    {
      id: 'demo-workout-2',
      title: 'Cardiovascular Threshold & Interval Surge',
      startTime: now - oneDay * 3,
      endTime: now - oneDay * 3 + 1680000,
      durationSeconds: 1680,
      avgHeartRate: 156,
      maxHeartRate: 178,
      minHeartRate: 78,
      caloriesBurned: 384,
      zoneDistribution: {
        zone1: 180,
        zone2: 360,
        zone3: 420,
        zone4: 480,
        zone5: 240,
      },
      telemetry: [],
      laps: [420, 840, 1260],
      notes: 'Peak output reached during burpee bursts. Heart rate recovery was within 1 minute.',
    },
  ];
}
