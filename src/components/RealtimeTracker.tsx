import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Flag,
  Heart,
  Flame,
  Clock,
  Gauge,
  Activity,
  CheckCircle2,
  ChevronRight,
  Bluetooth,
  Sparkles,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  UserProfile,
  HRZone,
  TelemetryPoint,
  CompletedWorkout,
  WorkoutPlan,
  ExerciseItem,
} from '../types/fitness';
import {
  calculateHRZones,
  getCurrentZone,
  calculateCalories,
  formatDuration,
  calculateMaxHeartRate,
} from '../utils/fitnessMath';
import { soundManager } from '../utils/audioCues';
import { saveWorkout } from '../utils/storage';

interface Props {
  profile: UserProfile;
  currentHeartRate: number;
  rrIntervalMs?: number;
  sensorContact: boolean;
  activePlan: WorkoutPlan | null;
  onOpenBleModal: () => void;
  onWorkoutSaved: (workout: CompletedWorkout) => void;
  isSimulated: boolean;
  onSwitchToPlans: () => void;
}

export const RealtimeTracker: React.FC<Props> = ({
  profile,
  currentHeartRate,
  rrIntervalMs,
  sensorContact,
  activePlan,
  onOpenBleModal,
  onWorkoutSaved,
  isSimulated,
  onSwitchToPlans,
}) => {
  // Workout State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [laps, setLaps] = useState<number[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);

  // Active Plan execution state
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(0);

  // Chart display mode: 'hrv' (Recharts line graph) or 'bpm'
  const [chartMode, setChartMode] = useState<'hrv' | 'bpm'>('hrv');

  // Derived Zone definitions
  const effectiveMaxHr = profile.maxHrCustom || calculateMaxHeartRate(profile.age);
  const zones = calculateHRZones(profile.restingHr, effectiveMaxHr);
  const currentZone = getCurrentZone(currentHeartRate, profile.restingHr, effectiveMaxHr);

  // Recharts live line graph data for Heart Rate Variability (RR-interval in ms)
  const rechartsData = telemetry.map((pt) => ({
    time: formatDuration(pt.timestamp),
    second: pt.timestamp,
    hrv: pt.rrIntervalMs ?? Math.round(60000 / Math.max(40, pt.heartRate)),
    heartRate: pt.heartRate,
  }));

  // Keep track of current zone to sound alerts on transitions
  const previousZoneRef = useRef<HRZone | null>(null);

  // Audio tone on zone change
  useEffect(() => {
    if (isActive && !isPaused && previousZoneRef.current && previousZoneRef.current !== currentZone.zone) {
      soundManager.playZoneAlert();
    }
    previousZoneRef.current = currentZone.zone;
  }, [currentZone.zone, isActive, isPaused]);

  // Duration ref for stable timer ticking without nested setState
  const durationRef = useRef(0);
  useEffect(() => {
    durationRef.current = durationSeconds;
  }, [durationSeconds]);

  // Main 1-second workout clock & telemetry accumulator
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        const nextSec = durationRef.current + 1;
        durationRef.current = nextSec;
        setDurationSeconds(nextSec);

        const point: TelemetryPoint = {
          timestamp: nextSec,
          heartRate: currentHeartRate,
          zone: currentZone.zone,
          caloriesBurnedEstimate: calculateCalories(
            currentHeartRate,
            profile.weightKg,
            profile.age,
            nextSec,
            profile.gender
          ),
          sensorContact,
          rrIntervalMs,
        };
        setTelemetry((t) => [...t.slice(-120), point]);

        // Rest timer countdown if currently resting between sets
        setRestRemaining((prevRest) => {
          if (prevRest > 1) {
            if (prevRest <= 4) {
              soundManager.playCountdown();
            }
            return prevRest - 1;
          } else if (prevRest === 1) {
            soundManager.playComplete();
            setIsResting(false);
            return 0;
          }
          return 0;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, currentHeartRate, currentZone.zone, profile, sensorContact, rrIntervalMs]);

  // Keyboard navigation & control listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (!isActive) {
          handleStart();
        } else {
          handleTogglePause();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (isActive) {
          e.preventDefault();
          handleRecordLap();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPaused, durationSeconds]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    durationRef.current = 0;
    setDurationSeconds(0);
    const initialPoint: TelemetryPoint = {
      timestamp: 0,
      heartRate: currentHeartRate,
      zone: currentZone.zone,
      caloriesBurnedEstimate: 0,
      sensorContact,
      rrIntervalMs,
    };
    setTelemetry([initialPoint]);
    setLaps([]);
    setSessionStartTime(Date.now());
    soundManager.playComplete();
  };

  const handleTogglePause = () => {
    setIsPaused((p) => !p);
  };

  const handleRecordLap = () => {
    setLaps((prev) => [...prev, durationSeconds]);
    soundManager.playZoneAlert();
  };

  const handleFinish = () => {
    if (durationSeconds < 5) {
      setIsActive(false);
      setIsPaused(false);
      setDurationSeconds(0);
      return;
    }

    const hrs = telemetry.map((t) => t.heartRate).filter((hr) => hr > 0);
    const avgHr = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : currentHeartRate;
    const maxHr = hrs.length > 0 ? Math.max(...hrs) : currentHeartRate;
    const minHr = hrs.length > 0 ? Math.min(...hrs) : currentHeartRate;

    const zoneDistribution: Record<HRZone, number> = {
      zone1: 0,
      zone2: 0,
      zone3: 0,
      zone4: 0,
      zone5: 0,
    };
    telemetry.forEach((t) => {
      zoneDistribution[t.zone] = (zoneDistribution[t.zone] || 0) + 1;
    });

    const finishedWorkout: CompletedWorkout = {
      id: `workout-${Date.now()}`,
      title: activePlan ? activePlan.title : 'Live Cardio Telemetry Session',
      planId: activePlan?.id,
      startTime: sessionStartTime || Date.now() - durationSeconds * 1000,
      endTime: Date.now(),
      durationSeconds,
      avgHeartRate: avgHr,
      maxHeartRate: maxHr,
      minHeartRate: minHr,
      caloriesBurned: calculateCalories(
        avgHr,
        profile.weightKg,
        profile.age,
        durationSeconds,
        profile.gender
      ),
      zoneDistribution,
      telemetry,
      laps,
      notes: activePlan ? `Completed structured ${activePlan.title} session.` : 'Freeform heart rate tracking.',
    };

    saveWorkout(finishedWorkout);
    onWorkoutSaved(finishedWorkout);
    soundManager.playComplete();

    setIsActive(false);
    setIsPaused(false);
    setDurationSeconds(0);
    setTelemetry([]);
    setLaps([]);
  };

  // Structured Plan: Next Exercise or Next Set
  const currentExercise: ExerciseItem | undefined = activePlan?.exercises[activeExerciseIndex];

  const handleAdvanceExercise = () => {
    if (!activePlan || !currentExercise) return;
    if (currentSet < currentExercise.sets) {
      setCurrentSet((s) => s + 1);
      // Trigger rest timer
      if (currentExercise.restSeconds > 0) {
        setIsResting(true);
        setRestRemaining(currentExercise.restSeconds);
      }
    } else {
      // Advance to next exercise
      if (activeExerciseIndex + 1 < activePlan.exercises.length) {
        setActiveExerciseIndex((i) => i + 1);
        setCurrentSet(1);
        if (currentExercise.restSeconds > 0) {
          setIsResting(true);
          setRestRemaining(currentExercise.restSeconds);
        }
      } else {
        // All exercises completed
        soundManager.playComplete();
      }
    }
  };

  // Heart Rate Reserve calculation: (HR - HRrest) / (HRmax - HRrest)
  const hrrPercentage = Math.max(
    0,
    Math.min(100, Math.round(((currentHeartRate - profile.restingHr) / (effectiveMaxHr - profile.restingHr)) * 100))
  );

  const caloriesBurned = calculateCalories(
    currentHeartRate,
    profile.weightKg,
    profile.age,
    durationSeconds,
    profile.gender
  );

  // SVG Chart Dimensions
  const chartHeight = 120;
  const chartWidth = 500;
  const minChartHr = Math.min(50, profile.restingHr - 10);
  const maxChartHr = effectiveMaxHr + 10;

  const points = telemetry.map((pt, index) => {
    const x = (index / Math.max(1, telemetry.length - 1)) * chartWidth;
    const y = chartHeight - ((pt.heartRate - minChartHr) / (maxChartHr - minChartHr)) * chartHeight;
    return `${x},${Math.max(10, Math.min(chartHeight - 10, y))}`;
  });

  const pathData = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaData =
    points.length > 0
      ? `M 0,${chartHeight} L ${points.join(' L ')} L ${chartWidth},${chartHeight} Z`
      : '';

  // Heart rate animation duration calculation
  const pulseDuration = currentHeartRate > 40 ? 60 / currentHeartRate : 1;

  return (
    <section aria-label="Real-time fitness and telemetry tracker" className="space-y-6">
      {/* Top Banner & Structured Plan Notice */}
      {activePlan && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Active Workout Plan
              </span>
              <h2 className="text-sm font-semibold text-white">{activePlan.title}</h2>
              <p className="text-xs text-slate-400">
                Exercise {activeExerciseIndex + 1} of {activePlan.exercises.length} · Set {currentSet} of{' '}
                {currentExercise?.sets || 1}
              </p>
            </div>
          </div>
          <button
            onClick={onSwitchToPlans}
            className="text-xs text-slate-400 hover:text-white underline font-medium"
          >
            Switch Plan
          </button>
        </div>
      )}

      {/* Main Telemetry & HUD Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow based on current HR zone */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: currentZone.color }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Main BPM Dial & Zone Card */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-slate-950/80 border border-slate-800/90 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
                Heart Rate Telemetry
              </span>
              <button
                onClick={onOpenBleModal}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                {isSimulated ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Sparkles className="w-3 h-3" aria-hidden="true" /> Virtual BLE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Bluetooth className="w-3 h-3" aria-hidden="true" /> Sensor Config
                  </span>
                )}
              </button>
            </div>

            {/* Big Heart Rate Display with Dynamic SVG Pulse */}
            <div className="my-6 flex items-center justify-center gap-5">
              <div
                className="relative flex items-center justify-center"
                style={{
                  animation: `pulse ${pulseDuration}s ease-in-out infinite`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner transition-colors duration-500"
                  style={{
                    backgroundColor: `${currentZone.color}20`,
                    border: `2px solid ${currentZone.color}60`,
                  }}
                >
                  <Heart
                    className="w-10 h-10 transition-colors duration-500"
                    style={{ color: currentZone.color }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums">
                    {currentHeartRate}
                  </span>
                  <span className="text-base font-semibold text-slate-400">BPM</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentZone.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {currentZone.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Zone Definition & Benefit Text */}
            <div
              className="p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: `${currentZone.color}10`,
                borderColor: `${currentZone.color}30`,
              }}
            >
              <p className="font-semibold text-white">{currentZone.description}</p>
              <p className="text-slate-300 mt-1">
                <span className="text-slate-400">Target Range:</span> {currentZone.minHr} - {currentZone.maxHr} BPM (
                {currentZone.percentageRange})
              </p>
            </div>
          </div>

          {/* Right Column: Live Chart & Zone Distribution */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {/* Live Recharts Line Graph for HRV / Telemetry */}
            <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-300">
                    Live Session Telemetry (Recharts)
                  </span>
                </div>

                <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-md border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setChartMode('hrv')}
                    className={`px-2 py-0.5 rounded-sm font-medium transition-colors ${
                      chartMode === 'hrv'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    HRV (RR Interval)
                  </button>
                  <button
                    onClick={() => setChartMode('bpm')}
                    className={`px-2 py-0.5 rounded-sm font-medium transition-colors ${
                      chartMode === 'bpm'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Heart Rate (BPM)
                  </button>
                </div>
              </div>

              <div className="w-full h-36 relative">
                {(() => {
                  const displayData =
                    rechartsData.length >= 2
                      ? rechartsData
                      : [
                          { time: '00:00', second: 0, hrv: rrIntervalMs ?? Math.round(60000 / currentHeartRate), heartRate: currentHeartRate },
                          { time: '00:01', second: 1, hrv: (rrIntervalMs ?? Math.round(60000 / currentHeartRate)) + 14, heartRate: currentHeartRate },
                          { time: '00:02', second: 2, hrv: (rrIntervalMs ?? Math.round(60000 / currentHeartRate)) - 10, heartRate: currentHeartRate },
                          { time: '00:03', second: 3, hrv: (rrIntervalMs ?? Math.round(60000 / currentHeartRate)) + 5, heartRate: currentHeartRate },
                        ];

                  return (
                    <ResponsiveContainer width="100%" height={144}>
                      <LineChart data={displayData} margin={{ top: 8, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={chartMode === 'hrv' ? ['auto', 'auto'] : [minChartHr, maxChartHr]}
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          unit={chartMode === 'hrv' ? 'ms' : ''}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="p-2 bg-slate-900 border border-slate-700 rounded-md shadow-lg text-[11px] text-slate-200">
                                  <p className="font-semibold text-emerald-400">Elapsed: {data.time}</p>
                                  <p className="mt-0.5 text-white">
                                    HRV (RR): <strong className="font-mono text-emerald-300">{data.hrv} ms</strong>
                                  </p>
                                  <p className="text-slate-400">
                                    Heart Rate: <span className="font-mono text-white">{data.heartRate} BPM</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {chartMode === 'hrv' ? (
                          <Line
                            type="monotone"
                            dataKey="hrv"
                            name="HRV (RR Interval)"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="heartRate"
                            name="Heart Rate"
                            stroke={currentZone.color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Target HR Zone Distribution Bar */}
            <div className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-300">Target Heart Rate Zones</span>
                <span className="text-slate-400 font-mono">HRR: {hrrPercentage}%</span>
              </div>

              {/* 5-Zone Spectrum Bar with Pointer */}
              <div className="relative pt-2">
                <div className="h-3 w-full rounded-full flex overflow-hidden bg-slate-800">
                  <div className="flex-1 bg-blue-500" title="Zone 1 (50-60%)" />
                  <div className="flex-1 bg-emerald-500" title="Zone 2 (60-70%)" />
                  <div className="flex-1 bg-amber-500" title="Zone 3 (70-80%)" />
                  <div className="flex-1 bg-orange-500" title="Zone 4 (80-90%)" />
                  <div className="flex-1 bg-rose-500" title="Zone 5 (90-100%)" />
                </div>

                {/* Pointer indicator along spectrum */}
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                  style={{
                    left: `${Math.max(2, Math.min(98, hrrPercentage))}%`,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: currentZone.color }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>Z1: {zones.zone1.minHr}</span>
                <span>Z2: {zones.zone2.minHr}</span>
                <span>Z3: {zones.zone3.minHr}</span>
                <span>Z4: {zones.zone4.minHr}</span>
                <span>Z5: {zones.zone5.minHr}+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-100">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              Active Duration
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono mt-1 text-white tabular-nums">
              {formatDuration(durationSeconds)}
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              Calories Burned
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono mt-1 text-white tabular-nums">
              {caloriesBurned} <span className="text-xs font-normal text-slate-400">kcal</span>
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              Heart Rate Reserve
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono mt-1 text-white tabular-nums">
              {hrrPercentage}%
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
              RR Interval / HRV
            </span>
            <p className="text-xl sm:text-2xl font-bold font-mono mt-1 text-white tabular-nums">
              {rrIntervalMs ?? Math.round(60000 / currentHeartRate)}{' '}
              <span className="text-xs font-normal text-slate-400">ms</span>
            </p>
          </div>
        </div>

        {/* Primary Controls Dock */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-md flex items-center gap-2 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" aria-hidden="true" />
                Start Workout
              </button>
            ) : (
              <>
                <button
                  onClick={handleTogglePause}
                  className={`px-4 py-2.5 font-semibold text-sm rounded-lg border transition-all flex items-center gap-2 ${
                    isPaused
                      ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                      : 'bg-amber-600/20 text-amber-300 border-amber-600/40 hover:bg-amber-600/30'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" aria-hidden="true" />
                      Pause
                    </>
                  )}
                </button>

                <button
                  onClick={handleRecordLap}
                  disabled={isPaused}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" aria-hidden="true" />
                  Lap / Set ({laps.length})
                </button>

                <button
                  onClick={handleFinish}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-lg transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-white" aria-hidden="true" />
                  Finish &amp; Save
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-sm font-mono text-[11px]">
              Space
            </kbd>{' '}
            Play/Pause ·{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded-sm font-mono text-[11px]">
              L
            </kbd>{' '}
            Lap
          </div>
        </div>
      </div>

      {/* Structured Exercise In-Progress Box (if plan active) */}
      {activePlan && currentExercise && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Exercise Focus
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentExercise.name}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700">
                Set {currentSet} of {currentExercise.sets}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-emerald-400 rounded-lg text-xs font-semibold border border-slate-700">
                Target: {zones[currentExercise.targetZone].name}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2">
            <p className="leading-relaxed">
              <strong className="text-white">Instruction:</strong> {currentExercise.instructions}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 text-slate-400">
              <span className="font-semibold text-slate-300">Target Reps/Duration:</span>
              <span>{currentExercise.repsOrDuration}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-300">Primary Muscles:</span>
              <span>{currentExercise.muscleGroups.join(', ')}</span>
            </div>
          </div>

          {/* Rest Timer display if resting */}
          {isResting && (
            <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Rest Interval Active
                </p>
                <p className="text-xs text-slate-300 mt-0.5">Focus on slow nasal exhales to lower heart rate.</p>
              </div>
              <span className="text-3xl font-black font-mono text-emerald-300 tabular-nums">
                {restRemaining}s
              </span>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAdvanceExercise}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Complete Set &amp; Next &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Laps List (if any recorded) */}
      {laps.length > 0 && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recorded Splits &amp; Laps ({laps.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {laps.map((lapSec, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between"
              >
                <span className="font-medium text-slate-400">Lap {idx + 1}</span>
                <span className="font-mono font-bold text-white">{formatDuration(lapSec)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
