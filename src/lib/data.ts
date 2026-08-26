import { supabase } from './supabase';
import type {
  Skill,
  SkillCategory,
  SkillPrerequisite,
  Role,
  RoleSkill,
  AssessmentQuestion,
  StudentProfile,
  StudentSkill,
  AssessmentResult,
  LearningPath,
  LearningPathItem,
  LearningProgress,
  RecommendationResult,
  PathExplanation,
} from './types';
import { generateLearningPath } from './engine';

export async function fetchCategories(): Promise<SkillCategory[]> {
  const { data, error } = await supabase
    .from('skill_categories')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchPrerequisites(): Promise<SkillPrerequisite[]> {
  const { data, error } = await supabase.from('skill_prerequisites').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchRoleSkills(roleId: string): Promise<RoleSkill[]> {
  const { data, error } = await supabase
    .from('role_skills')
    .select('*')
    .eq('role_id', roleId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllRoleSkills(): Promise<RoleSkill[]> {
  const { data, error } = await supabase.from('role_skills').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAssessmentQuestions(skillIds?: string[]): Promise<AssessmentQuestion[]> {
  let query = supabase.from('assessment_questions').select('*');
  if (skillIds && skillIds.length > 0) query = query.in('skill_id', skillIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string),
  }));
}

export async function fetchProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(
  userId: string,
  profile: Partial<Omit<StudentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<StudentProfile> {
  const { data: existing } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('student_profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('student_profiles')
    .insert({ ...profile, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchStudentSkills(userId: string): Promise<StudentSkill[]> {
  const { data, error } = await supabase
    .from('student_skills')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertStudentSkill(
  userId: string,
  skillId: string,
  level: number,
  selfAssessed: boolean,
  assessmentScore?: number,
): Promise<void> {
  const { data: existing } = await supabase
    .from('student_skills')
    .select('id')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('student_skills')
      .update({
        level,
        self_assessed: selfAssessed,
        assessment_score: assessmentScore ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('student_skills').insert({
      user_id: userId,
      skill_id: skillId,
      level,
      self_assessed: selfAssessed,
      assessment_score: assessmentScore ?? null,
    });
    if (error) throw error;
  }
}

export async function saveAssessmentResult(
  userId: string,
  skillId: string,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
): Promise<void> {
  const { error } = await supabase.from('assessment_results').insert({
    user_id: userId,
    skill_id: skillId,
    score,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
  });
  if (error) throw error;
}

export async function fetchAssessmentResults(userId: string): Promise<AssessmentResult[]> {
  const { data, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchProgress(userId: string): Promise<LearningProgress[]> {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertProgress(
  userId: string,
  skillId: string,
  status: LearningProgress['status'],
  progressValue: number,
): Promise<void> {
  const { data: existing } = await supabase
    .from('learning_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('learning_progress')
      .update({
        status,
        progress: progressValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('learning_progress').insert({
      user_id: userId,
      skill_id: skillId,
      status,
      progress: progressValue,
    });
    if (error) throw error;
  }
}

export async function fetchLearningPath(
  userId: string,
  roleId: string,
): Promise<LearningPathItem[] | null> {
  const { data: path } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (!path) return null;

  const { data, error } = await supabase
    .from('learning_path_items')
    .select('*')
    .eq('path_id', path.id)
    .order('position');
  if (error) throw error;
  return (data ?? []).map((item) => ({
    ...item,
    explanation: item.explanation as PathExplanation | null,
  }));
}

export async function generateAndSaveLearningPath(
  userId: string,
  roleId: string,
  roleSkills: RoleSkill[],
  studentSkills: StudentSkill[],
  prereqs: SkillPrerequisite[],
  skills: Skill[],
  progress: LearningProgress[],
): Promise<RecommendationResult[]> {
  const ordered = generateLearningPath(roleSkills, studentSkills, prereqs, skills, progress);

  const { data: existingPath } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  let pathId: string;

  if (existingPath) {
    await supabase.from('learning_path_items').delete().eq('path_id', existingPath.id);
    pathId = existingPath.id;
  } else {
    const { data: newPath, error: pathError } = await supabase
      .from('learning_paths')
      .insert({ user_id: userId, role_id: roleId })
      .select()
      .single();
    if (pathError) throw pathError;
    pathId = newPath.id;
  }

  const items = ordered.map((rec, i) => ({
    path_id: pathId,
    user_id: userId,
    skill_id: rec.skill_id,
    position: i,
    priority_score: rec.priority_score,
    status: rec.status,
    explanation: rec.explanation,
  }));

  if (items.length > 0) {
    const { error: insertError } = await supabase.from('learning_path_items').insert(items);
    if (insertError) throw insertError;
  }

  return ordered;
}
