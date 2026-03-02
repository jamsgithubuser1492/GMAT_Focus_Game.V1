/**
 * Database Seed Script
 *
 * Populates the Neon database with skill nodes, questions, and their mappings.
 * Uses the Neon serverless HTTP API via curl (to bypass sandbox restrictions).
 *
 * Run: npx tsx prisma/seed.ts
 */

import { execSync } from "node:child_process";
import { quantitativeQuestions } from "../src/lib/question-bank/quantitative";
import { verbalQuestions } from "../src/lib/question-bank/verbal";
import { dataInsightsQuestions } from "../src/lib/question-bank/data-insights";
import { allSkillNodes } from "../src/lib/question-bank/skill-nodes";
import type { Question } from "../src/lib/tutor-engine/types";

// ---------------------------------------------------------------------------
// Neon HTTP API helper
// ---------------------------------------------------------------------------

const NEON_HOST = "ep-wandering-mouse-ailbhw9r-pooler.c-4.us-east-1.aws.neon.tech";
const CONN_STR = `postgresql://neondb_owner:npg_kETydrztc5I0@${NEON_HOST}/neondb?sslmode=require`;
const API_URL = `https://${NEON_HOST}/sql`;

function runSQL(query: string): unknown {
  const payload = JSON.stringify({ query });
  const result = execSync(
    `curl -s -X POST "${API_URL}" ` +
      `-H "Content-Type: application/json" ` +
      `-H "Neon-Connection-String: ${CONN_STR}" ` +
      `-d '${payload.replace(/'/g, "'\\''")}'`,
    { encoding: "utf-8", timeout: 15000 },
  );
  return JSON.parse(result);
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

// ---------------------------------------------------------------------------
// Seed Skill Nodes
// ---------------------------------------------------------------------------

function seedSkillNodes() {
  console.log("Seeding skill nodes...");

  for (const node of allSkillNodes) {
    const parentIdsSQL =
      node.parentIds.length > 0
        ? `ARRAY[${node.parentIds.map((id) => `'${id}'`).join(",")}]::text[]`
        : "'{}'::text[]";

    const query = `INSERT INTO skill_nodes (id, section, name, description, tier, parent_ids)
      VALUES ('${node.id}', '${node.section}', '${escapeSQL(node.name)}', '${escapeSQL(node.description)}', ${node.tier}, ${parentIdsSQL})
      ON CONFLICT (id) DO NOTHING`;

    runSQL(query);
    process.stdout.write(".");
  }
  console.log(` ${allSkillNodes.length} skill nodes`);
}

// ---------------------------------------------------------------------------
// Seed Questions
// ---------------------------------------------------------------------------

function seedQuestions(questions: Question[], label: string) {
  console.log(`Seeding ${label}...`);

  for (const q of questions) {
    const contentEscaped = escapeSQL(
      typeof q.content === "string" ? q.content : JSON.stringify(q.content),
    );

    const query = `INSERT INTO questions (id, section, question_type, difficulty_b, discrimination_a, guessing_c, content, correct_answer, explanation, estimated_time)
      VALUES ('${q.id}', '${q.section}', '${q.questionType}', ${q.difficulty}, ${q.discrimination}, ${q.guessing}, '${contentEscaped}', '${escapeSQL(q.correctAnswer)}', '${escapeSQL(q.explanation)}', ${q.estimatedTimeSeconds})
      ON CONFLICT (id) DO NOTHING`;

    runSQL(query);

    // Seed skill_node_questions mapping
    for (const skillNodeId of q.skillNodeIds) {
      const mappingQuery = `INSERT INTO skill_node_questions (skill_node_id, question_id)
        VALUES ('${skillNodeId}', '${q.id}')
        ON CONFLICT (skill_node_id, question_id) DO NOTHING`;
      runSQL(mappingQuery);
    }

    process.stdout.write(".");
  }
  console.log(` ${questions.length} questions`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== GMAT Focus Database Seed ===\n");

  // Test connection
  const test = runSQL("SELECT COUNT(*) as count FROM skill_nodes") as {
    rows: { count: string }[];
  };
  console.log(`Current skill_nodes count: ${test.rows[0]?.count ?? 0}`);

  seedSkillNodes();
  seedQuestions(quantitativeQuestions, "Quantitative (25 questions)");
  seedQuestions(verbalQuestions, "Verbal (25 questions)");
  seedQuestions(dataInsightsQuestions, "Data Insights (25 questions)");

  // Verify
  const skillCount = runSQL("SELECT COUNT(*) as count FROM skill_nodes") as {
    rows: { count: string }[];
  };
  const questionCount = runSQL("SELECT COUNT(*) as count FROM questions") as {
    rows: { count: string }[];
  };
  const mappingCount = runSQL(
    "SELECT COUNT(*) as count FROM skill_node_questions",
  ) as { rows: { count: string }[] };

  console.log("\n=== Verification ===");
  console.log(`Skill nodes: ${skillCount.rows[0]?.count}`);
  console.log(`Questions:   ${questionCount.rows[0]?.count}`);
  console.log(`Mappings:    ${mappingCount.rows[0]?.count}`);
  console.log("\nSeed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
