#!/bin/bash
# Database setup script — creates all tables via Neon HTTP SQL API
# Uses curl instead of direct PostgreSQL connections

NEON_HOST="ep-wandering-mouse-ailbhw9r-pooler.c-4.us-east-1.aws.neon.tech"
CONN_STR="postgresql://neondb_owner:npg_kETydrztc5I0@${NEON_HOST}/neondb?sslmode=require"
API_URL="https://${NEON_HOST}/sql"

run_sql() {
  local desc="$1"
  local query="$2"
  local result
  result=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Neon-Connection-String: $CONN_STR" \
    -d "{\"query\": $(echo "$query" | jq -Rs .)}" 2>&1)

  if echo "$result" | jq -e '.error' > /dev/null 2>&1; then
    local err=$(echo "$result" | jq -r '.error // .message // "unknown"')
    if echo "$err" | grep -q "already exists"; then
      printf "  [skip] %s (already exists)\n" "$desc"
    else
      printf "  [FAIL] %s: %s\n" "$desc" "$err"
      return 1
    fi
  else
    printf "  [ok]   %s\n" "$desc"
  fi
}

echo "=== Creating GMAT Focus database schema ==="
echo ""

echo "--- Enums ---"
run_sql "GmatSection enum" "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GmatSection') THEN CREATE TYPE \"GmatSection\" AS ENUM ('quantitative', 'verbal', 'data_insights'); END IF; END \$\$"
run_sql "QuestionType enum" "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionType') THEN CREATE TYPE \"QuestionType\" AS ENUM ('problem_solving', 'reading_comprehension', 'critical_reasoning', 'data_sufficiency', 'multi_source_reasoning', 'table_analysis', 'graphics_interpretation', 'two_part_analysis'); END IF; END \$\$"
run_sql "SessionType enum" "DO \$\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionType') THEN CREATE TYPE \"SessionType\" AS ENUM ('drill', 'section_practice', 'full_exam'); END IF; END \$\$"

echo ""
echo "--- Tables ---"
run_sql "users" 'CREATE TABLE IF NOT EXISTS "users" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "email" VARCHAR(255) NOT NULL, "display_name" VARCHAR(100) NOT NULL, "target_score" INTEGER NOT NULL DEFAULT 705, "test_date" DATE, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "users_pkey" PRIMARY KEY ("id"))'
run_sql "skill_nodes" 'CREATE TABLE IF NOT EXISTS "skill_nodes" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "section" "GmatSection" NOT NULL, "name" VARCHAR(255) NOT NULL, "description" TEXT NOT NULL, "tier" INTEGER NOT NULL, "parent_ids" UUID[], "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "skill_nodes_pkey" PRIMARY KEY ("id"))'
run_sql "questions" 'CREATE TABLE IF NOT EXISTS "questions" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "section" "GmatSection" NOT NULL, "question_type" "QuestionType" NOT NULL, "difficulty_b" DOUBLE PRECISION NOT NULL, "discrimination_a" DOUBLE PRECISION NOT NULL, "guessing_c" DOUBLE PRECISION NOT NULL DEFAULT 0.2, "content" JSONB NOT NULL, "correct_answer" VARCHAR(10) NOT NULL, "explanation" TEXT NOT NULL, "estimated_time" INTEGER NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "questions_pkey" PRIMARY KEY ("id"))'
run_sql "skill_node_questions" 'CREATE TABLE IF NOT EXISTS "skill_node_questions" ("skill_node_id" UUID NOT NULL, "question_id" UUID NOT NULL, CONSTRAINT "skill_node_questions_pkey" PRIMARY KEY ("skill_node_id","question_id"))'
run_sql "learner_profiles" 'CREATE TABLE IF NOT EXISTS "learner_profiles" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "skill_node_id" UUID NOT NULL, "theta" DOUBLE PRECISION NOT NULL DEFAULT 0.0, "attempts" INTEGER NOT NULL DEFAULT 0, "correct" INTEGER NOT NULL DEFAULT 0, "last_practiced" TIMESTAMPTZ, "decay_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0, CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("id"))'
run_sql "question_attempts" 'CREATE TABLE IF NOT EXISTS "question_attempts" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "question_id" UUID NOT NULL, "session_id" UUID NOT NULL, "selected_answer" VARCHAR(10) NOT NULL, "is_correct" BOOLEAN NOT NULL, "time_spent" INTEGER NOT NULL, "was_bookmarked" BOOLEAN NOT NULL DEFAULT false, "was_edited" BOOLEAN NOT NULL DEFAULT false, "theta_before" DOUBLE PRECISION NOT NULL, "theta_after" DOUBLE PRECISION NOT NULL, "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id"))'
run_sql "exam_sessions" 'CREATE TABLE IF NOT EXISTS "exam_sessions" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "session_type" "SessionType" NOT NULL, "section_order" VARCHAR(100), "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMPTZ, "total_score" INTEGER, "quant_score" INTEGER, "verbal_score" INTEGER, "di_score" INTEGER, "edits_used" JSONB, CONSTRAINT "exam_sessions_pkey" PRIMARY KEY ("id"))'
run_sql "gamification" 'CREATE TABLE IF NOT EXISTS "gamification" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "xp_total" INTEGER NOT NULL DEFAULT 0, "level" INTEGER NOT NULL DEFAULT 1, "streak_days" INTEGER NOT NULL DEFAULT 0, "streak_last_date" DATE, "vault_unlocked" BOOLEAN NOT NULL DEFAULT false, "badges" JSONB NOT NULL DEFAULT '"'"'[]'"'"', "bookmark_xp" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "gamification_pkey" PRIMARY KEY ("id"))'

