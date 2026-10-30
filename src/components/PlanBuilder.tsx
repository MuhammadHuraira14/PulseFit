import React, { useState } from 'react';
import {
  Calendar,
  Zap,
  Flame,
  Dumbbell,
  Heart,
  ChevronRight,
  Clock,
  CheckCircle,
  Play,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { WorkoutPlan, UserProfile, HRZone } from '../types/fitness';
import { DEFAULT_WORKOUT_PLANS } from '../data/defaultPlans';
import { calculateHRZones, calculateMaxHeartRate } from '../utils/fitnessMath';

interface Props {
  profile: UserProfile;
  onSelectPlanForWorkout: (plan: WorkoutPlan) => void;
  activePlanId?: string;
}

export const PlanBuilder: React.FC<Props> = ({
  profile,
  onSelectPlanForWorkout,
  activePlanId,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<WorkoutPlan['goal']>(profile.goal || 'cardio');
  const [selectedLevel, setSelectedLevel] = useState<WorkoutPlan['level']>(profile.fitnessLevel || 'intermediate');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(DEFAULT_WORKOUT_PLANS[0].id);

  // Compute user's custom HR zones for preview
  const effectiveMaxHr = profile.maxHrCustom || calculateMaxHeartRate(profile.age);
  const userZones = calculateHRZones(profile.restingHr, effectiveMaxHr);

  const filteredPlans = DEFAULT_WORKOUT_PLANS.filter((p) => {
    return p.goal === selectedGoal || p.level === selectedLevel;
  });

  const activeDisplayPlan =
    DEFAULT_WORKOUT_PLANS.find((p) => p.id === selectedPlanId) || DEFAULT_WORKOUT_PLANS[0];

  return (
    <div className="space-y-6">
      {/* Header and Personalization Controls */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Targeted Conditioning
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Personalized Heart-Rate-Calibrated Plans
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Protocols calibrated to your age ({profile.age}y), resting HR ({profile.restingHr} BPM), and max HR ({effectiveMaxHr} BPM).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Goal:</span>
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setSelectedGoal('cardio')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedGoal === 'cardio'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cardio
              </button>
              <button
                onClick={() => setSelectedGoal('hypertrophy')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedGoal === 'hypertrophy'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hypertrophy
              </button>
              <button
                onClick={() => setSelectedGoal('recovery')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedGoal === 'recovery'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Recovery
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEFAULT_WORKOUT_PLANS.map((plan) => {
            const isSelected = plan.id === activeDisplayPlan.id;
            const isCurrentActive = plan.id === activePlanId;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                {isCurrentActive && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-semibold rounded-md">
                    In Tracker
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span className="capitalize">{plan.level}</span>
                    <span aria-hidden="true">·</span>
                    <span>{plan.estimatedMinutes} mins</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{plan.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{plan.exercises.length} Exercises</span>
                  <span className="text-emerald-400 font-medium">View &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Plan Details & Exercise Breakdown */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Calibrated Routine Breakdown</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {activeDisplayPlan.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {activeDisplayPlan.description}
            </p>
          </div>

          <button
            onClick={() => onSelectPlanForWorkout(activeDisplayPlan)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md flex items-center gap-2 transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" aria-hidden="true" />
            Start This Workout in Tracker
          </button>
        </div>

        {/* Plan Parameters Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Estimated Time:</span>
            <p className="text-white font-semibold mt-0.5">{activeDisplayPlan.estimatedMinutes} Minutes</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Recommended Frequency:</span>
            <p className="text-white font-semibold mt-0.5">{activeDisplayPlan.frequencyPerWeek}x / week</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Primary Heart Zones:</span>
            <p className="text-emerald-400 font-semibold mt-0.5">
              {activeDisplayPlan.targetZones.map((z) => userZones[z].name.split(':')[0]).join(', ')}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Required Equipment:</span>
            <p className="text-white font-semibold mt-0.5">{activeDisplayPlan.equipment.join(', ')}</p>
          </div>
        </div>

        {/* Exercises List */}
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Curated Exercise Protocol ({activeDisplayPlan.exercises.length} Steps)
          </h4>

          {activeDisplayPlan.exercises.map((exercise, index) => {
            const targetZoneInfo = userZones[exercise.targetZone];

            return (
              <div
                key={exercise.id}
                className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-white">{exercise.name}</h5>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {exercise.instructions}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>Muscles: {exercise.muscleGroups.join(', ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>Rest: {exercise.restSeconds}s</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <span className="px-2.5 py-1 text-xs font-bold text-white bg-slate-800 rounded-md border border-slate-700">
                    {exercise.sets} sets × {exercise.repsOrDuration}
                  </span>
                  <div
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-md border"
                    style={{
                      backgroundColor: `${targetZoneInfo.color}15`,
                      color: targetZoneInfo.color,
                      borderColor: `${targetZoneInfo.color}40`,
                    }}
                  >
                    Target: {targetZoneInfo.minHr} - {targetZoneInfo.maxHr} BPM
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
