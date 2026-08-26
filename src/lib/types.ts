export type Importance = 'low' | 'medium' | 'high';

export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type PathItemStatus = 'completed' | 'current' | 'recommended' | 'locked' | 'upcoming';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface SkillCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface Skill {
  id: string;
  name: string;
  category_id: string | null;
  description: string | null;
  difficulty: number;
  importance: Importance;
  display_order: number;
}

export interface SkillPrerequisite {
  skill_id: string;
  prerequisite_id: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

export interface RoleSkill {
  role_id: string;
  skill_id: string;
  required_level: number;
  importance: Importance;
}

export interface AssessmentQuestion {
  id: string;
  skill_id: string;
  question: string;
  options: string[];
  difficulty: number;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  education_level: string | null;
  experience_level: string | null;
  target_role_id: string | null;
  interests: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentSkill {
  id: string;
  user_id: string;
  skill_id: string;
  level: number;
  self_assessed: boolean;
  assessment_score: number | null;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  skill_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  created_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  role_id: string | null;
  generated_at: string;
}

export interface LearningPathItem {
  id: string;
  path_id: string;
  user_id: string;
  skill_id: string;
  position: number;
  priority_score: number;
  status: PathItemStatus;
  explanation: PathExplanation | null;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  skill_id: string;
  status: ProgressStatus;
  progress: number;
  updated_at: string;
}

export interface PathExplanation {
  score: number;
  factors: {
    skill_gap: number;
    role_relevance: number;
    importance: number;
    prerequisite_fit: number;
    difficulty_fit: number;
  };
  reasons: string[];
}

export interface RecommendationResult {
  skill_id: string;
  priority_score: number;
  gap: number;
  status: PathItemStatus;
  explanation: PathExplanation;
}

export interface SkillGapDetail {
  skill_id: string;
  current_level: number;
  required_level: number;
  gap: number;
  importance: Importance;
  category: 'strong' | 'moderate' | 'weak' | 'missing';
  prerequisite_gaps: string[];
}

export interface CareerReadiness {
  overall: number;
  before: number;
  target: number;
  strong: SkillGapDetail[];
  moderate: SkillGapDetail[];
  weak: SkillGapDetail[];
  missing: SkillGapDetail[];
  critical_gaps: SkillGapDetail[];
}
