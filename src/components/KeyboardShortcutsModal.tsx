import React, { useEffect } from 'react';
import { X, Keyboard, Volume2, Play, Flag, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space / K', action: 'Start, Pause, or Resume Workout', icon: Play },
    { key: 'L', action: 'Record Lap / Split Interval', icon: Flag },
    { key: 'M', action: 'Toggle Audio Cues (Mute / Unmute)', icon: Volume2 },
    { key: '?', action: 'Open Keyboard Shortcuts Help', icon: Keyboard },
    { key: 'Esc', action: 'Close Modal or Overlay', icon: X },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h2 id="shortcuts-modal-title" className="text-lg font-semibold tracking-tight">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1 text-slate-400 hover:text-white rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          PulseFit provides full keyboard accessibility. You can navigate the entire interface using Tab, Enter, and these rapid shortcuts:
        </p>

        <ul className="mt-4 space-y-3">
          {shortcuts.map(({ key, action, icon: Icon }) => (
            <li
              key={key}
              className="flex items-center justify-between p-2.5 bg-slate-800/60 rounded-lg border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-200">{action}</span>
              </div>
              <kbd className="px-2 py-1 text-xs font-mono font-semibold text-slate-300 bg-slate-950 border border-slate-700 rounded-md shadow-xs">
                {key}
              </kbd>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