echo ""
echo "--- Indexes ---"
run_sql "users_email_key" 'CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")'
run_sql "learner_profiles_user_skill_key" 'CREATE UNIQUE INDEX IF NOT EXISTS "learner_profiles_user_id_skill_node_id_key" ON "learner_profiles"("user_id", "skill_node_id")'
run_sql "question_attempts_user_idx" 'CREATE INDEX IF NOT EXISTS "question_attempts_user_id_idx" ON "question_attempts"("user_id")'
run_sql "question_attempts_session_idx" 'CREATE INDEX IF NOT EXISTS "question_attempts_session_id_idx" ON "question_attempts"("session_id")'
run_sql "question_attempts_question_idx" 'CREATE INDEX IF NOT EXISTS "question_attempts_question_id_idx" ON "question_attempts"("question_id")'
run_sql "exam_sessions_user_idx" 'CREATE INDEX IF NOT EXISTS "exam_sessions_user_id_idx" ON "exam_sessions"("user_id")'
run_sql "gamification_user_key" 'CREATE UNIQUE INDEX IF NOT EXISTS "gamification_user_id_key" ON "gamification"("user_id")'

echo ""
echo "--- Foreign Keys ---"
run_sql "skill_node_questions→skill_nodes" 'DO $$ BEGIN ALTER TABLE "skill_node_questions" ADD CONSTRAINT "skill_node_questions_skill_node_id_fkey" FOREIGN KEY ("skill_node_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "skill_node_questions→questions" 'DO $$ BEGIN ALTER TABLE "skill_node_questions" ADD CONSTRAINT "skill_node_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "learner_profiles→users" 'DO $$ BEGIN ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "learner_profiles→skill_nodes" 'DO $$ BEGIN ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_skill_node_id_fkey" FOREIGN KEY ("skill_node_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→users" 'DO $$ BEGIN ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→questions" 'DO $$ BEGIN ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→exam_sessions" 'DO $$ BEGIN ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "exam_sessions→users" 'DO $$ BEGIN ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "gamification→users" 'DO $$ BEGIN ALTER TABLE "gamification" ADD CONSTRAINT "gamification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'

echo ""
echo "--- Verification ---"
result=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Neon-Connection-String: $CONN_STR" \
  -d '{"query": "SELECT tablename FROM pg_tables WHERE schemaname = '"'"'public'"'"' ORDER BY tablename"}')

echo "Tables in database:"
echo "$result" | jq -r '.rows[].tablename' 2>/dev/null

echo ""
echo "=== Database setup complete ==="
