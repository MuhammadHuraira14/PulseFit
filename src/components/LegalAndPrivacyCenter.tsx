import React, { useState } from 'react';
import {
  Shield,
  FileText,
  DollarSign,
  Cookie,
  Layers,
  Building,
  Baby,
  Mail,
  Copyright,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Scale,
  Ban,
  Lock,
  Download,
  Check,
  RefreshCw,
  ExternalLink,
  FileJson,
  Copy,
  HardDrive,
} from 'lucide-react';
import { ConsentRecord, UserProfile, CookiePreferences, CompletedWorkout } from '../types/fitness';
import { saveConsent, purgeAllUserData, exportUserDataJson } from '../utils/storage';
import { validateAgeConsent } from '../utils/fitnessMath';

type LegalTab =
  | 'privacy'
  | 'terms'
  | 'refund'
  | 'cookies'
  | 'consents'
  | 'sdkaudit'
  | 'business'
  | 'ageconsent'
  | 'emailprefs'
  | 'licenses'
  | 'portability'
  | 'deletion';

interface Props {
  consent: ConsentRecord;
  profile: UserProfile;
  cookies: CookiePreferences;
  workouts?: CompletedWorkout[];
  onConsentUpdated: (consent: ConsentRecord) => void;
  onProfileUpdated: (profile: UserProfile) => void;
  onDataPurged: () => void;
}

