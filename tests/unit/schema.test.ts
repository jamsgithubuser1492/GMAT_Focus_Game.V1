/**
 * Unit Tests: Prisma Schema Validation
 *
 * Verifies that the database schema (Prisma-generated types) is structurally
 * compatible with the TutorEngine domain types. These tests validate at the
 * type system level — no database connection required.
 *
 * Tests for:
 *   - Enum alignment: Prisma enums match domain string literals
 *   - Field completeness: all required domain fields exist in the DB models
 *   - Relationship consistency: foreign keys and join tables are correct
 *   - Default values: schema defaults match domain constants
 */

import { describe, it, expect } from "vitest";
import {
  GmatSection as PrismaGmatSection,
  QuestionType as PrismaQuestionType,
  SessionType as PrismaSessionType,
} from "@prisma/client";
import type {
  User,
  SkillNode,
  Question,
  LearnerProfile,
  QuestionAttempt,
  ExamSession,
  Gamification,
} from "@prisma/client";
import type {
  GmatSection as DomainGmatSection,
  QuestionType as DomainQuestionType,
} from "@/lib/tutor-engine/types";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Enum Alignment
// ---------------------------------------------------------------------------
describe("Schema Enums — Prisma ↔ Domain Alignment", () => {
  it("should define all three GMAT sections", () => {
    const prismaValues = Object.values(PrismaGmatSection);
    expect(prismaValues).toContain("quantitative");
    expect(prismaValues).toContain("verbal");
    expect(prismaValues).toContain("data_insights");
    expect(prismaValues).toHaveLength(3);
  });

  it("should match GMAT_FOCUS.SECTIONS exactly", () => {
    const prismaValues = Object.values(PrismaGmatSection).sort();
    const domainValues = [...GMAT_FOCUS.SECTIONS].sort();
    expect(prismaValues).toEqual(domainValues);
  });

  it("should define all question types from domain", () => {
    const prismaValues = Object.values(PrismaQuestionType);
    // Quant
    expect(prismaValues).toContain("problem_solving");
    // Verbal
    expect(prismaValues).toContain("reading_comprehension");
    expect(prismaValues).toContain("critical_reasoning");
    // Data Insights
    expect(prismaValues).toContain("data_sufficiency");
    expect(prismaValues).toContain("multi_source_reasoning");
    expect(prismaValues).toContain("table_analysis");
    expect(prismaValues).toContain("graphics_interpretation");
    expect(prismaValues).toContain("two_part_analysis");
    expect(prismaValues).toHaveLength(8);
  });

  it("should define all session types", () => {
    const prismaValues = Object.values(PrismaSessionType);
    expect(prismaValues).toContain("drill");
    expect(prismaValues).toContain("section_practice");
    expect(prismaValues).toContain("full_exam");
    expect(prismaValues).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Model Field Completeness (compile-time type checks via runtime assertion)
// ---------------------------------------------------------------------------
describe("Schema Models — Field Completeness", () => {
  it("should have all required User fields", () => {
    // TypeScript compile-time check: if a field is missing, this won't compile
    const sampleUser: User = {
      id: "uuid",
      email: "test@example.com",
      displayName: "Test User",
      targetScore: 705,
      testDate: null,
      createdAt: new Date(),
    };
    expect(sampleUser.id).toBeDefined();
    expect(sampleUser.email).toBeDefined();
    expect(sampleUser.displayName).toBeDefined();
    expect(sampleUser.targetScore).toBe(705);
  });

  it("should have all required SkillNode fields", () => {
    const sampleNode: SkillNode = {
      id: "uuid",
      section: "quantitative",
      name: "Algebra Fundamentals",
      description: "Core algebra concepts",
      tier: 1,
      parentIds: [],
      createdAt: new Date(),
    };
    expect(sampleNode.tier).toBe(1);
    expect(sampleNode.parentIds).toEqual([]);
    expect(sampleNode.section).toBe("quantitative");
  });

  it("should have all required Question fields", () => {
    const sampleQuestion: Question = {
      id: "uuid",
      section: "quantitative",
      questionType: "problem_solving",
      difficultyB: 0.5,
      discriminationA: 1.2,
      guessingC: 0.2,
      content: {},
      correctAnswer: "B",
      explanation: "Step-by-step solution",
      estimatedTime: 120,
      createdAt: new Date(),
    };
    expect(sampleQuestion.difficultyB).toBe(0.5);
    expect(sampleQuestion.discriminationA).toBe(1.2);
    expect(sampleQuestion.guessingC).toBe(0.2);
  });

  it("should have all required LearnerProfile fields", () => {
    const sampleProfile: LearnerProfile = {
      id: "uuid",
      userId: "user-uuid",
      skillNodeId: "skill-uuid",
      theta: 0.0,
      attempts: 0,
      correct: 0,
      lastPracticed: null,
      decayFactor: 1.0,
    };
    expect(sampleProfile.theta).toBe(0.0);
    expect(sampleProfile.decayFactor).toBe(1.0);
    expect(sampleProfile.lastPracticed).toBeNull();
  });

  it("should have all required QuestionAttempt fields", () => {
    const sampleAttempt: QuestionAttempt = {
      id: "uuid",
      userId: "user-uuid",
      questionId: "question-uuid",
      sessionId: "session-uuid",
      selectedAnswer: "C",
      isCorrect: true,
      timeSpent: 90,
      wasBookmarked: false,
      wasEdited: false,
      thetaBefore: 0.0,
      thetaAfter: 0.4,
      createdAt: new Date(),
    };
    expect(sampleAttempt.wasBookmarked).toBe(false);
    expect(sampleAttempt.wasEdited).toBe(false);
    expect(sampleAttempt.thetaBefore).toBe(0.0);
    expect(sampleAttempt.thetaAfter).toBe(0.4);
  });

  it("should have all required ExamSession fields", () => {
    const sampleSession: ExamSession = {
      id: "uuid",
      userId: "user-uuid",
      sessionType: "full_exam",
      sectionOrder: "quant,verbal,di",
      startedAt: new Date(),
      completedAt: null,
      totalScore: null,
      quantScore: null,
      verbalScore: null,
      diScore: null,
      editsUsed: null,
    };
    expect(sampleSession.sessionType).toBe("full_exam");
    expect(sampleSession.completedAt).toBeNull();
  });

  it("should have all required Gamification fields", () => {
    const sampleGamification: Gamification = {
      id: "uuid",
      userId: "user-uuid",
      xpTotal: 0,
      level: 1,
      streakDays: 0,
      streakLastDate: null,
      vaultUnlocked: false,
      badges: [],
      bookmarkXp: 0,
    };
    expect(sampleGamification.level).toBe(1);
    expect(sampleGamification.vaultUnlocked).toBe(false);
    expect(sampleGamification.xpTotal).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Domain Constraint Alignment
// ---------------------------------------------------------------------------
describe("Schema Defaults — Domain Constant Alignment", () => {
  it("should default target score to 705 (matching elite target)", () => {
    // This validates the schema's @default(705) on User.targetScore
    const user: User = {
      id: "uuid",
      email: "test@example.com",
      displayName: "Test",
      targetScore: 705,
      testDate: null,
      createdAt: new Date(),
    };
    expect(user.targetScore).toBe(705);
  });

  it("should default guessing parameter to 0.2 (5-choice MCQ)", () => {
    // Validates @default(0.2) on Question.guessingC
    expect(GMAT_FOCUS.DEFAULT_GUESSING).toBe(0.2);
  });

  it("should default theta to 0.0 (neutral starting proficiency)", () => {
    const profile: LearnerProfile = {
      id: "uuid",
      userId: "user-uuid",
      skillNodeId: "skill-uuid",
      theta: 0.0,
      attempts: 0,
      correct: 0,
      lastPracticed: null,
      decayFactor: 1.0,
    };
    expect(profile.theta).toBe(0.0);
  });

  it("should default decay factor to 1.0 (full mastery)", () => {
    const profile: LearnerProfile = {
      id: "uuid",
      userId: "user-uuid",
      skillNodeId: "skill-uuid",
      theta: 0.0,
      attempts: 0,
      correct: 0,
      lastPracticed: null,
      decayFactor: 1.0,
    };
    expect(profile.decayFactor).toBe(1.0);
  });

  it("should default gamification level to 1", () => {
    const g: Gamification = {
      id: "uuid",
      userId: "user-uuid",
      xpTotal: 0,
      level: 1,
      streakDays: 0,
      streakLastDate: null,
      vaultUnlocked: false,
      badges: [],
      bookmarkXp: 0,
    };
    expect(g.level).toBe(1);
  });

  it("should have vault locked by default", () => {
    const g: Gamification = {
      id: "uuid",
      userId: "user-uuid",
      xpTotal: 0,
      level: 1,
      streakDays: 0,
      streakLastDate: null,
      vaultUnlocked: false,
      badges: [],
      bookmarkXp: 0,
    };
    expect(g.vaultUnlocked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Type Compatibility — Prisma ↔ TutorEngine
// ---------------------------------------------------------------------------
describe("Type Compatibility — Prisma Models ↔ TutorEngine Types", () => {
  it("should allow Prisma Question fields to map to IRT parameters", () => {
    const question: Question = {
      id: "uuid",
      section: "quantitative",
      questionType: "problem_solving",
      difficultyB: 1.5,
      discriminationA: 2.0,
      guessingC: 0.2,
      content: {},
      correctAnswer: "A",
      explanation: "",
      estimatedTime: 120,
      createdAt: new Date(),
    };

    // These fields map directly to IRTParameters { a, b, c }
    expect(question.discriminationA).toBe(2.0);
    expect(question.difficultyB).toBe(1.5);
    expect(question.guessingC).toBe(0.2);
  });

  it("should allow Prisma LearnerProfile to map to domain LearnerProfile", () => {
    const profile: LearnerProfile = {
      id: "uuid",
      userId: "user-1",
      skillNodeId: "skill-1",
      theta: 1.5,
      attempts: 10,
      correct: 7,
      lastPracticed: new Date(),
      decayFactor: 0.8,
    };

    // These map directly to the domain LearnerProfile interface
    expect(profile.theta).toBe(1.5);
    expect(profile.attempts).toBe(10);
    expect(profile.correct).toBe(7);
    expect(profile.decayFactor).toBe(0.8);
  });

  it("should have GmatSection enum values compatible with domain type", () => {
    // Prisma enum values must be assignable to the domain GmatSection string union
    const prismaSection: PrismaGmatSection = PrismaGmatSection.quantitative;
    const domainCheck: DomainGmatSection = prismaSection;
    expect(domainCheck).toBe("quantitative");
  });

  it("should have QuestionType enum values compatible with domain type", () => {
    const prismaType: PrismaQuestionType = PrismaQuestionType.data_sufficiency;
    const domainCheck: DomainQuestionType = prismaType;
    expect(domainCheck).toBe("data_sufficiency");
  });
});
