/*
# Adaptive Learning Path Recommendation Engine — Schema

## Overview
Creates the full data model for a career intelligence platform: a structured skill
taxonomy, prerequisite graph, career roles with skill requirements, assessment
questions, and per-student skill signals, generated learning paths, and progress.

## Reference Data (publicly readable, seeded by the app)
- `skill_categories` — top-level groupings (Frontend, Backend, Database, DevOps, Cloud, Data).
- `skills` — individual skills with difficulty, importance, description. Text slug PKs for easy seeding.
- `skill_prerequisites` — many-to-many self-referential graph on skills.
- `roles` — target career roles (Frontend Developer, Data Scientist, etc.).
- `role_skills` — per-role required level (0-100) and importance (low/medium/high).
- `assessment_questions` — objective MCQ questions per skill for stronger signals.

## Student Data (owner-scoped, requires authentication)
- `student_profiles` — one per user: name, education, experience, target role, interests.
- `student_skills` — per-skill proficiency (0-5), self-assessed or from assessment.
- `assessment_results` — history of assessment scores per skill.
- `learning_paths` — one generated path per user+role.
- `learning_path_items` — ordered skills in a path with priority score, status, explanation.
- `learning_progress` — per-skill learning status (not_started / in_progress / completed).

## Security
- RLS enabled on ALL tables.
- Reference tables: SELECT open to anon+authenticated (landing page explores roles without login). No write policies — only service role seeds them.
- Student tables: full CRUD scoped to the owner via auth.uid() = user_id. Owner columns default to auth.uid() so inserts that omit user_id succeed.
*/

-- ============================================================
-- REFERENCE DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS skill_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_skill_categories" ON skill_categories;
CREATE POLICY "public_read_skill_categories" ON skill_categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS skills (
  id text PRIMARY KEY,
  name text NOT NULL,
  category_id text REFERENCES skill_categories(id) ON DELETE SET NULL,
  description text,
  difficulty int NOT NULL DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  importance text NOT NULL DEFAULT 'medium' CHECK (importance IN ('low','medium','high')),
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_skills" ON skills;
CREATE POLICY "public_read_skills" ON skills FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS skill_prerequisites (
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (skill_id, prerequisite_id)
);

ALTER TABLE skill_prerequisites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_prerequisites" ON skill_prerequisites;
CREATE POLICY "public_read_prerequisites" ON skill_prerequisites FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_roles" ON roles;
CREATE POLICY "public_read_roles" ON roles FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS role_skills (
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_level int NOT NULL CHECK (required_level >= 0 AND required_level <= 100),
  importance text NOT NULL DEFAULT 'medium' CHECK (importance IN ('low','medium','high')),
  PRIMARY KEY (role_id, skill_id)
);

ALTER TABLE role_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_role_skills" ON role_skills;
CREATE POLICY "public_read_role_skills" ON role_skills FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  difficulty int NOT NULL DEFAULT 3
);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_assessment_questions" ON assessment_questions;
CREATE POLICY "public_read_assessment_questions" ON assessment_questions FOR SELECT
  TO anon, authenticated USING (true);

-- ============================================================
-- STUDENT DATA (owner-scoped)
-- ============================================================

CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  education_level text,
  experience_level text,
  target_role_id text REFERENCES roles(id),
  interests text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON student_profiles;
CREATE POLICY "select_own_profile" ON student_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON student_profiles;
CREATE POLICY "insert_own_profile" ON student_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON student_profiles;
CREATE POLICY "update_own_profile" ON student_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON student_profiles;
CREATE POLICY "delete_own_profile" ON student_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level int NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 5),
  self_assessed boolean NOT NULL DEFAULT true,
  assessment_score int CHECK (assessment_score >= 0 AND assessment_score <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_student_skills" ON student_skills;
CREATE POLICY "select_own_student_skills" ON student_skills FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_student_skills" ON student_skills;
CREATE POLICY "insert_own_student_skills" ON student_skills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_student_skills" ON student_skills;
CREATE POLICY "update_own_student_skills" ON student_skills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_student_skills" ON student_skills;
CREATE POLICY "delete_own_student_skills" ON student_skills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions int NOT NULL,
  correct_answers int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessment_results" ON assessment_results;
CREATE POLICY "select_own_assessment_results" ON assessment_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessment_results" ON assessment_results;
CREATE POLICY "insert_own_assessment_results" ON assessment_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessment_results" ON assessment_results;
CREATE POLICY "delete_own_assessment_results" ON assessment_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text REFERENCES roles(id),
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_paths" ON learning_paths;
CREATE POLICY "select_own_paths" ON learning_paths FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_paths" ON learning_paths;
CREATE POLICY "insert_own_paths" ON learning_paths FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_paths" ON learning_paths;
CREATE POLICY "update_own_paths" ON learning_paths FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_paths" ON learning_paths;
CREATE POLICY "delete_own_paths" ON learning_paths FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  position int NOT NULL,
  priority_score int NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
  status text NOT NULL DEFAULT 'recommended' CHECK (status IN ('completed','current','recommended','locked','upcoming')),
  explanation jsonb,
  UNIQUE(path_id, skill_id)
);

ALTER TABLE learning_path_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_path_items" ON learning_path_items;
CREATE POLICY "select_own_path_items" ON learning_path_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_path_items" ON learning_path_items;
CREATE POLICY "insert_own_path_items" ON learning_path_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_path_items" ON learning_path_items;
CREATE POLICY "update_own_path_items" ON learning_path_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_path_items" ON learning_path_items;
CREATE POLICY "delete_own_path_items" ON learning_path_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  progress int NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON learning_progress;
CREATE POLICY "select_own_progress" ON learning_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON learning_progress;
CREATE POLICY "insert_own_progress" ON learning_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON learning_progress;
CREATE POLICY "update_own_progress" ON learning_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON learning_progress;
CREATE POLICY "delete_own_progress" ON learning_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_role_skills_role ON role_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_role_skills_skill ON role_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_prereq_skill ON skill_prerequisites(skill_id);
CREATE INDEX IF NOT EXISTS idx_prereq_prereq ON skill_prerequisites(prerequisite_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_user ON student_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_q_skill ON assessment_questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_path_items_path ON learning_path_items(path_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON learning_progress(user_id);
