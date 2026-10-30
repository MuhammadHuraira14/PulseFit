import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Trash2,
  Calendar,
  Clock,
  Heart,
  Flame,
  Activity,
  X,
  FileSpreadsheet,
  FileJson,
  Check,
} from 'lucide-react';
import { CompletedWorkout, HRZone } from '../types/fitness';
import { formatDuration } from '../utils/fitnessMath';
import { exportUserDataJson, exportWorkoutsCsv, deleteWorkout } from '../utils/storage';

interface Props {
  workouts: CompletedWorkout[];
  onWorkoutsUpdated: (workouts: CompletedWorkout[]) => void;
}

export const AnalyticsHistory: React.FC<Props> = ({ workouts, onWorkoutsUpdated }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<CompletedWorkout | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Compute aggregate statistics
  const totalWorkouts = workouts.length;
  const totalSeconds = workouts.reduce((sum, w) => sum + w.durationSeconds, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  const avgOverallHr =
    totalWorkouts > 0
      ? Math.round(workouts.reduce((sum, w) => sum + w.avgHeartRate, 0) / totalWorkouts)
      : 0;

  // Aggregate time in zones
  const aggregateZones: Record<HRZone, number> = {
    zone1: 0,
    zone2: 0,
    zone3: 0,
    zone4: 0,
    zone5: 0,
  };
  workouts.forEach((w) => {
    Object.entries(w.zoneDistribution).forEach(([z, sec]) => {
      aggregateZones[z as HRZone] += sec;
    });
  });

  const totalZoneSeconds = Object.values(aggregateZones).reduce((a, b) => a + b, 0) || 1;

  const handleExportJson = () => {
    const jsonStr = exportUserDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsefit-telemetry-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported full JSON data archive');
  };

  const handleExportCsv = () => {
    const csvStr = exportWorkoutsCsv();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulsefit-workouts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Exported CSV workout logs');
  };

  const handleDelete = (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout log?')) {
      const updated = deleteWorkout(workoutId);
      onWorkoutsUpdated(updated);
      if (selectedWorkout?.id === workoutId) {
        setSelectedWorkout(null);
      }
    }
  };

  const showNotice = (msg: string) => {
    setCopiedNotice(msg);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Telemetry Insights
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Workout Analytics &amp; History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated heart rate zones and training volume. All data resides securely in your local browser storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Export CSV
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <FileJson className="w-4 h-4" aria-hidden="true" />
            Export Full JSON
          </button>
        </div>
      </div>

      {copiedNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-200 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Total Sessions
          </span>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">{totalWorkouts}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Total Active Time
          </span>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">
            {formatDuration(totalSeconds)}
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
            Total Calorie Burn
          </span>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">
            {totalCalories.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
            Avg Working Heart Rate
          </span>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">
            {avgOverallHr} <span className="text-xs font-normal text-slate-400">BPM</span>
          </p>
        </div>
      </div>

      {/* Cumulative HR Zone Distribution */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Cumulative Heart Rate Zone Distribution
          </h3>
          <span className="text-xs text-slate-400">
            {Math.round(totalZoneSeconds / 60)} minutes logged
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="h-4 w-full rounded-full flex overflow-hidden bg-slate-800">
          <div
            style={{ width: `${(aggregateZones.zone1 / totalZoneSeconds) * 100}%` }}
            className="bg-blue-500"
            title={`Zone 1: ${Math.round((aggregateZones.zone1 / totalZoneSeconds) * 100)}%`}
          />
          <div
            style={{ width: `${(aggregateZones.zone2 / totalZoneSeconds) * 100}%` }}
            className="bg-emerald-500"
            title={`Zone 2: ${Math.round((aggregateZones.zone2 / totalZoneSeconds) * 100)}%`}
          />
          <div
            style={{ width: `${(aggregateZones.zone3 / totalZoneSeconds) * 100}%` }}
            className="bg-amber-500"
            title={`Zone 3: ${Math.round((aggregateZones.zone3 / totalZoneSeconds) * 100)}%`}
          />
          <div
            style={{ width: `${(aggregateZones.zone4 / totalZoneSeconds) * 100}%` }}
            className="bg-orange-500"
            title={`Zone 4: ${Math.round((aggregateZones.zone4 / totalZoneSeconds) * 100)}%`}
          />
          <div
            style={{ width: `${(aggregateZones.zone5 / totalZoneSeconds) * 100}%` }}
            className="bg-rose-500"
            title={`Zone 5: ${Math.round((aggregateZones.zone5 / totalZoneSeconds) * 100)}%`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-xs">
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-blue-400">Zone 1 (Recovery)</span>
            <p className="text-white mt-1 font-mono font-medium">
              {formatDuration(aggregateZones.zone1)} (
              {Math.round((aggregateZones.zone1 / totalZoneSeconds) * 100)}%)
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-emerald-400">Zone 2 (Aerobic Base)</span>
            <p className="text-white mt-1 font-mono font-medium">
              {formatDuration(aggregateZones.zone2)} (
              {Math.round((aggregateZones.zone2 / totalZoneSeconds) * 100)}%)
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-400">Zone 3 (Cardio)</span>
            <p className="text-white mt-1 font-mono font-medium">
              {formatDuration(aggregateZones.zone3)} (
              {Math.round((aggregateZones.zone3 / totalZoneSeconds) * 100)}%)
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-orange-400">Zone 4 (Threshold)</span>
            <p className="text-white mt-1 font-mono font-medium">
              {formatDuration(aggregateZones.zone4)} (
              {Math.round((aggregateZones.zone4 / totalZoneSeconds) * 100)}%)
            </p>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="font-semibold text-rose-400">Zone 5 (Peak Anaerobic)</span>
            <p className="text-white mt-1 font-mono font-medium">
              {formatDuration(aggregateZones.zone5)} (
              {Math.round((aggregateZones.zone5 / totalZoneSeconds) * 100)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Workouts History Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <h3 className="text-sm font-semibold text-white tracking-tight mb-4">
          Session Log History ({workouts.length})
        </h3>

        {workouts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No workouts recorded yet.</p>
            <p className="mt-1 text-slate-400">
              Start a session in the Real-Time Tracker to populate your logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date &amp; Title</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Avg / Max HR</th>
                  <th className="py-3 px-4 font-semibold">Calories</th>
                  <th className="py-3 px-4 font-semibold">Laps</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workouts.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{w.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(w.startTime).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatDuration(w.durationSeconds)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-white font-semibold">{w.avgHeartRate}</span>
                      <span className="text-slate-400"> / {w.maxHeartRate} BPM</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-amber-300">
                      {w.caloriesBurned} kcal
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{w.laps.length}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedWorkout(w)}
                          className="px-2.5 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          aria-label={`Delete workout ${w.title}`}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 id="workout-details-title" className="text-base font-semibold text-white">
                  {selectedWorkout.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedWorkout.startTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedWorkout(null)}
                aria-label="Close workout details modal"
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400">Duration:</span>
                <p className="text-white font-mono font-bold mt-0.5">
                  {formatDuration(selectedWorkout.durationSeconds)}
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400">Calories Burned:</span>
                <p className="text-amber-300 font-mono font-bold mt-0.5">
                  {selectedWorkout.caloriesBurned} kcal
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400">Average Heart Rate:</span>
                <p className="text-white font-mono font-bold mt-0.5">
                  {selectedWorkout.avgHeartRate} BPM
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400">Peak Heart Rate:</span>
                <p className="text-rose-400 font-mono font-bold mt-0.5">
                  {selectedWorkout.maxHeartRate} BPM
                </p>
              </div>
            </div>

            {selectedWorkout.notes && (
              <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Session Notes:</span>
                <p className="text-slate-200 mt-1">{selectedWorkout.notes}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedWorkout(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
