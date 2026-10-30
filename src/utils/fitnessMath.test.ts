import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMaxHeartRate,
  calculateHRZones,
  getCurrentZone,
  calculateCalories,
  formatDuration,
  validateAgeConsent,
} from './fitnessMath';

test('calculateMaxHeartRate Tanaka formula calculations', () => {
  // Tanaka: 208 - (0.7 * age)
  // For age 20: 208 - 14 = 194
  assert.equal(calculateMaxHeartRate(20), 194);
  // For age 40: 208 - 28 = 180
  assert.equal(calculateMaxHeartRate(40), 180);
  // For age 60: 208 - 42 = 166
  assert.equal(calculateMaxHeartRate(60), 166);
});

test('calculateHRZones calculates correct Karvonen boundaries', () => {
  const restingHr = 60;
  const maxHr = 180;
  const zones = calculateHRZones(restingHr, maxHr);

  // HRR = 180 - 60 = 120
  // Zone 1: 60 + 120 * 0.50 = 120, 60 + 120 * 0.60 = 132
  assert.equal(zones.zone1.minHr, 120);
  assert.equal(zones.zone1.maxHr, 132);

  // Zone 2: 132 to 60 + 120 * 0.70 = 144
  assert.equal(zones.zone2.maxHr, 144);

  // Zone 5: maxHr = 180
  assert.equal(zones.zone5.maxHr, 180);
});

test('getCurrentZone correctly assigns zone based on current BPM', () => {
  const restingHr = 60;
  const maxHr = 180;

  // Below zone 1
  const warmUp = getCurrentZone(90, restingHr, maxHr);
  assert.equal(warmUp.name, 'Warm Up / Below Zone 1');

  // Inside zone 2 (132 - 144)
  const z2 = getCurrentZone(138, restingHr, maxHr);
  assert.equal(z2.zone, 'zone2');

  // Peak zone 5 (170)
  const z5 = getCurrentZone(175, restingHr, maxHr);
  assert.equal(z5.zone, 'zone5');
});

test('calculateCalories computes non-zero realistic burns', () => {
  // 30 min (1800 sec), avg HR 140, 70kg, 30yo
  const maleCalories = calculateCalories(140, 70, 30, 1800, 'male');
  assert.ok(maleCalories > 200 && maleCalories < 500, `Calories should be realistic, got: ${maleCalories}`);

  // Zero duration yields 0
  const zeroBurn = calculateCalories(140, 70, 30, 0, 'male');
  assert.equal(zeroBurn, 0);
});

test('formatDuration outputs MM:SS and HH:MM:SS accurately', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(3661), '01:01:01');
});

test('validateAgeConsent enforces GDPR Art 8 and COPPA rules', () => {
  // Adult (16+) requires no guardian consent
  const adult = validateAgeConsent(25);
  assert.equal(adult.isValid, true);
  assert.equal(adult.requiresParentalConsent, false);

  // Teenager (14) without guardian data should fail
  const minorWithoutGuardian = validateAgeConsent(14);
  assert.equal(minorWithoutGuardian.isValid, false);
  assert.equal(minorWithoutGuardian.requiresParentalConsent, true);

  // Teenager (14) with valid guardian data passes
  const minorWithGuardian = validateAgeConsent(14, {
    guardianName: 'Jane Doe',
    guardianEmail: 'jane.doe@example.com',
  });
  assert.equal(minorWithGuardian.isValid, true);
  assert.equal(minorWithGuardian.requiresParentalConsent, true);
});

test('exportUserDataJson generates valid machine-readable JSON', async () => {
  const { exportUserDataJson } = await import('./storage');
  const jsonStr = exportUserDataJson({
    customProfile: {
      age: 30,
      gender: 'male',
      weightKg: 75,
      heightCm: 180,
      restingHr: 58,
      fitnessLevel: 'intermediate',
      goal: 'cardio',
    },
    customWorkouts: [
      {
        id: 'test-w1',
        title: 'Tempo Run',
        startTime: 1700000000000,
        endTime: 1700001800000,
        durationSeconds: 1800,
        avgHeartRate: 145,
        maxHeartRate: 168,
        minHeartRate: 65,
        caloriesBurned: 350,
        zoneDistribution: { zone1: 100, zone2: 500, zone3: 1000, zone4: 200, zone5: 0 },
        telemetry: [],
        laps: [],
      },
    ],
  });

  const parsed = JSON.parse(jsonStr);
  assert.ok(parsed.exportMetadata, 'Must have exportMetadata');
  assert.equal(parsed.exportMetadata.mediaType, 'application/json');
  assert.equal(parsed.profile.age, 30);
  assert.equal(parsed.workoutHistory.totalWorkoutsCount, 1);
  assert.equal(parsed.workoutHistory.sessions[0].id, 'test-w1');
});
