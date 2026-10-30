/**
 * PulseFit - Privacy-First Real-Time Fitness Tracker & Analytics
 * Web Bluetooth GATT integration, personalized workout plans, and strict data governance.
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { RealtimeTracker } from './components/RealtimeTracker';
import { PlanBuilder } from './components/PlanBuilder';
import { AnalyticsHistory } from './components/AnalyticsHistory';
import { LegalAndPrivacyCenter } from './components/LegalAndPrivacyCenter';
import { WearableModal } from './components/WearableModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { Footer } from './components/Footer';
import { SkipLink } from './components/SkipLink';

import {
  UserProfile,
  ConsentRecord,
  CookiePreferences,
  CompletedWorkout,
  BleDeviceInfo,
  WorkoutPlan,
} from './types/fitness';
import {
  loadProfile,
  loadConsent,
  loadCookiePreferences,
  loadWorkoutHistory,
  saveProfile,
  saveConsent,
  saveCookiePreferences,
} from './utils/storage';
import { bleHeartRate } from './services/bleHeartRate';
import { soundManager } from './utils/audioCues';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  testFirestoreConnection,
  syncUserProfileToFirestore,
  saveWorkoutToFirestore,
  subscribeToUserWorkouts,
} from './services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');

  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core Data models
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [consent, setConsent] = useState<ConsentRecord>(() => loadConsent());
  const [cookies, setCookies] = useState<CookiePreferences>(() => loadCookiePreferences());
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>(() => loadWorkoutHistory());

  // Real-time Wearable / Telemetry State
  const [bleInfo, setBleInfo] = useState<BleDeviceInfo>(() => bleHeartRate.getDeviceInfo());
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(72);
  const [rrIntervalMs, setRrIntervalMs] = useState<number | undefined>(820);
  const [sensorContact, setSensorContact] = useState<boolean>(true);

  // Active workout plan
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);

  // Audio mute state
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundManager.getIsMuted());

  // Modal Dialogs
  const [showBleModal, setShowBleModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Wire Web Bluetooth & Simulator callbacks
  useEffect(() => {
    bleHeartRate.setCallbacks(
      (data) => {
        setCurrentHeartRate(data.heartRate);
        setSensorContact(data.sensorContact);
        if (data.rrIntervalMs !== undefined) {
          setRrIntervalMs(data.rrIntervalMs);
        }
      },
      (info) => {
        setBleInfo(info);
      }
    );

    // Ultra Mode support: Check ?autostart=1 in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        // Automatically start simulation for test automation
        bleHeartRate.startSimulation('moderate');
      }
    }

    return () => {
      bleHeartRate.disconnect();
    };
  }, []);

  // Keyboard shortcut listener for '?'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Test Firestore connection on boot and monitor Firebase Auth state
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        showToast(`Signed in as ${user.displayName || user.email}`);
        syncUserProfileToFirestore(user.uid, profile, user).catch(() => {});
      }
    });

    return () => unsubscribeAuth();
  }, [profile]);

  // Sync workouts from Firestore when user is authenticated
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribeWorkouts = subscribeToUserWorkouts(currentUser.uid, (remoteWorkouts) => {
      if (remoteWorkouts.length > 0) {
        setWorkouts((local) => {
          // Merge remote and local workouts by ID
          const map = new Map<string, CompletedWorkout>();
          local.forEach((w) => map.set(w.id, w));
          remoteWorkouts.forEach((w) => map.set(w.id, w));
          return Array.from(map.values()).sort((a, b) => b.startTime - a.startTime);
        });
      }
    });
    return () => unsubscribeWorkouts();
  }, [currentUser]);

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      showToast(`Welcome, ${user.displayName || 'Athlete'}!`);
      await syncUserProfileToFirestore(user.uid, profile, user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.warn('Firebase sign-in error:', err);
        showToast('Google Sign-In was cancelled or encountered an error.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      showToast('Signed out of Firebase account.');
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
  };

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsSoundMuted(muted);
    showToast(muted ? 'Workout audio alerts muted' : 'Workout audio alerts enabled');
  };

  const handleSelectPlanForWorkout = (plan: WorkoutPlan) => {
    setActivePlan(plan);
    setActiveTab('tracker');
    showToast(`Loaded "${plan.title}" into Real-Time Tracker`);
  };

  const handleWorkoutSaved = (workout: CompletedWorkout) => {
    const updated = loadWorkoutHistory();
    setWorkouts(updated);
    if (currentUser) {
      saveWorkoutToFirestore(currentUser.uid, workout).catch((err) => {
        console.warn('Failed to sync workout to Firestore:', err);
      });
    }
    showToast(`Workout saved: ${workout.caloriesBurned} kcal burned`);
  };

  const handleDataPurged = () => {
    setProfile(loadProfile());
    setConsent(loadConsent());
    setCookies(loadCookiePreferences());
    setWorkouts([]);
    setActivePlan(null);
    bleHeartRate.disconnect();
    setCurrentHeartRate(72);
    showToast('All local personal data permanently erased.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Accessibility Skip Link */}
      <SkipLink />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        bleInfo={bleInfo}
        isWorkoutActive={false}
        isSoundMuted={isSoundMuted}
        onToggleSound={handleToggleSound}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenBleModal={() => setShowBleModal(true)}
        user={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Content Viewport */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus-visible:outline-hidden">
        {/* Consent & Data Minimization Reminder Banner (if not yet accepted) */}
        {!consent.termsAccepted && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
            <div>
              <p className="font-semibold text-white">
                Welcome to PulseFit: Privacy-by-Design Fitness Telemetry
              </p>
              <p className="text-slate-300 mt-0.5">
                We only collect minimal physiological parameters to calculate your personalized Karvonen zones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnboardingModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md shadow-xs transition-colors"
              >
                Set Up Profile &amp; Consents
              </button>
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'tracker' && (
          <RealtimeTracker
            profile={profile}
            currentHeartRate={currentHeartRate}
            rrIntervalMs={rrIntervalMs}
            sensorContact={sensorContact}
            activePlan={activePlan}
            onOpenBleModal={() => setShowBleModal(true)}
            onWorkoutSaved={handleWorkoutSaved}
            isSimulated={bleInfo.status === 'simulated'}
            onSwitchToPlans={() => setActiveTab('plans')}
          />
        )}

        {activeTab === 'plans' && (
          <PlanBuilder
            profile={profile}
            onSelectPlanForWorkout={handleSelectPlanForWorkout}
            activePlanId={activePlan?.id}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsHistory
            workouts={workouts}
            onWorkoutsUpdated={setWorkouts}
          />
        )}

        {activeTab === 'legal' && (
          <LegalAndPrivacyCenter
            consent={consent}
            profile={profile}
            cookies={cookies}
            workouts={workouts}
            onConsentUpdated={setConsent}
            onProfileUpdated={setProfile}
            onDataPurged={handleDataPurged}
          />
        )}
      </main>

      {/* Accessible Footer */}
      <Footer
        onNavigateToTab={setActiveTab}
        onOpenPrivacySection={() => setActiveTab('legal')}
        onOpenCookies={() => {
          setCookies((prev) => ({ ...prev, hasInteracted: false }));
        }}
        onOpenProfile={() => setShowOnboardingModal(true)}
      />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner
        preferences={cookies}
        onUpdatePreferences={setCookies}
        onOpenCookiePolicy={() => setActiveTab('legal')}
      />

      {/* Modal Dialogs */}
      <WearableModal
        isOpen={showBleModal}
        onClose={() => setShowBleModal(false)}
        bleInfo={bleInfo}
        onStatusChange={setBleInfo}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        profile={profile}
        consent={consent}
        onProfileUpdated={setProfile}
        onConsentUpdated={setConsent}
        onOpenPrivacyTab={() => setActiveTab('legal')}
      />
    </div>
  );
}
