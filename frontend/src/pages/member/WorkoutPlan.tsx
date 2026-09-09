import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, RefreshCw, ChevronDown, ChevronUp, Dumbbell, Clock, Flame, Target, Info, Play, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { getExerciseGuide, getExerciseImage, getYouTubeEmbedUrl } from '../../data/exerciseLibrary';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: '#d1fae5', text: '#065f46' },
  Intermediate: { bg: '#dbeafe', text: '#1e40af' },
  Advanced:     { bg: '#fee2e2', text: '#991b1b' },
};

const DAYS_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const JS_DAY_MAP: Record<number, string> = { 1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday',6:'Saturday',0:'Sunday' };

function ExerciseCard({ ex }: { ex: any }) {
  const [tab, setTab] = useState<'form' | 'video'>('form');
  const [expanded, setExpanded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Enrich exercise data from our library
  const guide = getExerciseGuide(ex.name, ex.category || ex.muscleGroup);
  const img = guide?.media.thumbnail || getExerciseImage(ex.name, ex.category || ex.muscleGroup);
  const videoId = guide?.media.youtubeId;

  // Merge library data with AI-provided data (AI data takes priority if present)
  const formSteps = ex.formSteps?.length > 0 ? ex.formSteps : (guide?.formSteps || []);
  const commonMistakes = ex.commonMistakes?.length > 0 ? ex.commonMistakes : (guide?.commonMistakes || []);
  const breathingTip = ex.breathingTip || guide?.breathingTip;
  const difficulty = ex.difficulty || guide?.difficulty || 'Intermediate';
  const muscleGroup = ex.muscleGroup || guide?.muscleGroup;
  const equipment = ex.equipment || guide?.equipment;

  const diff = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS['Intermediate'];
  const hasGuide = formSteps.length > 0 || commonMistakes.length > 0 || breathingTip;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
      {/* Image / Video header */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        {/* Background image always present */}
        <img src={img} alt={ex.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%)' }} />

        {/* Video tab active: show iframe */}
        {tab === 'video' && videoId && (
          <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
            {!videoLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                  <p className="text-white text-sm font-semibold">Loading demo...</p>
                </div>
              </div>
            )}
            <iframe
              src={getYouTubeEmbedUrl(videoId)}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`${ex.name} demo`}
              onLoad={() => setVideoLoaded(true)}
              style={{ opacity: videoLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
            />
          </div>
        )}

        {/* Name + difficulty */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3">
          <div className="flex items-end justify-between gap-2">
            <p className="text-white font-bold text-base leading-tight drop-shadow">{ex.name}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: diff.bg, color: diff.text }}>{difficulty}</span>
          </div>
        </div>

        {/* Tab switcher overlay (top right) */}
        {videoId && (
          <div className="absolute top-2.5 right-2.5 z-20 flex gap-1 rounded-xl overflow-hidden backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <button
              onClick={() => setTab('form')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ background: tab === 'form' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white' }}>
              <BookOpen className="w-3 h-3" /> Guide
            </button>
            <button
              onClick={() => { setTab('video'); setVideoLoaded(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ background: tab === 'video' ? '#ef4444' : 'transparent', color: 'white' }}>
              <Play className="w-3 h-3" /> Demo
            </button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x" style={{ borderBottom: '1px solid var(--border)', borderColor: 'var(--border)' }}>
        {[
          { label: 'Sets', value: ex.sets },
          { label: 'Reps', value: ex.reps },
          { label: 'Rest', value: ex.rest },
        ].map(s => (
          <div key={s.label} className="py-2.5 text-center">
            <p className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div className="px-3 py-2.5 flex flex-wrap gap-x-4 gap-y-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {muscleGroup && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Targets: </span>{muscleGroup}
          </span>
        )}
        {equipment && (
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Equipment: </span>{equipment}
          </span>
        )}
      </div>

      {/* Expand toggle */}
      {hasGuide && (
        <button
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-base)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => setExpanded(o => !o)}>
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Form guide & tips
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {/* Instructions */}
      {expanded && hasGuide && (
        <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Step-by-step form */}
          {formSteps.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-tertiary)' }}>How to perform</p>
              <ol className="space-y-2">
                {formSteps.map((step: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 text-white"
                      style={{ background: 'var(--accent)' }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Common mistakes */}
          {commonMistakes.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9a3412' }}>Common Mistakes</p>
              <ul className="space-y-1">
                {commonMistakes.map((m: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: '#9a3412' }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breathing tip */}
          {breathingTip && (
            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span className="text-base shrink-0">🌬️</span>
              <p className="text-sm" style={{ color: '#1e40af' }}>{breathingTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkoutPlan() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const todayName = JS_DAY_MAP[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: planData, isLoading } = useQuery<any>({
    queryKey: ['workout-plan'],
    queryFn: () => api.get('/ai/workout-plan').then(r => {
      const data = r.data;
      // Auto-select today's workout day, or first available
      if (data?.plan?.weeklyPlan) {
        const days = data.plan.weeklyPlan.map((d: any) => d.day);
        const today = days.find((d: string) => d === todayName) || days[0];
        setSelectedDay((prev) => prev ?? today);
      }
      return data;
    }),
    retry: false,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/ai/workout-plan', {}),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['workout-plan'] });
      toast.success('Workout plan generated!');
      if (data?.weeklyPlan) {
        const days = data.weeklyPlan.map((d: any) => d.day);
        const today = days.find((d: string) => d === todayName) || days[0];
        setSelectedDay(today);
      }
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate plan'),
  });

  const plan = planData?.plan;

  // Ordered days (only training days in the plan)
  const planDays: any[] = useMemo(() => {
    if (!plan?.weeklyPlan) return [];
    return [...plan.weeklyPlan].sort(
      (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
    );
  }, [plan]);

  const activeDay = planDays.find(d => d.day === selectedDay) || planDays[0];
  const isToday = activeDay?.day === todayName;
  const isRestDay = plan?.restDays?.includes(todayName) && !planDays.find(d => d.day === todayName);

  return (
    <div className="max-w-2xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Workout Plan</h1>
          <p className="page-subtitle">AI-personalised · {format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <button className="btn-primary shrink-0 gap-2" onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
            : plan ? <><RefreshCw className="w-4 h-4" /> Refresh Plan</> : <><Zap className="w-4 h-4" /> Generate Plan</>}
        </button>
      </div>

      {/* Empty state */}
      {isLoading && (
        <div className="card py-16 text-center">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
            <Dumbbell className="w-6 h-6 animate-pulse" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading your plan...</p>
        </div>
      )}

      {!isLoading && !plan && (
        <div className="card py-14 text-center">
          <div className="relative w-36 h-28 mx-auto mb-5 rounded-2xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No workout plan yet</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Generate a personalised plan based on your goals, fitness level, and available equipment at {user?.gymName}.
          </p>
          <button className="btn-primary gap-2" onClick={() => generate.mutate()} disabled={generate.isPending}>
            <Zap className="w-4 h-4" /> Generate My Plan
          </button>
        </div>
      )}

      {plan && (
        <>
          {/* Generated date */}
          {planData?.generatedAt && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Last updated {format(new Date(planData.generatedAt), 'dd MMM yyyy, hh:mm a')}
            </p>
          )}

          {/* Day picker */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {planDays.map(day => {
              const isActiveDay = day.day === activeDay?.day;
              const isTodayDay = day.day === todayName;
              return (
                <button key={day.day} onClick={() => setSelectedDay(day.day)}
                  className="shrink-0 flex flex-col items-center rounded-xl px-3.5 py-2.5 transition-all duration-15"
                  style={{
                    background: isActiveDay ? 'var(--accent)' : isTodayDay ? 'rgba(var(--accent-rgb),0.08)' : 'var(--bg-surface)',
                    border: isActiveDay ? 'none' : `1px solid ${isTodayDay ? 'rgba(var(--accent-rgb),0.25)' : 'var(--border)'}`,
                    boxShadow: isActiveDay ? '0 2px 8px rgba(var(--accent-rgb),0.35)' : 'var(--shadow-xs)',
                    minWidth: 72,
                  }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: isActiveDay ? 'rgba(255,255,255,0.7)' : isTodayDay ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {day.day.slice(0, 3)}
                  </p>
                  <p className="text-sm font-bold mt-0.5"
                    style={{ color: isActiveDay ? '#fff' : 'var(--text-primary)' }}>
                    {day.focus?.split(' ')[0]}
                  </p>
                  {isTodayDay && !isActiveDay && (
                    <span className="mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}>Today</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Today is rest day notice */}
          {isRestDay && (
            <div className="card flex items-center gap-4" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#dbeafe' }}>
                <span className="text-2xl">🛋️</span>
              </div>
              <div>
                <p className="font-bold" style={{ color: '#1e40af' }}>Rest Day — {todayName}</p>
                <p className="text-sm" style={{ color: '#3b82f6' }}>Recovery is just as important as training. Stretch, sleep, hydrate.</p>
              </div>
            </div>
          )}

          {/* Active day workout */}
          {activeDay && (
            <div className="space-y-4">
              {/* Day header card */}
              <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 120 }}>
                <img
                  src={`https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)' }} />
                <div className="relative p-5 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{activeDay.day}</span>
                      {isToday && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--accent)' }}>Today</span>}
                    </div>
                    <h2 className="text-white text-xl font-black">{activeDay.focus}</h2>
                    <p className="text-white/60 text-sm">{activeDay.theme}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-white text-sm font-semibold">{activeDay.estimatedDuration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-white text-sm font-semibold">{activeDay.caloriesBurned || '300-400'} kcal</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Target className="w-3.5 h-3.5 text-white/50" />
                      <span className="text-white text-sm font-semibold">{activeDay.intensity}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warmup */}
              {activeDay.warmup && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
                  <span className="text-xl shrink-0">🔥</span>
                  <div>
                    <p className="text-sm font-bold text-yellow-800">Warm-up</p>
                    <p className="text-sm text-yellow-700 mt-0.5">{activeDay.warmup}</p>
                  </div>
                </div>
              )}

              {/* Exercises */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {activeDay.exercises?.length} Exercises
                </p>
                <div className="space-y-3">
                  {activeDay.exercises?.map((ex: any, i: number) => (
                    <ExerciseCard key={i} ex={ex} />
                  ))}
                </div>
              </div>

              {/* Cooldown */}
              {activeDay.cooldown && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <span className="text-xl shrink-0">❄️</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Cool-down</p>
                    <p className="text-sm text-emerald-700 mt-0.5">{activeDay.cooldown}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weekly summary */}
          <div className="card space-y-4">
            <h3 className="section-title">Weekly Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl py-3" style={{ background: 'var(--bg-base)' }}>
                <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{planDays.length}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>Training Days</p>
              </div>
              <div className="rounded-xl py-3" style={{ background: 'var(--bg-base)' }}>
                <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>
                  {planDays.reduce((acc, d) => acc + (d.exercises?.length || 0), 0)}
                </p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>Total Exercises</p>
              </div>
              <div className="rounded-xl py-3" style={{ background: 'var(--bg-base)' }}>
                <p className="text-2xl font-black" style={{ color: '#10b981' }}>
                  {plan.restDays?.length ?? 7 - planDays.length}
                </p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-tertiary)' }}>Rest Days</p>
              </div>
            </div>

            {plan.generalAdvice && (
              <div className="rounded-xl p-4" style={{ background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid rgba(var(--accent-rgb),0.15)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent)' }}>Trainer Advice</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{plan.generalAdvice}</p>
              </div>
            )}

            {plan.nutritionTip && (
              <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1 text-emerald-700">Nutrition Tip</p>
                <p className="text-sm text-emerald-800">{plan.nutritionTip}</p>
              </div>
            )}

            {plan.progressionPlan && (
              <div className="rounded-xl p-4" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1 text-purple-700">4-Week Progression</p>
                <p className="text-sm text-purple-800">{plan.progressionPlan}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
