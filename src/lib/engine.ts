import type {
  Skill,
  SkillPrerequisite,
  RoleSkill,
  StudentSkill,
  LearningProgress,
  Importance,
  SkillGapDetail,
  CareerReadiness,
  RecommendationResult,
  PathExplanation,
  PathItemStatus,
} from './types';

const LEVEL_TO_PERCENT = [0, 20, 40, 60, 80, 100];

const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  low: 0.6,
  medium: 0.8,
  high: 1.0,
};

function levelToPercent(level: number): number {
  return LEVEL_TO_PERCENT[Math.max(0, Math.min(5, Math.round(level)))];
}

function buildPrereqMap(prereqs: SkillPrerequisite[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const p of prereqs) {
    if (!map.has(p.skill_id)) map.set(p.skill_id, []);
    map.get(p.skill_id)!.push(p.prerequisite_id);
  }
  return map;
}

function buildStudentSkillMap(skills: StudentSkill[]): Map<string, StudentSkill> {
  const map = new Map<string, StudentSkill>();
  for (const s of skills) map.set(s.skill_id, s);
  return map;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function getPrerequisiteGaps(
  skillId: string,
  prereqMap: Map<string, string[]>,
  studentSkills: Map<string, StudentSkill>,
  roleSkillMap: Map<string, RoleSkill>,
): string[] {
  const directPrereqs = prereqMap.get(skillId) ?? [];
  const gaps: string[] = [];
  for (const prereqId of directPrereqs) {
    const studentSkill = studentSkills.get(prereqId);
    const studentLevel = studentSkill ? levelToPercent(studentSkill.level) : 0;
    const roleReq = roleSkillMap.get(prereqId);
    const requiredLevel = roleReq ? roleReq.required_level : 60;
    if (studentLevel < requiredLevel * 0.7) {
      gaps.push(prereqId);
    }
  }
  return gaps;
}

export function calculateSkillGaps(
  roleSkills: RoleSkill[],
  studentSkills: StudentSkill[],
  prereqs: SkillPrerequisite[],
  skills: Skill[],
): SkillGapDetail[] {
  const studentMap = buildStudentSkillMap(studentSkills);
  const prereqMap = buildPrereqMap(prereqs);
  const roleSkillMap = new Map<string, RoleSkill>();
  for (const rs of roleSkills) roleSkillMap.set(rs.skill_id, rs);
  const skillMap = new Map<string, Skill>();
  for (const s of skills) skillMap.set(s.id, s);

  return roleSkills.map((rs): SkillGapDetail => {
    const studentSkill = studentMap.get(rs.skill_id);
    const currentLevel = studentSkill ? levelToPercent(studentSkill.level) : 0;
    const gap = Math.max(0, rs.required_level - currentLevel);
    const prereqGaps = getPrerequisiteGaps(rs.skill_id, prereqMap, studentMap, roleSkillMap);

    let category: SkillGapDetail['category'];
    if (currentLevel === 0) category = 'missing';
    else if (currentLevel >= rs.required_level) category = 'strong';
    else if (gap <= 20) category = 'moderate';
    else category = 'weak';

    return {
      skill_id: rs.skill_id,
      current_level: currentLevel,
      required_level: rs.required_level,
      gap,
      importance: rs.importance,
      category,
      prerequisite_gaps: prereqGaps,
    };
  });
}

export function calculateCareerReadiness(
  roleSkills: RoleSkill[],
  studentSkills: StudentSkill[],
  prereqs: SkillPrerequisite[],
  beforeSkills?: StudentSkill[],
): CareerReadiness {
  const skillMap = new Map<string, Skill>();
  const gaps = calculateSkillGaps(roleSkills, studentSkills, prereqs, []);

  const overall = Math.round(
    gaps.reduce((sum, g) => {
      const ratio = Math.min(1, g.current_level / Math.max(1, g.required_level));
      return sum + ratio * IMPORTANCE_WEIGHT[g.importance];
    }, 0) /
      gaps.reduce((sum, g) => sum + IMPORTANCE_WEIGHT[g.importance], 0) *
      100,
  );

  const beforeGaps = beforeSkills && beforeSkills.length > 0
    ? calculateSkillGaps(roleSkills, beforeSkills, prereqs, [])
    : gaps;
  const before = Math.round(
    beforeGaps.reduce((sum, g) => {
      const ratio = Math.min(1, g.current_level / Math.max(1, g.required_level));
      return sum + ratio * IMPORTANCE_WEIGHT[g.importance];
    }, 0) /
      beforeGaps.reduce((sum, g) => sum + IMPORTANCE_WEIGHT[g.importance], 0) *
      100,
  );

  const target = Math.min(
    100,
    Math.round(
      roleSkills.reduce((sum, rs) => sum + rs.required_level * IMPORTANCE_WEIGHT[rs.importance], 0) /
        roleSkills.reduce((sum, rs) => sum + IMPORTANCE_WEIGHT[rs.importance], 0),
    ),
  );

  const strong = gaps.filter((g) => g.category === 'strong');
  const moderate = gaps.filter((g) => g.category === 'moderate');
  const weak = gaps.filter((g) => g.category === 'weak');
  const missing = gaps.filter((g) => g.category === 'missing');

  const critical_gaps = gaps.filter(
    (g) =>
      (g.gap >= 40 || g.category === 'missing') &&
      g.importance === 'high',
  );

  return {
    overall: clamp(overall),
    before: clamp(before),
    target: clamp(target, 0, 100),
    strong,
    moderate,
    weak,
    missing,
    critical_gaps,
  };
}

export function scoreRecommendation(
  gap: SkillGapDetail,
  prereqGaps: string[],
  skill: Skill | undefined,
  progress: LearningProgress | undefined,
): PathExplanation {
  const skillGapScore = clamp((gap.gap / 100) * 100);

  const roleRelevanceScore = clamp(
    gap.required_level > 80 ? 95 : gap.required_level > 65 ? 80 : 65,
  );

  const importanceScore = IMPORTANCE_WEIGHT[gap.importance] * 100;

  const prereqFitScore = prereqGaps.length === 0
    ? 100
    : clamp(100 - prereqGaps.length * 30);

  const difficultyFitScore = skill
    ? clamp(100 - Math.abs(skill.difficulty - 3) * 10)
    : 70;

  const reasons: string[] = [];
  if (gap.importance === 'high') {
    reasons.push('High relevance to your target role');
  } else if (gap.importance === 'medium') {
    reasons.push('Moderate relevance to your target role');
  }
  if (gap.gap >= 60) {
    reasons.push('Significant current skill gap');
  } else if (gap.gap >= 30) {
    reasons.push('Moderate skill gap to close');
  } else if (gap.gap > 0) {
    reasons.push('Small skill gap to refine');
  }
  if (prereqGaps.length === 0) {
    reasons.push('Your prerequisite knowledge is sufficient');
  } else {
    reasons.push(`Prerequisites still needed: ${prereqGaps.length} skill(s)`);
  }
  if (progress?.status === 'in_progress') {
    reasons.push('You are already learning this skill');
  }
  if (skill && skill.difficulty <= 2) {
    reasons.push('Foundational skill — quick to acquire');
  }

  const score = Math.round(
    skillGapScore * 0.30 +
    roleRelevanceScore * 0.20 +
    importanceScore * 0.20 +
    prereqFitScore * 0.20 +
    difficultyFitScore * 0.10,
  );

  return {
    score: clamp(score),
    factors: {
      skill_gap: Math.round(skillGapScore),
      role_relevance: Math.round(roleRelevanceScore),
      importance: Math.round(importanceScore),
      prerequisite_fit: Math.round(prereqFitScore),
      difficulty_fit: Math.round(difficultyFitScore),
    },
    reasons,
  };
}

export function generateRecommendations(
  roleSkills: RoleSkill[],
  studentSkills: StudentSkill[],
  prereqs: SkillPrerequisite[],
  skills: Skill[],
  progress: LearningProgress[],
): RecommendationResult[] {
  const gaps = calculateSkillGaps(roleSkills, studentSkills, prereqs, skills);
  const prereqMap = buildPrereqMap(prereqs);
  const studentMap = buildStudentSkillMap(studentSkills);
  const roleSkillMap = new Map<string, RoleSkill>();
  for (const rs of roleSkills) roleSkillMap.set(rs.skill_id, rs);
  const skillMap = new Map<string, Skill>();
  for (const s of skills) skillMap.set(s.id, s);
  const progressMap = new Map<string, LearningProgress>();
  for (const p of progress) progressMap.set(p.skill_id, p);

  const results: RecommendationResult[] = gaps
    .filter((g) => g.gap > 0)
    .map((g): RecommendationResult => {
      const prereqGaps = getPrerequisiteGaps(g.skill_id, prereqMap, studentMap, roleSkillMap);
      const skill = skillMap.get(g.skill_id);
      const prog = progressMap.get(g.skill_id);
      const explanation = scoreRecommendation(g, prereqGaps, skill, prog);

      let status: PathItemStatus;
      if (prog?.status === 'completed' || g.current_level >= g.required_level) {
        status = 'completed';
      } else if (prereqGaps.length > 0) {
        status = 'locked';
      } else if (prog?.status === 'in_progress') {
        status = 'current';
      } else {
        status = 'recommended';
      }

      return {
        skill_id: g.skill_id,
        priority_score: explanation.score,
        gap: g.gap,
        status,
        explanation,
      };
    });

  return results.sort((a, b) => b.priority_score - a.priority_score);
}

export function generateLearningPath(
  roleSkills: RoleSkill[],
  studentSkills: StudentSkill[],
  prereqs: SkillPrerequisite[],
  skills: Skill[],
  progress: LearningProgress[],
): RecommendationResult[] {
  const recs = generateRecommendations(roleSkills, studentSkills, prereqs, skills, progress);
  const prereqMap = buildPrereqMap(prereqs);
  const studentMap = buildStudentSkillMap(studentSkills);
  const roleSkillMap = new Map<string, RoleSkill>();
  for (const rs of roleSkills) roleSkillMap.set(rs.skill_id, rs);
  const recMap = new Map<string, RecommendationResult>();
  for (const r of recs) recMap.set(r.skill_id, r);

  const ordered: RecommendationResult[] = [];
  const visited = new Set<string>();

  function visit(skillId: string) {
    if (visited.has(skillId)) return;
    visited.add(skillId);
    const directPrereqs = prereqMap.get(skillId) ?? [];
    for (const p of directPrereqs) {
      if (recMap.has(p)) visit(p);
    }
    const rec = recMap.get(skillId);
    if (rec) ordered.push(rec);
  }

  for (const rec of recs) visit(rec.skill_id);

  return ordered.map((r, i) => {
    const prereqGaps = getPrerequisiteGaps(r.skill_id, prereqMap, studentMap, roleSkillMap);
    let status: PathItemStatus;
    if (r.status === 'completed') {
      status = 'completed';
    } else if (prereqGaps.length > 0) {
      status = 'locked';
    } else if (i === 0 || ordered.slice(0, i).every((p) => p.status === 'completed')) {
      status = ordered.slice(0, i).every((p) => p.status === 'completed') ? 'current' : 'recommended';
    } else {
      status = 'upcoming';
    }
    return { ...r, status };
  });
}
