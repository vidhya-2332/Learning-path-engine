import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, Lock, CheckCircle2, Play, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSkills,
  fetchPrerequisites,
  fetchProfile,
  fetchStudentSkills,
  fetchRoleSkills,
  fetchProgress,
} from '@/lib/data';
import { generateRecommendations } from '@/lib/engine';
import type { Skill, RecommendationResult, PathExplanation } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { cn } from '@/lib/utils';

export function RecommendationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
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
        const recs = generateRecommendations(roleSkills, studentSkills, prereqs, allSkills, progress);
        setRecommendations(recs);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;
  const skillDesc = (id: string) => skills.find((s) => s.id === id)?.description ?? '';

  if (loading) return <LoadingState message="Generating recommendations..." />;

  if (!hasProfile) {
    return (
      <EmptyState
        icon={<Compass className="h-8 w-8" />}
        title="No target role selected"
        description="Select a career role to get personalized recommendations."
        action={<button onClick={() => navigate('/app/profile')} className="btn-primary">Set Up Profile</button>}
      />
    );
  }

  if (!hasSkills) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="Assessment required"
        description="Complete the assessment so the engine can generate recommendations."
        action={<button onClick={() => navigate('/app/assessment')} className="btn-primary">Take Assessment</button>}
      />
    );
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-8 w-8" />}
        title="No skill gaps detected"
        description="You have met all the requirements for your target role. Consider selecting a more advanced role."
      />
    );
  }

  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'neutral' | 'default'; label: string; icon: React.ReactNode }> = {
    completed: { variant: 'success', label: 'Completed', icon: <CheckCircle2 className="h-3 w-3" /> },
    current: { variant: 'default', label: 'Current', icon: <Play className="h-3 w-3" /> },
    recommended: { variant: 'warning', label: 'Recommended', icon: <Sparkles className="h-3 w-3" /> },
    locked: { variant: 'error', label: 'Locked', icon: <Lock className="h-3 w-3" /> },
    upcoming: { variant: 'neutral', label: 'Upcoming', icon: null },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Recommendations</h1>
        <p className="text-sm text-neutral-500">
          The engine has ranked these skills based on your gaps, role relevance,
          prerequisites, and difficulty fit.
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const cfg = statusConfig[rec.status] ?? statusConfig.recommended;
          const isOpen = expanded === rec.skill_id;
          return (
            <div key={rec.skill_id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : rec.skill_id)}
                className="w-full text-left p-5 flex items-center gap-4 hover:bg-neutral-900/40 transition-colors"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-sm font-mono font-medium text-neutral-400">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">{skillName(rec.skill_id)}</span>
                    <Badge variant={cfg.variant}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{skillDesc(rec.skill_id)}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-400 font-mono">{rec.priority_score}</div>
                    <div className="text-xs text-neutral-600">priority</div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-neutral-800/60 animate-slide-in">
                  <ExplanationView explanation={rec.explanation} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={() => navigate('/app/path')} className="btn-primary">
          View Learning Path
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ExplanationView({ explanation }: { explanation: PathExplanation }) {
  const { factors } = explanation;
  const factorLabels: { key: keyof typeof factors; label: string }[] = [
    { key: 'skill_gap', label: 'Skill Gap' },
    { key: 'role_relevance', label: 'Role Relevance' },
    { key: 'importance', label: 'Importance' },
    { key: 'prerequisite_fit', label: 'Prerequisite Fit' },
    { key: 'difficulty_fit', label: 'Difficulty Fit' },
  ];

  return (
    <div className="space-y-4 pt-3">
      <div>
        <div className="text-xs font-medium text-neutral-400 mb-2">Why this is recommended</div>
        <ul className="space-y-1.5">
          {explanation.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
              <span className="text-primary-500 mt-1.5 shrink-0">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-medium text-neutral-400 mb-2">Score Breakdown</div>
        <div className="space-y-2">
          {factorLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-neutral-500 w-28 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full', `bg-primary-500`)}
                  style={{ width: `${factors[key]}%` }}
                />
              </div>
              <span className="text-xs font-mono text-neutral-400 w-8 text-right">{factors[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
