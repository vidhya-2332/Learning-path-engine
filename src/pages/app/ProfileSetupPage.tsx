import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Briefcase, Target, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchRoles, fetchProfile, upsertProfile } from '@/lib/data';
import type { Role } from '@/lib/types';

const educationLevels = ['High School', 'Bootcamp', 'Associate Degree', 'Bachelor', 'Master', 'Self-Taught'];
const experienceLevels = ['No Experience', 'Less than 1 year', '1-2 years', '3-5 years', '5+ years'];

export function ProfileSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [interests, setInterests] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [r, profile] = await Promise.all([fetchRoles(), fetchProfile(user.id)]);
        setRoles(r);
        if (profile) {
          setFullName(profile.full_name ?? '');
          setEducation(profile.education_level ?? '');
          setExperience(profile.experience_level ?? '');
          setTargetRole(profile.target_role_id ?? '');
          setInterests(profile.interests ?? '');
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile(user.id, {
        full_name: fullName,
        education_level: education,
        experience_level: experience,
        target_role_id: targetRole || null,
        interests,
      });
      navigate('/app/assessment');
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-neutral-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Set Up Your Profile</h1>
        <p className="text-sm text-neutral-500">
          Your profile provides the data the recommendation engine uses to
          analyze your skill gaps and generate a learning path.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <User className="h-4 w-4 text-primary-400" />
            Basic Information
          </div>
          <div>
            <label className="label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="edu">Education Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <select
                  id="edu"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="">Select...</option>
                  {educationLevels.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="exp">Experience Level</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <select
                  id="exp"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="input-field pl-10 appearance-none"
                >
                  <option value="">Select...</option>
                  {experienceLevels.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Target className="h-4 w-4 text-primary-400" />
            Target Career Role
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setTargetRole(role.id)}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  targetRole === role.id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-200">{role.name}</span>
                  {targetRole === role.id && <Check className="h-4 w-4 text-primary-400" />}
                </div>
                {role.description && (
                  <div className="text-xs text-neutral-500 mt-0.5">{role.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Sparkles className="h-4 w-4 text-primary-400" />
            Interests (Optional)
          </div>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. web development, data, cloud infrastructure"
            className="input-field"
          />
        </div>

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate('/app')} className="btn-ghost">
            Skip for now
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Continue to Assessment'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
