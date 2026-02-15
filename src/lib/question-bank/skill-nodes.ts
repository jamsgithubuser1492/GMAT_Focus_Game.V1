/**
 * Static Skill Node Definitions
 *
 * Expert model knowledge graph nodes used to map questions to skills.
 * These IDs are referenced by the question bank and learner profiles.
 */

import type { SkillNode, GmatSection } from "@/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function node(
  id: string,
  section: GmatSection,
  name: string,
  description: string,
  tier: 1 | 2 | 3 | 4,
  parentIds: string[] = [],
): SkillNode {
  return { id, section, name, description, tier, parentIds };
}

// ---------------------------------------------------------------------------
// Quantitative Skill Nodes
// ---------------------------------------------------------------------------

export const quantitativeSkillNodes: SkillNode[] = [
  node("q-arithmetic-1", "quantitative", "Arithmetic Foundations", "Number properties, primes, divisibility, order of operations", 1),
  node("q-arithmetic-2", "quantitative", "Advanced Arithmetic", "Remainders, modular arithmetic, GCD/LCM, digit problems", 2, ["q-arithmetic-1"]),
  node("q-algebra-1", "quantitative", "Algebra Foundations", "Linear equations, inequalities, absolute value", 1),
  node("q-algebra-2", "quantitative", "Intermediate Algebra", "Quadratics, systems of equations, functions", 2, ["q-algebra-1"]),
  node("q-algebra-3", "quantitative", "Advanced Algebra", "Polynomial manipulation, sequences, advanced inequalities", 3, ["q-algebra-2"]),
  node("q-geometry-1", "quantitative", "Geometry Foundations", "Triangles, circles, rectangles, basic angles", 1),
  node("q-geometry-2", "quantitative", "Intermediate Geometry", "Coordinate geometry, 3D shapes, similar triangles", 2, ["q-geometry-1"]),
  node("q-word-problems-1", "quantitative", "Basic Word Problems", "Rates, ratios, percentages, mixtures", 1),
  node("q-word-problems-2", "quantitative", "Advanced Word Problems", "Work/rate, overlapping sets, Venn diagrams", 2, ["q-word-problems-1"]),
  node("q-statistics-1", "quantitative", "Statistics & Probability", "Mean, median, standard deviation, counting, probability", 1),
];

// ---------------------------------------------------------------------------
// Verbal Skill Nodes
// ---------------------------------------------------------------------------

export const verbalSkillNodes: SkillNode[] = [
  node("v-rc-main-idea", "verbal", "RC: Main Idea", "Identify the primary purpose or main point of a passage", 1),
  node("v-rc-inference", "verbal", "RC: Inference", "Draw conclusions not explicitly stated in the passage", 2, ["v-rc-main-idea"]),
  node("v-rc-detail", "verbal", "RC: Specific Detail", "Locate and interpret specific information in a passage", 1),
  node("v-cr-strengthen", "verbal", "CR: Strengthen", "Identify evidence that supports an argument's conclusion", 2),
  node("v-cr-weaken", "verbal", "CR: Weaken", "Identify evidence that undermines an argument's conclusion", 2),
  node("v-cr-assumption", "verbal", "CR: Assumption", "Identify unstated premises required by an argument", 3, ["v-cr-strengthen", "v-cr-weaken"]),
  node("v-cr-evaluate", "verbal", "CR: Evaluate", "Determine what information would help assess an argument", 3, ["v-cr-strengthen", "v-cr-weaken"]),
  node("v-cr-conclusion", "verbal", "CR: Draw Conclusion", "Identify what logically follows from given premises", 2),
];

// ---------------------------------------------------------------------------
// Data Insights Skill Nodes
// ---------------------------------------------------------------------------

export const dataInsightsSkillNodes: SkillNode[] = [
  node("di-ds-algebra", "data_insights", "DS: Algebraic", "Data sufficiency with algebraic reasoning", 2),
  node("di-ds-geometry", "data_insights", "DS: Geometric", "Data sufficiency with geometric reasoning", 2),
  node("di-ds-number", "data_insights", "DS: Number Properties", "Data sufficiency with number theory", 2),
  node("di-msr", "data_insights", "Multi-Source Reasoning", "Synthesize information from multiple data sources", 3),
  node("di-table", "data_insights", "Table Analysis", "Interpret and analyze tabular data", 2),
  node("di-graphics", "data_insights", "Graphics Interpretation", "Read and interpret charts, graphs, and diagrams", 2),
  node("di-tpa", "data_insights", "Two-Part Analysis", "Solve problems requiring two interdependent answers", 3),
];

// ---------------------------------------------------------------------------
// Combined
// ---------------------------------------------------------------------------

export const allSkillNodes: SkillNode[] = [
  ...quantitativeSkillNodes,
  ...verbalSkillNodes,
  ...dataInsightsSkillNodes,
];

export function getSkillNodesBySection(section: GmatSection): SkillNode[] {
  return allSkillNodes.filter((n) => n.section === section);
}
