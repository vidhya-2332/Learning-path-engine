import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Route, Lock, CheckCircle2, Play, Sparkles, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSkills,
  fetchPrerequisites,
  fetchProfile,
  fetchStudentSkills,
  fetchRoleSkills,
  fetchProgress,
  generateAndSaveLearningPath,
} from '@/lib/data';
import { generateLearningPath } from '@/lib/engine';
import type { Skill, RecommendationResult, PathItemStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

export function LearningPathPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [path, setPath] = useState<RecommendationResult[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);

  const loadPath = async () => {
    if (!user) return;
    const [allSkills, prereqs, profile, studentSkills, progress] = await Promise.all([
      fetchSkills(),
      fetchPrerequisites(),
      fetchProfile(user.id),
      fetchStudentSkills(user.id),
      fetchProgress(user.id),
    ]);
    setSkills(allSkills);
    if (!profile?.target_role_id) {
      setHasProfile(false);
      return;
    }
    setHasProfile(true);
    if (studentSkills.length === 0) {
      setHasSkills(false);
      return;
    }
    setHasSkills(true);
    const roleSkills = await fetchRoleSkills(profile.target_role_id);
    const ordered = generateLearningPath(roleSkills, studentSkills, prereqs, allSkills, progress);
    setPath(ordered);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadPath();
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleRegenerate = async () => {
    if (!user || !hasProfile) return;
    setRegenerating(true);
    try {
      const [allSkills, prereqs, profile, studentSkills, progress] = await Promise.all([
        fetchSkills(),
        fetchPrerequisites(),
        fetchProfile(user.id),
        fetchStudentSkills(user.id),
        fetchProgress(user.id),
      ]);
      if (!profile?.target_role_id) return;
      const roleSkills = await fetchRoleSkills(profile.target_role_id);
      await generateAndSaveLearningPath(
        user.id, profile.target_role_id, roleSkills, studentSkills, prereqs, allSkills, progress,
      );
      await loadPath();
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  };

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;
  const skillDesc = (id: string) => skills.find((s) => s.id === id)?.description ?? '';

  if (loading) return <LoadingState message="Building your learning path..." />;

  if (!hasProfile) {
    return (
      <EmptyState
        icon={<Route className="h-8 w-8" />}
        title="No target role selected"
        description="Select a career role to generate your learning path."
        action={<button onClick={() => navigate('/app/profile')} className="btn-primary">Set Up Profile</button>}
      />
    );
  }

  if (!hasSkills) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="Assessment required"
        description="Complete the assessment to generate your personalized learning path."
        action={<button onClick={() => navigate('/app/assessment')} className="btn-primary">Take Assessment</button>}
      />
    );
  }

  if (path.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-8 w-8" />}
        title="No learning path to generate"
        description="You have met all requirements for your target role."
      />
    );
  }

  const statusConfig: Record<PathItemStatus, { variant: 'success' | 'default' | 'warning' | 'error' | 'neutral'; label: string; icon: React.ReactNode; dot: string }> = {
    completed: { variant: 'success', label: 'Completed', icon: <CheckCircle2 className="h-4 w-4" />, dot: 'bg-success-500' },
    current: { variant: 'default', label: 'Current', icon: <Play className="h-4 w-4" />, dot: 'bg-primary-500' },
    recommended: { variant: 'warning', label: 'Recommended', icon: <Sparkles className="h-4 w-4" />, dot: 'bg-warning-500' },
    locked: { variant: 'error', label: 'Locked', icon: <Lock className="h-4 w-4" />, dot: 'bg-error-500' },
    upcoming: { variant: 'neutral', label: 'Upcoming', icon: <Clock className="h-4 w-4" />, dot: 'bg-neutral-600' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Your Learning Path</h1>
          <p className="text-sm text-neutral-500">
            An ordered, prerequisite-aware sequence generated from your skill
            profile and role requirements.
          </p>
        </div>
        <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary">
          <RefreshCw className={cn('h-4 w-4', regenerating && 'animate-spin')} />
          Recalculate
        </button>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800" />

        <div className="space-y-1">
          {path.map((item, idx) => {
            const cfg = statusConfig[item.status];
            const isLast = idx === path.length - 1;
            return (
              <div key={item.skill_id} className="relative pl-16 py-3 group">
                {/* Node */}
                <div
                  className={cn(
                    'absolute left-3 top-4 h-7 w-7 rounded-full flex items-center justify-center border-2 border-neutral-950 transition-all duration-300',
                    cfg.dot,
                  )}
                >
                  <span className="text-xs font-mono font-bold text-white">{idx + 1}</span>
                </div>

                <div className={cn(
                  'card p-4 transition-all duration-200',
                  item.status === 'locked' && 'opacity-60',
                  item.status === 'completed' && 'border-success-500/20',
                  item.status === 'current' && 'border-primary-500/30 bg-primary-500/5',
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{skillName(item.skill_id)}</h3>
                        <Badge variant={cfg.variant}>
                          {cfg.icon}
                          {cfg.label}
                        </Badge>
                      </div>
                      {skillDesc(item.skill_id) && (
                        <p className="text-xs text-neutral-500">{skillDesc(item.skill_id)}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-primary-400 font-mono">{item.priority_score}</div>
                      <div className="text-xs text-neutral-600">priority</div>
                    </div>
                  </div>

                  {item.status === 'locked' && item.explanation.reasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/60">
                      <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                        <Lock className="h-3 w-3" />
                        {item.explanation.reasons.find((r) => r.includes('Prerequisites')) ?? 'Complete prerequisites first'}
                      </div>
                    </div>
                  )}

                  {item.status === 'current' && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/60">
                      <button
                        onClick={() => navigate('/app/progress')}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1"
                      >
                        Track Progress
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="absolute left-6 top-11 -translate-x-1/2 h-3 w-px bg-neutral-800" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
