/**
 * Unit Tests: Question Bank
 *
 * Validates the static question bank data integrity:
 *   - All questions conform to the Question interface
 *   - IRT parameters are within valid ranges
 *   - Content parses as valid JSON with stem and choices
 *   - Each section has sufficient questions for a full exam
 *   - No duplicate question IDs
 *   - Skill node IDs reference valid nodes
 */

import { describe, it, expect } from "vitest";
import {
  getQuestionsBySection,
  getAllQuestions,
  getQuestionCounts,
} from "@/lib/question-bank";
import { allSkillNodes } from "@/lib/question-bank/skill-nodes";
import type { GmatSection, Question } from "@/lib/tutor-engine/types";
import { GMAT_FOCUS } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface QuestionContent {
  stem: string;
  choices: { label: string; text: string }[];
}

function parseContent(content: string): QuestionContent {
  return JSON.parse(content);
}

const validSkillNodeIds = new Set(allSkillNodes.map((n) => n.id));

const VALID_QUESTION_TYPES = new Set([
  "problem_solving",
  "reading_comprehension",
  "critical_reasoning",
  "data_sufficiency",
  "multi_source_reasoning",
  "table_analysis",
  "graphics_interpretation",
  "two_part_analysis",
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Question Bank", () => {
  describe("getAllQuestions()", () => {
    it("returns a non-empty array", () => {
      const all = getAllQuestions();
      expect(all.length).toBeGreaterThan(0);
    });

    it("has no duplicate IDs", () => {
      const all = getAllQuestions();
      const ids = all.map((q) => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("getQuestionsBySection()", () => {
    const sections: GmatSection[] = ["quantitative", "verbal", "data_insights"];

    for (const section of sections) {
      describe(`section: ${section}`, () => {
        let questions: Question[];

        beforeAll(() => {
          questions = getQuestionsBySection(section);
        });

        it("returns a non-empty array", () => {
          expect(questions.length).toBeGreaterThan(0);
        });

        it("has at least enough questions for a drill (10)", () => {
          expect(questions.length).toBeGreaterThanOrEqual(10);
        });

        it("has at least enough questions for a section practice", () => {
          expect(questions.length).toBeGreaterThanOrEqual(
            GMAT_FOCUS.QUESTIONS_PER_SECTION[section],
          );
        });

        it("all questions belong to the correct section", () => {
          for (const q of questions) {
            expect(q.section).toBe(section);
          }
        });

        it("all questions have valid question types", () => {
          for (const q of questions) {
            expect(VALID_QUESTION_TYPES.has(q.questionType)).toBe(true);
          }
        });

        it("all questions have valid IRT parameters", () => {
          for (const q of questions) {
            expect(q.difficulty).toBeGreaterThanOrEqual(-3);
            expect(q.difficulty).toBeLessThanOrEqual(3);
            expect(q.discrimination).toBeGreaterThan(0);
            expect(q.guessing).toBeGreaterThanOrEqual(0);
            expect(q.guessing).toBeLessThanOrEqual(1);
          }
        });

        it("all questions have parseable JSON content", () => {
          for (const q of questions) {
            const parsed = parseContent(q.content);
            expect(parsed.stem).toBeTruthy();
            expect(typeof parsed.stem).toBe("string");
            expect(Array.isArray(parsed.choices)).toBe(true);
          }
        });

        it("all questions have exactly 5 choices (A-E)", () => {
          for (const q of questions) {
            const parsed = parseContent(q.content);
            expect(parsed.choices.length).toBe(5);
            const labels = parsed.choices.map((c) => c.label);
            expect(labels).toEqual(["A", "B", "C", "D", "E"]);
          }
        });

        it("all questions have a correctAnswer that matches a choice label", () => {
          for (const q of questions) {
            expect(["A", "B", "C", "D", "E"]).toContain(q.correctAnswer);
          }
        });

        it("all questions have a non-empty explanation", () => {
          for (const q of questions) {
            expect(q.explanation.length).toBeGreaterThan(0);
          }
        });

        it("all questions have a positive estimated time", () => {
          for (const q of questions) {
            expect(q.estimatedTimeSeconds).toBeGreaterThan(0);
          }
        });

        it("all questions reference valid skill node IDs", () => {
          for (const q of questions) {
            expect(q.skillNodeIds.length).toBeGreaterThan(0);
            for (const nodeId of q.skillNodeIds) {
              expect(validSkillNodeIds.has(nodeId)).toBe(true);
            }
          }
        });

        it("has a spread of difficulties", () => {
          const easy = questions.filter((q) => q.difficulty < -0.5);
          const hard = questions.filter((q) => q.difficulty > 0.5);
          expect(easy.length).toBeGreaterThan(0);
          expect(hard.length).toBeGreaterThan(0);
        });
      });
    }
  });

  describe("getQuestionCounts()", () => {
    it("returns counts matching actual data", () => {
      const counts = getQuestionCounts();
      expect(counts.quantitative).toBe(
        getQuestionsBySection("quantitative").length,
      );
      expect(counts.verbal).toBe(getQuestionsBySection("verbal").length);
      expect(counts.data_insights).toBe(
        getQuestionsBySection("data_insights").length,
      );
    });
  });

  describe("getQuestionsBySection() returns copies", () => {
    it("modifying the returned array does not affect the bank", () => {
      const q1 = getQuestionsBySection("quantitative");
      const originalLength = q1.length;
      q1.pop();
      const q2 = getQuestionsBySection("quantitative");
      expect(q2.length).toBe(originalLength);
    });
  });
});

describe("Skill Nodes", () => {
  it("has nodes for all three sections", () => {
    const sections = new Set(allSkillNodes.map((n) => n.section));
    expect(sections.has("quantitative")).toBe(true);
    expect(sections.has("verbal")).toBe(true);
    expect(sections.has("data_insights")).toBe(true);
  });

  it("has no duplicate IDs", () => {
    const ids = allSkillNodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all nodes have valid tier values (1-4)", () => {
    for (const node of allSkillNodes) {
      expect(node.tier).toBeGreaterThanOrEqual(1);
      expect(node.tier).toBeLessThanOrEqual(4);
    }
  });

  it("parent IDs reference existing nodes", () => {
    const nodeIds = new Set(allSkillNodes.map((n) => n.id));
    for (const node of allSkillNodes) {
      for (const parentId of node.parentIds) {
        expect(nodeIds.has(parentId)).toBe(true);
      }
    }
  });
});
