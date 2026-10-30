import React from 'react';
import { ShieldCheck, Heart, Scale, Trash2, Cookie, Building, Mail, ExternalLink } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface Props {
  onNavigateToTab: (tab: ActiveTab) => void;
  onOpenPrivacySection: () => void;
  onOpenCookies: () => void;
  onOpenProfile: () => void;
}

export const Footer: React.FC<Props> = ({
  onNavigateToTab,
  onOpenPrivacySection,
  onOpenCookies,
  onOpenProfile,
}) => {
  return (
    <footer className="mt-16 bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              PulseFit Telemetry
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Privacy-first, client-side cardiovascular telemetry and heart rate reserve training. Real-time BLE connectivity without cloud surveillance.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Audited Client-Side Architecture</span>
            </div>
          </div>

          {/* Training & Features */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block">
              Application
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigateToTab('tracker')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Real-Time Heart Rate Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('plans')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Personalized Workout Plans
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('analytics')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Analytics &amp; Data Export (JSON/CSV)
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenProfile}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Biometric Profile &amp; Consents
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal Rights */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block">
              Trust &amp; Governance
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    onNavigateToTab('legal');
                  }}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Privacy Policy (GDPR / CCPA)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('legal')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Terms of Service &amp; Health Disclaimer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('legal')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  30-Day Refund Policy ($0 Hidden Fees)
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenCookies}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Cookie &amp; Local Storage Settings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('legal')}
                  className="hover:text-emerald-400 transition-colors focus-visible:outline-hidden focus-visible:underline"
                >
                  Data Portability (GDPR Art. 20 Export)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateToTab('legal')}
                  className="hover:text-rose-400 transition-colors text-rose-300 font-medium focus-visible:outline-hidden focus-visible:underline"
                >
                  Right to Erasure (Delete All Data)
                </button>
              </li>
            </ul>
          </div>

          {/* Statutory Business Details */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block">
              Statutory Corporate Info
            </span>
            <div className="space-y-1 text-slate-400 text-[11px]">
              <p className="text-white font-medium">PulseFit Technologies Inc.</p>
              <p>548 Market Street, Suite 84210</p>
              <p>San Francisco, CA 94104, USA</p>
              <p className="pt-1">Reg: DE-7390142-C · EIN: 94-8201948</p>
              <p className="text-emerald-400">DPO: hurairaahm714@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            &copy; 2026 PulseFit Technologies Inc. All rights reserved. Open source fonts &amp; icons under SIL OFL &amp; ISC.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>WCAG 2.1 AA Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Zero Third-Party Trackers</span>
            <span aria-hidden="true">·</span>
            <span>Web Bluetooth GATT 0x180D</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
