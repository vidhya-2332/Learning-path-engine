import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Compass, Route, TrendingUp, Target, ArrowRight, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSkills,
  fetchPrerequisites,
  fetchProfile,
  fetchStudentSkills,
  fetchRoleSkills,
  fetchProgress,
} from '@/lib/data';
import { calculateCareerReadiness, generateRecommendations } from '@/lib/engine';
import type { Skill, Role, CareerReadiness, RecommendationResult } from '@/lib/types';
import { fetchRoles } from '@/lib/data';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';

export function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState<CareerReadiness | null>(null);
  const [topRecs, setTopRecs] = useState<RecommendationResult[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [allSkills, prereqs, profile, studentSkills, roles] = await Promise.all([
          fetchSkills(),
          fetchPrerequisites(),
          fetchProfile(user.id),
          fetchStudentSkills(user.id),
          fetchRoles(),
        ]);
        setSkills(allSkills);

        if (!profile?.target_role_id) {
          setHasProfile(false);
          setLoading(false);
          return;
        }
        setHasProfile(true);
        const targetRole = roles.find((r) => r.id === profile.target_role_id) ?? null;
        setRole(targetRole);

        if (studentSkills.length === 0) {
          setHasSkills(false);
          setLoading(false);
          return;
        }
        setHasSkills(true);

        const [roleSkills, progress] = await Promise.all([
          fetchRoleSkills(profile.target_role_id),
          fetchProgress(user.id),
        ]);
        const result = calculateCareerReadiness(roleSkills, studentSkills, prereqs, allSkills);
        setReadiness(result);
        const recs = generateRecommendations(roleSkills, studentSkills, prereqs, allSkills, progress);
        setTopRecs(recs.slice(0, 3));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const skillName = (id: string) => skills.find((s) => s.id === id)?.name ?? id;

  if (loading) return <LoadingState message="Loading your overview..." />;

  if (!hasProfile) {
    return (
      <EmptyState
        icon={<User className="h-8 w-8" />}
        title="Welcome! Let's get started"
        description="Set up your profile and select a target career role to unlock the recommendation engine."
        action={<button onClick={() => navigate('/app/profile')} className="btn-primary">Set Up Profile</button>}
      />
    );
  }

  if (!hasSkills) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="Assessment needed"
        description="Complete the skill assessment so the engine can analyze your gaps and generate recommendations."
        action={<button onClick={() => navigate('/app/assessment')} className="btn-primary">Take Assessment</button>}
      />
    );
  }

  const cards = [
    { icon: Brain, label: 'Skill Intelligence', desc: 'Analyze your gaps', to: '/app/intelligence' },
    { icon: Compass, label: 'Recommendations', desc: 'What to learn next', to: '/app/recommendations' },
    { icon: Route, label: 'Learning Path', desc: 'Your ordered plan', to: '/app/path' },
    { icon: TrendingUp, label: 'Progress', desc: 'Track improvement', to: '/app/progress' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
        <p className="text-sm text-neutral-500">
          {role ? `Target role: ${role.name}` : 'Your career intelligence dashboard'}
        </p>
      </div>

      {/* Readiness summary */}
      {readiness && (
        <div className="card p-6">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <svg className="h-20 w-20 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" className="text-neutral-800" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5"
                  className="text-primary-500 transition-all duration-700"
                  strokeDasharray={`${(readiness.overall / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{readiness.overall}%</span>
                <span className="text-xs text-neutral-500">Ready</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-neutral-300 mb-2">Career Readiness</div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-neutral-500">Before: </span>
                  <span className="text-neutral-400 font-medium">{readiness.before}%</span>
                </div>
                <div>
                  <span className="text-neutral-500">Target: </span>
                  <span className="text-primary-400 font-medium">{readiness.target}%</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Badge variant="success">{readiness.strong.length} Strong</Badge>
                <Badge variant="warning">{readiness.weak.length} Weak</Badge>
                <Badge variant="error">{readiness.missing.length} Missing</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => navigate(card.to)}
            className="card p-4 text-left hover:border-neutral-700 transition-colors group"
          >
            <card.icon className="h-6 w-6 text-primary-400 mb-2" />
            <div className="text-sm font-medium text-neutral-200">{card.label}</div>
            <div className="text-xs text-neutral-500">{card.desc}</div>
          </button>
        ))}
      </div>

      {/* Top recommendations preview */}
      {topRecs.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Top Recommendations</h2>
            <button onClick={() => navigate('/app/recommendations')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topRecs.map((rec, idx) => (
              <div key={rec.skill_id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-600 w-5">{idx + 1}</span>
                <span className="text-sm text-neutral-200 flex-1">{skillName(rec.skill_id)}</span>
                <div className="w-24">
                  <ProgressBar value={rec.priority_score} size="sm" showLabel />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile quick link */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/app/profile')} className="btn-ghost">
          <Target className="h-4 w-4" />
          Edit Profile
        </button>
        <button onClick={() => navigate('/app/assessment')} className="btn-secondary">
          <Sparkles className="h-4 w-4" />
          Retake Assessment
        </button>
      </div>
    </div>
  );
}
