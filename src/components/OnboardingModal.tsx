import React, { useState } from 'react';
import { ShieldCheck, Heart, User, Check, X, AlertCircle, Info } from 'lucide-react';
import { UserProfile, ConsentRecord } from '../types/fitness';
import { saveProfile, saveConsent } from '../utils/storage';
import { validateAgeConsent } from '../utils/fitnessMath';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  consent: ConsentRecord;
  onProfileUpdated: (profile: UserProfile) => void;
  onConsentUpdated: (consent: ConsentRecord) => void;
  onOpenPrivacyTab: () => void;
}

export const OnboardingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profile,
  consent,
  onProfileUpdated,
  onConsentUpdated,
  onOpenPrivacyTab,
}) => {
  const [age, setAge] = useState<number>(profile.age);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg);
  const [restingHr, setRestingHr] = useState<number>(profile.restingHr);
  const [goal, setGoal] = useState<UserProfile['goal']>(profile.goal);
  const [gender, setGender] = useState<UserProfile['gender']>(profile.gender);

  // Consents
  const [biometricConsent, setBiometricConsent] = useState(consent.biometricConsent);
  const [termsConsent, setTermsConsent] = useState(consent.termsAccepted);
  const [privacyConsent, setPrivacyConsent] = useState(consent.privacyAccepted);

  // Minor / Parental consent fields
  const [guardianName, setGuardianName] = useState(consent.parentalConsent?.guardianName || '');
  const [guardianEmail, setGuardianEmail] = useState(consent.parentalConsent?.guardianEmail || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate consents
    if (!biometricConsent) {
      setErrorMsg('Explicit consent for client-side biometric processing is required to calculate heart rate zones.');
      return;
    }
    if (!termsConsent || !privacyConsent) {
      setErrorMsg('Please review and accept our Terms of Service and Privacy Policy to proceed.');
      return;
    }

    // Validate age & parental consent
    const ageVal = validateAgeConsent(age, { guardianName, guardianEmail });
    if (!ageVal.isValid) {
      setErrorMsg(ageVal.error || 'Invalid age or parental consent.');
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile,
      age: Math.round(age),
      weightKg: Math.round(weightKg),
      restingHr: Math.round(restingHr),
      goal,
      gender,
    };

    const updatedConsent: ConsentRecord = {
      termsAccepted: termsConsent,
      privacyAccepted: privacyConsent,
      biometricConsent: biometricConsent,
      isAgeVerified: true,
      parentalConsent:
        age < 16
          ? {
              guardianName,
              guardianEmail,
              consentTimestamp: new Date().toISOString(),
            }
          : undefined,
      consentDate: new Date().toISOString(),
    };

    saveProfile(updatedProfile);
    saveConsent(updatedConsent);
    onProfileUpdated(updatedProfile);
    onConsentUpdated(updatedConsent);
    onClose();
  };

  const isMinor = age < 16;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="onboarding-modal-title" className="text-base font-semibold tracking-tight text-white">
                Personalized Profile &amp; Biometric Consent
              </h2>
              <p className="text-xs text-slate-400">Data minimization: only minimal physiological parameters collected</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close setup modal"
            className="p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Data Minimization Assurance Box */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5 text-slate-300">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-white">Data Minimization Pledge:</strong> We do not ask for your real name, phone number, address, or location. These metrics stay strictly in your browser to calculate Karvonen heart rate zones.
            </p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="user-age" className="block text-slate-300 font-semibold mb-1">
                Age (Years):
              </label>
              <input
                id="user-age"
                type="number"
                min="6"
                max="105"
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white"
              />
              <span className="text-[10px] text-slate-400">Used for Tanaka formula (208 - 0.7×age)</span>
            </div>

            <div>
              <label htmlFor="user-weight" className="block text-slate-300 font-semibold mb-1">
                Body Weight (kg):
              </label>
              <input
                id="user-weight"
                type="number"
                min="20"
                max="300"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white"
              />
              <span className="text-[10px] text-slate-400">Used for caloric burn equation</span>
            </div>

            <div>
              <label htmlFor="user-resting-hr" className="block text-slate-300 font-semibold mb-1">
                Resting Heart Rate (BPM):
              </label>
              <input
                id="user-resting-hr"
                type="number"
                min="35"
                max="120"
                required
                value={restingHr}
                onChange={(e) => setRestingHr(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white"
              />
              <span className="text-[10px] text-slate-400">Waking or relaxed baseline HR</span>
            </div>

            <div>
              <label htmlFor="user-goal" className="block text-slate-300 font-semibold mb-1">
                Primary Fitness Goal:
              </label>
              <select
                id="user-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white"
              >
                <option value="cardio">Cardiovascular Endurance</option>
                <option value="hypertrophy">Functional Hypertrophy</option>
                <option value="fat_loss">Metabolic &amp; Fat Oxidation</option>
                <option value="recovery">Active Recovery &amp; Mobility</option>
              </select>
            </div>
          </div>

          {/* Parental Consent Block for minors */}
          {isMinor && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Statutory Parental Consent (COPPA &amp; GDPR Art. 8)</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Users under 16 must provide verifiable parental or legal guardian consent before storing biometric telemetry:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="minor-guardian-name" className="block text-slate-300 text-[11px] mb-0.5">
                    Parent/Guardian Full Name:
                  </label>
                  <input
                    id="minor-guardian-name"
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="minor-guardian-email" className="block text-slate-300 text-[11px] mb-0.5">
                    Guardian Email Address:
                  </label>
                  <input
                    id="minor-guardian-email"
                    type="email"
                    required
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="guardian@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Explicit Form Consents */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <input
                id="modal-consent-bio"
                type="checkbox"
                required
                checked={biometricConsent}
                onChange={(e) => setBiometricConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-emerald-500 rounded-sm cursor-pointer"
              />
              <label htmlFor="modal-consent-bio" className="text-slate-300 text-[11px] cursor-pointer">
                <strong className="text-white">GDPR Art. 9 Biometric Consent:</strong> I explicitly consent to the local client-side processing of my heart rate and wearable telemetry for real-time fitness metrics.
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="modal-consent-terms"
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-emerald-500 rounded-sm cursor-pointer"
              />
              <label htmlFor="modal-consent-terms" className="text-slate-300 text-[11px] cursor-pointer">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivacyTab();
                  }}
                  className="text-emerald-400 underline font-medium hover:text-emerald-300"
                >
                  Terms of Service &amp; Health Disclaimer
                </button>{' '}
                and acknowledge PulseFit is not a medical device.
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="modal-consent-privacy"
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-emerald-500 rounded-sm cursor-pointer"
              />
              <label htmlFor="modal-consent-privacy" className="text-slate-300 text-[11px] cursor-pointer">
                I have reviewed the{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivacyTab();
                  }}
                  className="text-emerald-400 underline font-medium hover:text-emerald-300"
                >
                  Privacy Policy
                </button>{' '}
                and agree to local-only data retention.
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm"
            >
              Save Profile &amp; Consents
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
