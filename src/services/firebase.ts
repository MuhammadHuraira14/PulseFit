/**
 * Firebase Client SDK Initialization & Services
 * Uses Google Sign-In via Firebase Auth and Firestore for persistent telemetry storage.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, CompletedWorkout } from '../types/fitness';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot per Firebase skill requirements
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check: please check configuration or network connection.');
    }
  }
}

// Google Sign-In
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Sign Out
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Sync user profile to Firestore
export async function syncUserProfileToFirestore(userId: string, profile: UserProfile, user?: User | null) {
  if (!userId) return;
  const userDocRef = doc(db, 'users', userId);
  const data = {
    userId,
    email: user?.email || '',
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    age: profile.age,
    weightKg: profile.weightKg,
    restingHr: profile.restingHr,
    maxHrCustom: profile.maxHrCustom || null,
    fitnessLevel: profile.fitnessLevel,
    goal: profile.goal,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(userDocRef, data, { merge: true });
}

// Sync workout to Firestore
export async function saveWorkoutToFirestore(userId: string, workout: CompletedWorkout) {
  if (!userId) return;
  const workoutDocRef = doc(db, 'users', userId, 'workouts', workout.id);
  const data = {
    id: workout.id,
    userId,
    title: workout.title,
    planId: workout.planId || '',
    startTime: workout.startTime,
    endTime: workout.endTime,
    durationSeconds: workout.durationSeconds,
    avgHeartRate: workout.avgHeartRate,
    maxHeartRate: workout.maxHeartRate,
    minHeartRate: workout.minHeartRate,
    caloriesBurned: workout.caloriesBurned,
    notes: workout.notes || '',
    createdAt: new Date().toISOString(),
  };
  await setDoc(workoutDocRef, data, { merge: true });
}

// Delete workout from Firestore
export async function deleteWorkoutFromFirestore(userId: string, workoutId: string) {
  if (!userId || !workoutId) return;
  const workoutDocRef = doc(db, 'users', userId, 'workouts', workoutId);
  await deleteDoc(workoutDocRef);
}

// Subscribe to workouts in Firestore
export function subscribeToUserWorkouts(userId: string, onUpdate: (workouts: CompletedWorkout[]) => void) {
  if (!userId) return () => {};
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, orderBy('startTime', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CompletedWorkout[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id || d.id,
          title: data.title || 'Workout Session',
          planId: data.planId,
          startTime: data.startTime || Date.now(),
          endTime: data.endTime || Date.now(),
          durationSeconds: data.durationSeconds || 0,
          avgHeartRate: data.avgHeartRate || 0,
          maxHeartRate: data.maxHeartRate || 0,
          minHeartRate: data.minHeartRate || 0,
          caloriesBurned: data.caloriesBurned || 0,
          zoneDistribution: {
            zone1: 0,
            zone2: 0,
            zone3: 0,
            zone4: 0,
            zone5: 0,
          },
          telemetry: [],
          laps: [],
          notes: data.notes || '',
        });
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore workouts subscription error:', err);
    }
  );
}