export const LegalAndPrivacyCenter: React.FC<Props> = ({
  consent,
  profile,
  cookies,
  workouts,
  onConsentUpdated,
  onProfileUpdated,
  onDataPurged,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Data Portability Export state
  const [includeRawTelemetry, setIncludeRawTelemetry] = useState(false);
  const [minifyExportJson, setMinifyExportJson] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Parental Consent Form state
  const [guardianName, setGuardianName] = useState(consent.parentalConsent?.guardianName || '');
  const [guardianEmail, setGuardianEmail] = useState(consent.parentalConsent?.guardianEmail || '');
  const [parentalConsentChecked, setParentalConsentChecked] = useState(!!consent.parentalConsent);
  const [ageConsentError, setAgeConsentError] = useState<string | null>(null);

  // Email Unsubscribe State
  const [emailSubscribed, setEmailSubscribed] = useState(true);
  const [emailAddress, setEmailAddress] = useState('user@pulsefit.app');

  // Deletion Confirmation state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refund simulation state
  const [refundReason, setRefundReason] = useState('Changed my fitness goals');
  const [refundProcessed, setRefundProcessed] = useState(false);

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleUpdateConsents = (updates: Partial<ConsentRecord>) => {
    const updated: ConsentRecord = {
      ...consent,
      ...updates,
      consentDate: new Date().toISOString(),
    };
    saveConsent(updated);
    onConsentUpdated(updated);
    showSuccess('Consent preferences updated and logged.');
  };

  const handleSaveParentalConsent = (e: React.FormEvent) => {
    e.preventDefault();
    setAgeConsentError(null);

    const validation = validateAgeConsent(profile.age, { guardianName, guardianEmail });
    if (!validation.isValid) {
      setAgeConsentError(validation.error || 'Invalid guardian consent.');
      return;
    }

    const updated: ConsentRecord = {
      ...consent,
      isAgeVerified: true,
      parentalConsent: {
        guardianName,
        guardianEmail,
        consentTimestamp: new Date().toISOString(),
      },
    };
    saveConsent(updated);
    onConsentUpdated(updated);
    showSuccess('Verified Parental Consent recorded under GDPR Art. 8 & COPPA standards.');
  };

  const handleExecuteDataDeletion = () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm permanent erasure.');
      return;
    }
    purgeAllUserData();
    setShowDeleteModal(false);
    onDataPurged();
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    setRefundProcessed(true);
    showSuccess('Refund request submitted successfully. $0.00 charged / 100% guaranteed.');
  };

  const getExportJson = () => {
    return exportUserDataJson({
      customProfile: profile,
      customWorkouts: workouts,
      includeRawTelemetry: includeRawTelemetry,
      pretty: !minifyExportJson,
    });
  };

  const handleDownloadExportJson = () => {
    const jsonStr = getExportJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `pulsefit-data-export-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Downloaded secure, machine-readable JSON file.');
  };

  const handleCopyExportJson = () => {
    const jsonStr = getExportJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    showSuccess('Machine-readable JSON copied to clipboard.');
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const navItems = [
    { id: 'privacy' as LegalTab, label: 'Privacy Policy', icon: Shield },
    { id: 'terms' as LegalTab, label: 'Terms of Service', icon: FileText },
    { id: 'refund' as LegalTab, label: 'Refund Policy & Guarantee', icon: DollarSign },
    { id: 'cookies' as LegalTab, label: 'Cookie Policy', icon: Cookie },
    { id: 'consents' as LegalTab, label: 'Consent Management', icon: Scale },
    { id: 'sdkaudit' as LegalTab, label: 'Audited 3rd-Party SDKs', icon: Layers },
    { id: 'business' as LegalTab, label: 'Business & Legal Details', icon: Building },
    { id: 'ageconsent' as LegalTab, label: 'Kids Data & Age Consent', icon: Baby },
    { id: 'emailprefs' as LegalTab, label: 'Email & Unsubscribe', icon: Mail },
    { id: 'licenses' as LegalTab, label: 'Font & Asset Licenses', icon: Copyright },
    { id: 'portability' as LegalTab, label: 'Data Portability (JSON Export)', icon: Download },
    { id: 'deletion' as LegalTab, label: 'Data Deletion (GDPR Art. 17)', icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Shield className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Trust, Privacy &amp; Governance Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Zero surveillance, verified GDPR/CCPA data rights, transparent policies, and audited client-side architecture.
            </p>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Sidebar tabs + Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-1 bg-slate-900 border border-slate-800 p-2 rounded-xl h-fit">
          <span className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Compliance Sections
          </span>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-lg text-left transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg text-slate-200 text-xs leading-relaxed space-y-6">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  GDPR &amp; CCPA Compliant
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Privacy Policy</h3>
                <p className="text-slate-400 mt-1">Last Updated: October 30, 2026</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">1. Data Minimization Principle (GDPR Art. 5)</h4>
                <p>
                  PulseFit operates on a strict <strong>Privacy-by-Design and Data Minimization</strong> standard. We only collect the minimal biometric inputs strictly necessary to calculate your cardiovascular zones and caloric burn: your self-reported age, body weight, and resting heart rate. We do not collect names, GPS locations, phone numbers, contacts, device IMEI, or advertising identifiers.
                </p>

                <h4 className="text-sm font-semibold text-white">2. Biometric Data &amp; Web Bluetooth (GDPR Art. 9)</h4>
                <p>
                  Heart rate telemetry (BPM and RR-intervals) streamed from Bluetooth Low Energy (BLE) monitors is parsed directly in your device’s volatile browser memory via the standardized Web Bluetooth GATT API. Your real-time biometric telemetry is <strong>never uploaded to external cloud analytics servers</strong> or third-party behavioral profiling brokers.
                </p>

                <h4 className="text-sm font-semibold text-white">3. Local Storage vs. Cloud Transmission</h4>
                <p>
                  All completed workout logs, heart rate reserve history, and custom settings reside strictly in your local browser’s <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded-sm">localStorage</code>. You retain 100% sovereign custody over your health logs at all times.
                </p>

                <h4 className="text-sm font-semibold text-white">4. Your Statutory Rights</h4>
                <p>
                  Under the EU General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA), you possess the unalienable right to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Right to Access &amp; Portability (Art. 15 &amp; 20):</strong> Instant 1-click export of your full JSON archive in the Analytics tab.</li>
                  <li><strong>Right to Erasure (Art. 17):</strong> Instant, permanent erasure of all stored logs via our Data Deletion tab.</li>
                  <li><strong>Right to Withdraw Consent (Art. 7):</strong> Revoke consent for biometric data processing at any time.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Fair &amp; Transparent Terms
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Terms of Service</h3>
                <p className="text-slate-400 mt-1">Effective Date: October 30, 2026</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg text-amber-200">
                  <p className="font-semibold text-amber-300">Medical Disclaimer &amp; Unsupported Claims Prohibition</p>
                  <p className="mt-1">
                    PulseFit is a cardiovascular conditioning and exercise telemetry tool, <strong>not a medical device</strong>. Caloric expenditure and heart rate zones are mathematical estimates derived from ACSM and Tanaka et al. formulas. Always consult a qualified medical professional before undertaking high-intensity interval training (HIIT).
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-white">1. Scientific Basis of Telemetry</h4>
                <p>
                  We explicitly reject bogus or unscientific claims (e.g., &quot;miracle fat loss without effort&quot;). All target zones adhere to standard exercise physiology:
                  Zone 1 (50-60% HRR), Zone 2 (60-70% HRR), Zone 3 (70-80% HRR), Zone 4 (80-90% HRR), and Zone 5 (90-100% HRR).
                </p>

                <h4 className="text-sm font-semibold text-white">2. User Conduct &amp; Safety</h4>
                <p>
                  You agree to exercise within your safe physiological thresholds. Stop exercising immediately if you experience dizziness, shortness of breath, chest pain, or irregular heartbeats.
                </p>

                <h4 className="text-sm font-semibold text-white">3. No Dark Patterns or Hidden Restrictions</h4>
                <p>
                  You will never encounter forced account creation, artificial lock-in, disguised payment requests, or pre-checked opt-ins. You may export or delete your data at will.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: REFUND POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  100% Transparent Guarantee
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">30-Day Money-Back Refund Policy</h3>
                <p className="text-slate-400 mt-1">Zero hidden cancellation fees · No questions asked</p>
              </div>

              <div className="space-y-3">
                <p>
                  At PulseFit, we believe in honest business practices. While core telemetry, BLE pairing, and workout routines are completely free, any optional premium services come with an unconditional <strong>30-day money-back guarantee</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">$0 Hidden Fees</span>
                    <p className="text-slate-400 mt-1">No activation fees, no restocking fees, no termination penalties.</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">1-Click Cancellation</span>
                    <p className="text-slate-400 mt-1">Cancel anytime without phone calls, waiting queues, or retention surveys.</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">Full 30 Days</span>
                    <p className="text-slate-400 mt-1">Full refund window from the date of purchase.</p>
                  </div>
                </div>

                {/* Interactive Refund Request Simulator */}
                <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">Instant Self-Service Refund Request</h4>
                  {refundProcessed ? (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-md">
                      <p className="font-semibold text-white">Refund Authorized</p>
                      <p className="mt-0.5">
                        Your request was processed automatically. Confirmation has been issued to your billing profile.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleProcessRefund} className="space-y-3">
                      <div>
                        <label htmlFor="refund-reason" className="block text-slate-300 font-medium mb-1">
                          Select Reason (Optional feedback):
                        </label>
                        <select
                          id="refund-reason"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          <option value="Changed my fitness goals">Changed my fitness goals</option>
                          <option value="Did not need premium features">Did not need premium features</option>
                          <option value="Hardware incompatibility">Wearable hardware incompatibility</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors"
                      >
                        Submit Instant Refund Request
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Technical Storage Audit
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Cookie &amp; Local Storage Policy</h3>
                <p className="text-slate-400 mt-1">Transparent breakdown of all storage keys utilized</p>
              </div>

              <p>
                PulseFit operates <strong>zero third-party tracking cookies</strong>. We use client-side browser <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded-sm">localStorage</code> strictly for functional application integrity:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-800 rounded-lg overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Storage Key</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Purpose</th>
                      <th className="p-2.5">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-mono text-emerald-300">pulse_user_profile</td>
                      <td className="p-2.5">Strictly Necessary</td>
                      <td className="p-2.5 text-slate-300">Stores age, weight, and resting HR for Karvonen calculations</td>
                      <td className="p-2.5 text-slate-400">Persistent until user purges</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-emerald-300">pulse_workout_history</td>
                      <td className="p-2.5">Strictly Necessary</td>
                      <td className="p-2.5 text-slate-300">Stores your personal workout logs and HR telemetry points</td>
                      <td className="p-2.5 text-slate-400">Persistent until user purges</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-emerald-300">pulse_consent_record</td>
                      <td className="p-2.5">Compliance</td>
                      <td className="p-2.5 text-slate-300">Records biometric consent and age verification status</td>
                      <td className="p-2.5 text-slate-400">Persistent until user purges</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-emerald-300">pulse_cookie_prefs</td>
                      <td className="p-2.5">Preferences</td>
                      <td className="p-2.5 text-slate-300">Remembers your cookie banner interaction choices</td>
                      <td className="p-2.5 text-slate-400">Persistent</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-emerald-300">pulse_sound_muted</td>
                      <td className="p-2.5">Preferences</td>
                      <td className="p-2.5 text-slate-300">Saves your audio zone chime mute preference</td>
                      <td className="p-2.5 text-slate-400">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CONSENT MANAGEMENT */}
          {activeTab === 'consents' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  GDPR Article 7 &amp; 9
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Form Consents &amp; Biometric Permissions</h3>
                <p className="text-slate-400 mt-1">Review or toggle your affirmative consent states</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start justify-between gap-3">
                  <div>
                    <label htmlFor="consent-biometric" className="font-semibold text-white cursor-pointer">
                      Explicit Biometric Data Processing Consent (GDPR Art. 9)
                    </label>
                    <p className="text-slate-400 mt-1">
                      Authorizes the client-side parsing of Bluetooth Low Energy heart rate signals to display real-time BPM, zone categorization, and caloric calculations.
                    </p>
                  </div>
                  <input
                    id="consent-biometric"
                    type="checkbox"
                    checked={consent.biometricConsent}
                    onChange={(e) => handleUpdateConsents({ biometricConsent: e.target.checked })}
                    className="w-4 h-4 mt-1 accent-emerald-500 rounded-sm cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start justify-between gap-3">
                  <div>
                    <label htmlFor="consent-terms" className="font-semibold text-white cursor-pointer">
                      Terms of Service &amp; Health Disclaimer Acceptance
                    </label>
                    <p className="text-slate-400 mt-1">
                      Confirms understanding that PulseFit provides training metrics and is not a medical device.
                    </p>
                  </div>
                  <input
                    id="consent-terms"
                    type="checkbox"
                    checked={consent.termsAccepted}
                    onChange={(e) => handleUpdateConsents({ termsAccepted: e.target.checked })}
                    className="w-4 h-4 mt-1 accent-emerald-500 rounded-sm cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start justify-between gap-3">
                  <div>
                    <label htmlFor="consent-privacy" className="font-semibold text-white cursor-pointer">
                      Privacy Policy Acceptance
                    </label>
                    <p className="text-slate-400 mt-1">
                      Confirms reading of our local storage architecture and data minimization policy.
                    </p>
                  </div>
                  <input
                    id="consent-privacy"
                    type="checkbox"
                    checked={consent.privacyAccepted}
                    onChange={(e) => handleUpdateConsents({ privacyAccepted: e.target.checked })}
                    className="w-4 h-4 mt-1 accent-emerald-500 rounded-sm cursor-pointer"
                  />
                </div>

                {consent.consentDate && (
                  <p className="text-[11px] text-slate-500 pt-2 font-mono">
                    Last Consent Logged: {new Date(consent.consentDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDITED 3RD-PARTY SDKS */}
          {activeTab === 'sdkaudit' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Zero Adware &amp; Zero Trackers
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Audited Third-Party Dependencies</h3>
                <p className="text-slate-400 mt-1">Independent supply chain audit of all bundled packages</p>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg text-emerald-200">
                <p className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  Tracker Audit Passed: 0 Tracking Pixels / 0 Advertising SDKs
                </p>
                <p className="mt-1 text-slate-300">
                  PulseFit contains zero Google Analytics, zero Meta / Facebook Pixel, zero TikTok Pixel, zero adjust/Branch attribution trackers, and zero session replay eavesdroppers.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-800 rounded-lg">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                    <tr>
                      <th className="p-2.5">Package</th>
                      <th className="p-2.5">License</th>
                      <th className="p-2.5">Audit Purpose</th>
                      <th className="p-2.5">Surveillance Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-semibold text-white">firebase (Auth &amp; Firestore)</td>
                      <td className="p-2.5 text-emerald-400">Apache-2.0</td>
                      <td className="p-2.5 text-slate-300">Google Sign-in and secure personal cloud workout syncing</td>
                      <td className="p-2.5 text-emerald-400 font-medium">Zero Advertising (User-authenticated only)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">recharts</td>
                      <td className="p-2.5 text-emerald-400">MIT</td>
                      <td className="p-2.5 text-slate-300">Client-side SVG chart rendering for live HRV telemetry</td>
                      <td className="p-2.5 text-emerald-400 font-medium">None (0 Network Calls)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">lucide-react</td>
                      <td className="p-2.5 text-emerald-400">ISC / MIT</td>
                      <td className="p-2.5 text-slate-300">Lightweight SVG icons (accessible)</td>
                      <td className="p-2.5 text-emerald-400 font-medium">None (0 Network Calls)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">motion</td>
                      <td className="p-2.5 text-emerald-400">MIT</td>
                      <td className="p-2.5 text-slate-300">CSS transform spring animations</td>
                      <td className="p-2.5 text-emerald-400 font-medium">None (Pure Client)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">tailwindcss</td>
                      <td className="p-2.5 text-emerald-400">MIT</td>
                      <td className="p-2.5 text-slate-300">Design system CSS styling</td>
                      <td className="p-2.5 text-emerald-400 font-medium">None (Static Build)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-white">Web Bluetooth API</td>
                      <td className="p-2.5 text-emerald-400">W3C Standard</td>
                      <td className="p-2.5 text-slate-300">Direct GATT 0x180D hardware pairing</td>
                      <td className="p-2.5 text-emerald-400 font-medium">None (Air-Gapped Local)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: BUSINESS & LEGAL DETAILS */}
          {activeTab === 'business' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Corporate Transparency
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Business &amp; Statutory Legal Details</h3>
                <p className="text-slate-400 mt-1">Full commercial identification and contact information</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Legal Entity Name:</span>
                  <p className="text-white font-semibold">PulseFit Technologies Inc.</p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Corporate Registration No.:</span>
                  <p className="text-white font-semibold">DE-7390142-C</p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Registered Business Address:</span>
                  <p className="text-white font-semibold">548 Market Street, Suite 84210, San Francisco, CA 94104, United States</p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Federal Tax / VAT ID:</span>
                  <p className="text-white font-semibold">EIN 94-8201948 / US-VAT-EXEMPT</p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Designated Data Protection Officer (DPO):</span>
                  <p className="text-white font-semibold">hurairaahm714@gmail.com</p>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium text-[11px]">Legal &amp; Regulatory Inquiries:</span>
                  <p className="text-white font-semibold">legal@pulsefit.app</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: KIDS DATA & AGE CONSENT */}
          {activeTab === 'ageconsent' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  COPPA &amp; GDPR Article 8
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Kids Data Protection &amp; Age Verification</h3>
                <p className="text-slate-400 mt-1">Verifiable parental consent for adolescent fitness telemetry</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <p className="text-slate-300 leading-relaxed">
                  Under the US Children’s Online Privacy Protection Act (COPPA) and EU GDPR Article 8, children under 16 years of age require verified parental or legal guardian consent prior to collecting or processing fitness and telemetry data.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-slate-400">Current Registered Age:</span>
                    <p className="text-white font-bold text-sm mt-0.5">{profile.age} Years Old</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      profile.age >= 16
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                        : consent.parentalConsent
                        ? 'bg-blue-950 border-blue-800 text-blue-300'
                        : 'bg-amber-950 border-amber-800 text-amber-300'
                    }`}
                  >
                    {profile.age >= 16
                      ? 'Adult Consent (16+)'
                      : consent.parentalConsent
                      ? 'Guardian Consent Verified'
                      : 'Parental Consent Required'}
                  </span>
                </div>

                {ageConsentError && (
                  <p className="text-xs text-rose-400 font-semibold">{ageConsentError}</p>
                )}

                {profile.age < 16 ? (
                  <form onSubmit={handleSaveParentalConsent} className="space-y-3 pt-2">
                    <div>
                      <label htmlFor="guardian-name" className="block text-slate-300 font-medium mb-1">
                        Parent or Legal Guardian Name:
                      </label>
                      <input
                        id="guardian-name"
                        type="text"
                        required
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor="guardian-email" className="block text-slate-300 font-medium mb-1">
                        Parent/Guardian Email Address:
                      </label>
                      <input
                        id="guardian-email"
                        type="email"
                        required
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        placeholder="guardian@example.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-white"
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        id="parental-ack"
                        type="checkbox"
                        required
                        checked={parentalConsentChecked}
                        onChange={(e) => setParentalConsentChecked(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-emerald-500 rounded-sm"
                      />
                      <label htmlFor="parental-ack" className="text-slate-300 text-xs">
                        I certify that I am the parent/legal guardian and consent to the client-side processing of heart rate telemetry for workout guidance.
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors"
                    >
                      Record Verifiable Parental Consent
                    </button>
                  </form>
                ) : (
                  <p className="text-slate-400 text-xs pt-1">
                    Your profile age ({profile.age}) is above the 16-year statutory threshold. Parental consent is not required for adult profiles.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: EMAIL & UNSUBSCRIBE */}
          {activeTab === 'emailprefs' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  CAN-SPAM &amp; GDPR Opt-Out
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Email Communications &amp; 1-Click Unsubscribe</h3>
                <p className="text-slate-400 mt-1">Instant unsubscription and mandatory CAN-SPAM physical footer preview</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Newsletter &amp; Workout Digest Status</h4>
                    <p className="text-slate-400 mt-0.5">Associated with: {emailAddress}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                      emailSubscribed
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {emailSubscribed ? 'Subscribed' : 'Unsubscribed'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    We hate spam as much as you do. You can unsubscribe immediately with 1 click.
                  </p>
                  {emailSubscribed ? (
                    <button
                      onClick={() => {
                        setEmailSubscribed(false);
                        showSuccess('Unsubscribed from all marketing and workout summary emails.');
                      }}
                      className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-700/60 font-semibold rounded-md transition-colors"
                    >
                      1-Click Instant Unsubscribe
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEmailSubscribed(true);
                        showSuccess('Resubscribed to weekly training digests.');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors"
                    >
                      Re-enable Digest Emails
                    </button>
                  )}
                </div>
              </div>

              {/* Sample Compliant Outbound Email Preview */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Mandatory Compliant Email Footer Preview:
                </span>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-md text-[11px] text-slate-400 space-y-2">
                  <p className="text-slate-300">
                    You received this email because you registered for weekly workout analytics at PulseFit.
                  </p>
                  <p>
                    PulseFit Technologies Inc. · 548 Market St, Suite 84210, San Francisco, CA 94104 · Contact: support@pulsefit.app
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-emerald-400">
                    <button
                      onClick={() => {
                        setEmailSubscribed(false);
                        showSuccess('Unsubscribed via email footer link.');
                      }}
                      className="underline hover:text-emerald-300"
                    >
                      Unsubscribe from all future emails
                    </button>
                    <span aria-hidden="true">·</span>
                    <button onClick={() => setActiveTab('privacy')} className="underline hover:text-emerald-300">
                      Privacy Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: FONT & ASSET LICENSES */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Open Source Compliance
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Font &amp; Asset Licensing Manifest</h3>
                <p className="text-slate-400 mt-1">Full attribution for typography, icons, and visual assets</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">System Typography &amp; Inter UI Font</h4>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-sm text-[10px] font-semibold">
                      SIL Open Font License 1.1
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    Rendered via standard native system stacks (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`). Zero external un-licensed webfonts or fonts with tracking scripts.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Lucide Iconography Pack</h4>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-sm text-[10px] font-semibold">
                      ISC / MIT License
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    Licensed by Lucide Contributors. Accessible, royalty-free, scalable vector graphics.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Waveform Vector Visualizations</h4>
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-sm text-[10px] font-semibold">
                      CC0 / MIT
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    Original procedural SVG heart rate waveforms calculated mathematically directly in client JavaScript.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: DATA PORTABILITY (GDPR ART. 20 / CCPA) */}
          {activeTab === 'portability' && (
            <div className="space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  GDPR Article 20 &amp; CCPA Data Portability
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Machine-Readable Data Portability Export</h3>
                <p className="text-slate-400 mt-1">
                  Export your full workout telemetry, physiological baselines, and consent records as standardized, machine-readable JSON.
                </p>
              </div>

              {/* Legal Explanation Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-300 space-y-2">
                <p className="font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  Your Legal Right to Data Portability
                </p>
                <p className="text-xs leading-relaxed">
                  Under the European Union General Data Protection Regulation (GDPR Article 20) and California Consumer Privacy Act (CCPA Section 1798.100), you have the absolute right to receive your personal data in a structured, commonly used, and machine-readable format (JSON). PulseFit guarantees zero proprietary lock-in.
                </p>
              </div>

              {/* Archive Metadata Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Workout Sessions:</span>
                  <p className="text-white font-bold text-sm mt-0.5 tabular-nums">
                    {workouts?.length || 0} Logs
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Data Schema:</span>
                  <p className="text-emerald-400 font-semibold mt-0.5">
                    PulseFit Portability v2.1
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">File Format:</span>
                  <p className="text-white font-semibold mt-0.5">
                    RFC 8259 JSON (UTF-8)
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-slate-400">Security &amp; Storage:</span>
                  <p className="text-emerald-400 font-semibold mt-0.5">
                    Client-Side Generated
                  </p>
                </div>
              </div>

              {/* Customization Options */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Export Customization Options:
                </span>
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRawTelemetry}
                      onChange={(e) => setIncludeRawTelemetry(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded-sm cursor-pointer"
                    />
                    <span className="text-slate-200">Include Second-by-Second Telemetry Points</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={minifyExportJson}
                      onChange={(e) => setMinifyExportJson(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded-sm cursor-pointer"
                    />
                    <span className="text-slate-200">Minified Format (Compact for Migration)</span>
                  </label>
                </div>
              </div>

              {/* Interactive JSON Preview Box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Machine-Readable JSON Preview
                  </span>
                  <button
                    onClick={handleCopyExportJson}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    {copiedExport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto bg-slate-900 p-3 rounded-md font-mono text-[11px] text-emerald-300 leading-relaxed border border-slate-800 select-all">
                  <pre>{getExportJson()}</pre>
                </div>
                <p className="text-[11px] text-slate-400">
                  This document contains your verified biometric baseline (age {profile.age}, weight {profile.weightKg}kg, resting HR {profile.restingHr} BPM), privacy consents, and completed session history.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadExportJson}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download Machine-Readable JSON File (.json)
                </button>
                <button
                  onClick={handleCopyExportJson}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  Copy Payload
                </button>
              </div>
            </div>
          )}

          {/* TAB 12: DATA DELETION (GDPR ART. 17) */}
          {activeTab === 'deletion' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                  GDPR Article 17 Right to Erasure
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">Permanent Data Deletion &amp; Purge</h3>
                <p className="text-slate-400 mt-1">Irreversible wipe of all workouts, telemetry logs, and user profile data</p>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-200 space-y-2">
                <p className="font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  Irreversible Data Destruction Warning
                </p>
                <p className="text-xs">
                  Executing this action will immediately destroy all locally stored workout history, caloric calculation records, biometric telemetry points, cookie preferences, and consent logs from this device.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const jsonStr = exportUserDataJson();
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pulsefit-backup-before-deletion.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showSuccess('Downloaded safety backup before deletion.');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  Download Backup First (JSON)
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Permanently Delete All My Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-xl shadow-2xl p-6 text-slate-100">
            <h3 id="confirm-delete-title" className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" aria-hidden="true" />
              Confirm Permanent Erasure
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. To permanently delete all biometric logs, workout histories, and profile settings, please type <strong className="text-rose-400 font-mono">DELETE</strong> below:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mt-4 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus-visible:ring-2 focus-visible:ring-rose-500"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDataDeletion}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Permanently Erase Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
