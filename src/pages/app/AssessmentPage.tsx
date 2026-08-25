import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, ArrowLeft, Check, Star, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchSkills,
  fetchProfile,
  fetchStudentSkills,
  fetchAssessmentQuestions,
  upsertStudentSkill,
  saveAssessmentResult,
  fetchRoleSkills,
} from '@/lib/data';
import type { Skill, AssessmentQuestion } from '@/lib/types';

const LEVEL_LABELS = [
  'No knowledge', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Proficient',
];

export function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [relevantSkillIds, setRelevantSkillIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selfLevels, setSelfLevels] = useState<Record<string, number>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const [allSkills, profile] = await Promise.all([fetchSkills(), fetchProfile(user.id)]);
        if (!profile?.target_role_id) {
          setSkills(allSkills);
          setRelevantSkillIds(allSkills.map((s) => s.id));
          const qs = await fetchAssessmentQuestions();
          setQuestions(qs);
          setLoading(false);
          return;
        }
        const roleSkills = await fetchRoleSkills(profile.target_role_id);
        const roleSkillIds = roleSkills.map((rs) => rs.skill_id);
        const relevant = allSkills.filter((s) => roleSkillIds.includes(s.id));
        setSkills(relevant);
        setRelevantSkillIds(relevant.map((s) => s.id));
        const qs = await fetchAssessmentQuestions(relevant.map((s) => s.id));
        setQuestions(qs);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const quizForSkills = questions.filter((q) => relevantSkillIds.includes(q.skill_id));
  const totalSteps = skills.length + quizForSkills.length;
  const currentSkill = step < skills.length ? skills[step] : null;
  const quizIndex = step - skills.length;
  const currentQuiz = step >= skills.length ? quizForSkills[quizIndex] : null;

  const handleSelfAssess = (skillId: string, level: number) => {
    setSelfLevels((prev) => ({ ...prev, [skillId]: level }));
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const [skillId, level] of Object.entries(selfLevels)) {
        await upsertStudentSkill(user.id, skillId, level, true);
      }
      const correctBySkill = new Map<string, { correct: number; total: number }>();
      for (const q of quizForSkills) {
        const ans = quizAnswers[q.id];
        if (ans === undefined) continue;
        const entry = correctBySkill.get(q.skill_id) ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (ans === 0) entry.correct += 1;
        correctBySkill.set(q.skill_id, entry);
      }
      for (const [skillId, { correct, total }] of correctBySkill) {
        if (total === 0) continue;
        const score = Math.round((correct / total) * 100);
        await saveAssessmentResult(user.id, skillId, score, total, correct);
        const selfLevel = selfLevels[skillId] ?? 0;
        const assessmentLevel = Math.round(score / 20);
        const blended = Math.round((selfLevel * 0.4 + assessmentLevel * 0.6));
        await upsertStudentSkill(user.id, skillId, blended, false, score);
      }
      navigate('/app/intelligence');
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-neutral-500">Loading assessment...</div>;
  }

  if (skills.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-400 mb-4">No skills available for assessment.</p>
        <button onClick={() => navigate('/app/profile')} className="btn-primary">
          Set Target Role First
        </button>
      </div>
    );
  }

  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Skill Assessment</h1>
        <p className="text-sm text-neutral-500">
          Rate your skills and answer a few questions so the engine can build an
          accurate profile.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span>Question {step + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card p-8 animate-fade-in" key={step}>
        {currentSkill && (
          <>
            <div className="flex items-center gap-2 text-xs text-primary-400 mb-2">
              <Star className="h-3.5 w-3.5" />
              Self-Assessment
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">How comfortable are you with {currentSkill.name}?</h2>
            {currentSkill.description && (
              <p className="text-sm text-neutral-500 mb-6">{currentSkill.description}</p>
            )}
            <div className="space-y-2">
              {LEVEL_LABELS.map((label, level) => (
                <button
                  key={level}
                  onClick={() => handleSelfAssess(currentSkill.id, level)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                    selfLevels[currentSkill.id] === level
                      ? 'border-primary-500 bg-primary-500/10 text-white'
                      : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-neutral-600 font-mono">Level {level}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {currentQuiz && (
          <>
            <div className="flex items-center gap-2 text-xs text-secondary-400 mb-2">
              <HelpCircle className="h-3.5 w-3.5" />
              Objective Question — {skills.find((s) => s.id === currentQuiz.skill_id)?.name}
            </div>
            <h2 className="text-lg font-semibold text-white mb-6">{currentQuiz.question}</h2>
            <div className="space-y-2">
              {currentQuiz.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuizAnswers((prev) => ({ ...prev, [currentQuiz.id]: idx }))}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    quizAnswers[currentQuiz.id] === idx
                      ? 'border-secondary-500 bg-secondary-500/10 text-white'
                      : 'border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="text-sm">{opt}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button onClick={handlePrev} disabled={step === 0} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {step < totalSteps - 1 ? (
          <button onClick={handleNext} className="btn-primary">
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleFinish} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Complete Assessment'}
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
