import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, ArrowRight, RefreshCw } from 'lucide-react';
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
import { calculateCareerReadiness } from '@/lib/engine';
import type { Skill, RoleSkill, SkillPrerequisite, StudentSkill, LearningProgress, CareerReadiness } from '@/lib/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge, ImportanceBadge } from '@/components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';

export function IntelligencePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [allSkills, prereqs, profile, studentSkills] = await Promise.all([
          fetchSkills(),
          fetchPrerequisites(),
          fetchProfile(user.id),
          fetchStudentSkills(user.id),
        ]);
        setSkills(allSkills);
        if (!profile?.target_role_id) {
          setHasProfile(false);
          setLoading(false);
          return;
        }
        setHasProfile(true);
        if (studentSkills.length === 0) {
          setHasSkills(false);
          setLoading(false);
          return;
        }
        setHasSkills(true);
        const roleSkills = await fetchRoleSkills(profile.target_role_id);
        const progress = await fetchProgress(user.id);
        const result = calculateCareerReadiness(roleSkills, studentSkills, prereqs, allSkills);
        setReadiness(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load intelligence data');
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
      navigate('/app/path');
    } catch {
      // ignore
    } finally {
      setRegenerating(false);
    }
  };

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;

  if (loading) return <LoadingState message="Analyzing your skill profile..." />;
  if (error) return <ErrorState message={error} />;

  if (!hasProfile) {
    return (
      <EmptyState
        icon={<Target className="h-8 w-8" />}
        title="No target role selected"
        description="Select a career role in your profile to see your skill intelligence."
        action={<button onClick={() => navigate('/app/profile')} className="btn-primary">Set Up Profile</button>}
      />
    );
  }

  if (!hasSkills) {
    return (
      <EmptyState
        icon={<Brain className="h-8 w-8" />}
        title="No skill data yet"
        description="Complete the assessment so the engine can analyze your skill gaps."
        action={<button onClick={() => navigate('/app/assessment')} className="btn-primary">Take Assessment</button>}
      />
    );
  }

  if (!readiness) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Skill Intelligence</h1>
          <p className="text-sm text-neutral-500">Your career readiness analysis</p>
        </div>
        <button onClick={handleRegenerate} disabled={regenerating} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
          Regenerate Path
        </button>
      </div>

      {/* Overall Readiness */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <svg className="h-24 w-24 -rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-neutral-800" />
              <circle
                cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6"
                className="text-primary-500 transition-all duration-700"
                strokeDasharray={`${(readiness.overall / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{readiness.overall}%</span>
              <span className="text-xs text-neutral-500">Ready</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-neutral-300 mb-3">Overall Career Readiness</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Before</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold text-neutral-400">{readiness.before}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Current</div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-success-400" />
                  <span className="text-lg font-semibold text-success-400">{readiness.overall}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Target</div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary-400" />
                  <span className="text-lg font-semibold text-primary-400">{readiness.target}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Gaps */}
      {readiness.critical_gaps.length > 0 && (
        <div className="card p-6 border-error-500/20 bg-error-500/5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-error-400" />
            <h2 className="section-title">Critical Skill Gaps</h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            High-importance skills with large gaps that significantly impact your career readiness.
          </p>
          <div className="space-y-3">
            {readiness.critical_gaps.map((gap) => (
              <div key={gap.skill_id} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className="text-sm font-medium text-neutral-200">{skillName(gap.skill_id)}</span>
                </div>
                <div className="flex-1">
                  <ProgressBar
                    value={gap.current_level}
                    barClassName="bg-error-500"
                    showLabel
                  />
                </div>
                <Badge variant="error">Gap: {gap.gap}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Strong */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-success-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Strong Skills</h3>
            <Badge variant="success">{readiness.strong.length}</Badge>
          </div>
          {readiness.strong.length === 0 ? (
            <p className="text-xs text-neutral-600">No strong skills yet. Keep learning!</p>
          ) : (
            <div className="space-y-2.5">
              {readiness.strong.map((g) => (
                <div key={g.skill_id} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-300 w-28 shrink-0 truncate">{skillName(g.skill_id)}</span>
                  <ProgressBar value={g.current_level} barClassName="bg-success-500" showLabel size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-4 w-4 text-warning-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Weak Skills</h3>
            <Badge variant="warning">{readiness.weak.length}</Badge>
          </div>
          {readiness.weak.length === 0 ? (
            <p className="text-xs text-neutral-600">No weak skills. Great progress!</p>
          ) : (
            <div className="space-y-2.5">
              {readiness.weak.map((g) => (
                <div key={g.skill_id} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-300 w-28 shrink-0 truncate">{skillName(g.skill_id)}</span>
                  <ProgressBar value={g.current_level} barClassName="bg-warning-500" showLabel size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-error-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Missing Skills</h3>
            <Badge variant="error">{readiness.missing.length}</Badge>
          </div>
          {readiness.missing.length === 0 ? (
            <p className="text-xs text-neutral-600">No missing skills detected.</p>
          ) : (
            <div className="space-y-2">
              {readiness.missing.map((g) => (
                <div key={g.skill_id} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">{skillName(g.skill_id)}</span>
                  <ImportanceBadge importance={g.importance} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Moderate */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Moderate Skills</h3>
            <Badge variant="info">{readiness.moderate.length}</Badge>
          </div>
          {readiness.moderate.length === 0 ? (
            <p className="text-xs text-neutral-600">No moderate skills.</p>
          ) : (
            <div className="space-y-2.5">
              {readiness.moderate.map((g) => (
                <div key={g.skill_id} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-300 w-28 shrink-0 truncate">{skillName(g.skill_id)}</span>
                  <ProgressBar value={g.current_level} barClassName="bg-primary-500" showLabel size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => navigate('/app/recommendations')} className="btn-primary">
          View Recommendations
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
