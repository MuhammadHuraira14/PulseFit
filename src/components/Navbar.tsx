import React from 'react';
import { Activity, Heart, Shield, Calendar, BarChart3, Volume2, VolumeX, Keyboard, Bluetooth, Sparkles, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { BleDeviceInfo } from '../types/fitness';

export type ActiveTab = 'tracker' | 'plans' | 'analytics' | 'legal';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  bleInfo: BleDeviceInfo;
  isWorkoutActive: boolean;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenShortcuts: () => void;
  onOpenBleModal: () => void;
  user?: any | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  bleInfo,
  isWorkoutActive,
  isSoundMuted,
  onToggleSound,
  onOpenShortcuts,
  onOpenBleModal,
  user,
  onSignIn,
  onSignOut,
}) => {
  const getBleStatusBadge = () => {
    switch (bleInfo.status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
            <Bluetooth className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="hidden sm:inline">{bleInfo.name}</span>
            <span className="sm:hidden">BLE</span>
            {bleInfo.batteryLevel !== undefined && (
              <span className="text-[10px] text-emerald-300">({bleInfo.batteryLevel}%)</span>
            )}
          </span>
        );
      case 'simulated':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span className="hidden sm:inline">Virtual Polar H10</span>
            <span className="sm:hidden">Virtual</span>
            {bleInfo.batteryLevel !== undefined && (
              <span className="text-[10px] text-emerald-300">({bleInfo.batteryLevel}%)</span>
            )}
          </span>
        );
      case 'scanning':
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-md animate-pulse">
            <Bluetooth className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Connecting...</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-md">
            <Bluetooth className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="hidden sm:inline">Connect Wearable</span>
            <span className="sm:hidden">Pair</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shadow-sm flex items-center justify-center">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                PulseFit
                <span className="text-[11px] font-normal text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-sm">
                  Telemetry v2.0
                </span>
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => onSelectTab('tracker')}
              aria-current={activeTab === 'tracker' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === 'tracker'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Real-Time Tracker</span>
              {isWorkoutActive && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('plans')}
              aria-current={activeTab === 'plans' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === 'plans'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Workout Plans</span>
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              aria-current={activeTab === 'analytics' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Analytics &amp; Logs</span>
            </button>

            <button
              onClick={() => onSelectTab('legal')}
              aria-current={activeTab === 'legal' ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                activeTab === 'legal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Trust &amp; Privacy</span>
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* BLE Button */}
            <button
              onClick={onOpenBleModal}
              aria-label="Wearable heart rate monitor connection settings"
              className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
            >
              {getBleStatusBadge()}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              aria-label={isSoundMuted ? 'Unmute workout audio alerts' : 'Mute workout audio alerts'}
              title={isSoundMuted ? 'Audio alerts muted (Press M)' : 'Audio alerts enabled (Press M)'}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              )}
            </button>

            {/* Shortcuts Help */}
            <button
              onClick={onOpenShortcuts}
              aria-label="View keyboard shortcuts (Press ?)"
              title="Keyboard shortcuts (?)"
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Google Authentication Control */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    className="w-7 h-7 rounded-full border border-emerald-500/60"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700">
                    <UserIcon className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
                <span className="hidden xl:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'User'}
                </span>
                <button
                  onClick={onSignOut}
                  aria-label="Sign out of Firebase Auth"
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-md shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <nav aria-label="Mobile Navigation" className="md:hidden flex items-center justify-around py-2 border-t border-slate-900">
          <button
            onClick={() => onSelectTab('tracker')}
            aria-current={activeTab === 'tracker' ? 'page' : undefined}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium transition-colors ${
              activeTab === 'tracker' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4 mb-0.5" aria-hidden="true" />
            <span>Tracker</span>
          </button>
          <button
            onClick={() => onSelectTab('plans')}
            aria-current={activeTab === 'plans' ? 'page' : undefined}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium transition-colors ${
              activeTab === 'plans' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" aria-hidden="true" />
            <span>Plans</span>
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            aria-current={activeTab === 'analytics' ? 'page' : undefined}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium transition-colors ${
              activeTab === 'analytics' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" aria-hidden="true" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onSelectTab('legal')}
            aria-current={activeTab === 'legal' ? 'page' : undefined}
            className={`flex flex-col items-center py-1 px-2 text-[11px] font-medium transition-colors ${
              activeTab === 'legal' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5" aria-hidden="true" />
            <span>Privacy</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
