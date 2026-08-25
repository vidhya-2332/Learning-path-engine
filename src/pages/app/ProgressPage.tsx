import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, CheckCircle2, Play, Circle, ArrowRight, Award } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSkills,
  fetchPrerequisites,
  fetchProfile,
  fetchStudentSkills,
  fetchRoleSkills,
  fetchProgress,
  fetchAssessmentResults,
  upsertProgress,
} from '@/lib/data';
import { calculateCareerReadiness } from '@/lib/engine';
import type { Skill, CareerReadiness, LearningProgress, AssessmentResult } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';

const STATUS_OPTIONS: { value: LearningProgress['status']; progress: number; label: string }[] = [
  { value: 'not_started', progress: 0, label: 'Not Started' },
  { value: 'in_progress', progress: 50, label: 'In Progress' },
  { value: 'completed', progress: 100, label: 'Completed' },
];

export function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);

  const loadAll = async () => {
    if (!user) return;
    const [allSkills, prereqs, profile, studentSkills, progress, results] = await Promise.all([
      fetchSkills(),
      fetchPrerequisites(),
      fetchProfile(user.id),
      fetchStudentSkills(user.id),
      fetchProgress(user.id),
      fetchAssessmentResults(user.id),
    ]);
    setSkills(allSkills);
    setProgressList(progress);
    setAssessmentResults(results);

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
    const result = calculateCareerReadiness(roleSkills, studentSkills, prereqs, allSkills);
    setReadiness(result);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadAll();
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleUpdateProgress = async (skillId: string, status: LearningProgress['status'], progressValue: number) => {
    if (!user) return;
    setUpdating(skillId);
    try {
      await upsertProgress(user.id, skillId, status, progressValue);
      setProgressList((prev) => {
        const existing = prev.find((p) => p.skill_id === skillId);
        if (existing) {
          return prev.map((p) => p.skill_id === skillId ? { ...p, status, progress: progressValue } : p);
        }
        return [...prev, { id: '', user_id: user.id, skill_id: skillId, status, progress: progressValue, updated_at: new Date().toISOString() }];
      });
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  };

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;

  if (loading) return <LoadingState message="Loading your progress..." />;

  if (!hasProfile) {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="No target role selected"
        description="Select a career role to track your progress."
        action={<button onClick={() => navigate('/app/profile')} className="btn-primary">Set Up Profile</button>}
      />
    );
  }

  if (!hasSkills) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="No skill data yet"
        description="Complete the assessment to start tracking progress."
        action={<button onClick={() => navigate('/app/assessment')} className="btn-primary">Take Assessment</button>}
      />
    );
  }

  const completed = progressList.filter((p) => p.status === 'completed').length;
  const inProgress = progressList.filter((p) => p.status === 'in_progress').length;
  const totalSkills = readiness ? readiness.strong.length + readiness.moderate.length + readiness.weak.length + readiness.missing.length : 0;

  const statusIcon = (status: LearningProgress['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-success-400" />;
      case 'in_progress': return <Play className="h-4 w-4 text-primary-400" />;
      default: return <Circle className="h-4 w-4 text-neutral-600" />;
    }
  };

  const getProgress = (skillId: string): LearningProgress | undefined =>
    progressList.find((p) => p.skill_id === skillId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Progress Tracking</h1>
        <p className="text-sm text-neutral-500">Track your skill improvement and learning milestones.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-success-400" />
            <span className="text-xs text-neutral-500">Completed</span>
          </div>
          <div className="text-2xl font-bold text-white">{completed}</div>
          <div className="text-xs text-neutral-600">of {totalSkills} skills</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Play className="h-4 w-4 text-primary-400" />
            <span className="text-xs text-neutral-500">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">{inProgress}</div>
          <div className="text-xs text-neutral-600">actively learning</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-accent-400" />
            <span className="text-xs text-neutral-500">Readiness</span>
          </div>
          <div className="text-2xl font-bold text-primary-400">{readiness?.overall ?? 0}%</div>
          <div className="text-xs text-neutral-600">target: {readiness?.target ?? 0}%</div>
        </div>
      </div>

      {/* Readiness trend */}
      {readiness && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Career Readiness</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>Before Assessment</span>
                <span>{readiness.before}%</span>
              </div>
              <ProgressBar value={readiness.before} barClassName="bg-neutral-600" size="sm" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>Current</span>
                <span>{readiness.overall}%</span>
              </div>
              <ProgressBar value={readiness.overall} barClassName="bg-success-500" size="sm" />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>Target</span>
                <span>{readiness.target}%</span>
              </div>
              <ProgressBar value={readiness.target} barClassName="bg-primary-500" size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Skill progress list */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Skill Learning Status</h2>
        <div className="space-y-3">
          {readiness && [...readiness.weak, ...readiness.missing, ...readiness.moderate].map((gap) => {
            const prog = getProgress(gap.skill_id);
            return (
              <div key={gap.skill_id} className="flex items-center gap-3 py-2 border-b border-neutral-800/60 last:border-0">
                <div className="shrink-0">{statusIcon(prog?.status ?? 'not_started')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-200">{skillName(gap.skill_id)}</span>
                    <Badge variant={gap.category === 'missing' ? 'error' : gap.category === 'weak' ? 'warning' : 'info'}>
                      {gap.category}
                    </Badge>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={prog?.progress ?? 0} size="sm" showLabel />
                  </div>
                </div>
                <div className="shrink-0 flex gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleUpdateProgress(gap.skill_id, opt.value, opt.progress)}
                      disabled={updating === gap.skill_id}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        prog?.status === opt.value
                          ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                          : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment history */}
      {assessmentResults.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Assessment History</h2>
          <div className="space-y-2">
            {assessmentResults.slice(0, 10).map((result) => (
              <div key={result.id} className="flex items-center gap-3 text-sm">
                <span className="text-neutral-300 flex-1">{skillName(result.skill_id)}</span>
                <span className="text-neutral-500 text-xs">{result.correct_answers}/{result.total_questions} correct</span>
                <Badge variant={result.score >= 80 ? 'success' : result.score >= 50 ? 'warning' : 'error'}>
                  {result.score}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => navigate('/app/path')} className="btn-primary">
          View Learning Path
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
