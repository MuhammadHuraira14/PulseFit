import React, { useState } from 'react';
import { Cookie, Shield, Check, X, SlidersHorizontal } from 'lucide-react';
import { CookiePreferences } from '../types/fitness';
import { saveCookiePreferences } from '../utils/storage';

interface Props {
  preferences: CookiePreferences;
  onUpdatePreferences: (prefs: CookiePreferences) => void;
  onOpenCookiePolicy: () => void;
}

export const CookieConsentBanner: React.FC<Props> = ({
  preferences,
  onUpdatePreferences,
  onOpenCookiePolicy,
}) => {
  const [showCustomize, setShowCustomize] = useState(false);
  const [customAnalytics, setCustomAnalytics] = useState(preferences.analytics);
  const [customPrefs, setCustomPrefs] = useState(preferences.preferences);

  if (preferences.hasInteracted && !showCustomize) {
    return null;
  }

  const handleAcceptAll = () => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true,
      hasInteracted: true,
    };
    saveCookiePreferences(updated);
    onUpdatePreferences(updated);
    setShowCustomize(false);
  };

  const handleRejectNonEssential = () => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: false,
      preferences: false,
      hasInteracted: true,
    };
    saveCookiePreferences(updated);
    onUpdatePreferences(updated);
    setShowCustomize(false);
  };

  const handleSaveCustom = () => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: customAnalytics,
      preferences: customPrefs,
      hasInteracted: true,
    };
    saveCookiePreferences(updated);
    onUpdatePreferences(updated);
    setShowCustomize(false);
  };

  return (
    <aside
      aria-label="Cookie and storage consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xl z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-5 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {!showCustomize ? (
        <div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 border border-emerald-500/20">
              <Cookie className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Privacy-First Storage &amp; Cookie Consent
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                PulseFit uses local browser storage strictly for essential workout metrics, heart rate telemetry calculations, and your selected preferences. We <strong className="text-emerald-400 font-medium">do not</strong> sell your data or load cross-site ad trackers.
              </p>
              <div className="mt-2 text-xs">
                <button
                  onClick={onOpenCookiePolicy}
                  className="text-emerald-400 hover:text-emerald-300 underline font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xs"
                >
                  Read our full Cookie &amp; Storage Policy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => setShowCustomize(true)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                Customize
              </span>
            </button>
            <button
              onClick={handleRejectNonEssential}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Accept All
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              Granular Storage &amp; Cookie Preferences
            </h3>
            <button
              onClick={() => setShowCustomize(false)}
              aria-label="Back to main cookie notice"
              className="text-slate-400 hover:text-white p-1 rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Strictly Necessary Storage (Required)</p>
                <p className="text-slate-400 mt-0.5">
                  Stores live workout logs, active telemetry buffer, and Karvonen heart rate profile. Cannot be deactivated.
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-sm">
                Always Active
              </span>
            </div>

            <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <label htmlFor="toggle-analytics" className="font-semibold text-white cursor-pointer">
                  Aggregated Analytics (Client-Side)
                </label>
                <p className="text-slate-400 mt-0.5">
                  Allows local calculation of weekly zone distribution trends. No identifiers leave your device.
                </p>
              </div>
              <input
                id="toggle-analytics"
                type="checkbox"
                checked={customAnalytics}
                onChange={(e) => setCustomAnalytics(e.target.checked)}
                className="w-4 h-4 mt-1 accent-emerald-500 rounded-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <label htmlFor="toggle-preferences" className="font-semibold text-white cursor-pointer">
                  Preferences &amp; Audio Settings
                </label>
                <p className="text-slate-400 mt-0.5">
                  Remembers audio zone chime preferences and UI display density across sessions.
                </p>
              </div>
              <input
                id="toggle-preferences"
                type="checkbox"
                checked={customPrefs}
                onChange={(e) => setCustomPrefs(e.target.checked)}
                className="w-4 h-4 mt-1 accent-emerald-500 rounded-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              onClick={() => setShowCustomize(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustom}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
            >
              Save My Preferences
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
