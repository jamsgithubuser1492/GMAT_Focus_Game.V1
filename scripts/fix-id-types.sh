#!/bin/bash
# Fix ID columns from UUID to TEXT to match the application's string-based IDs

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

  if echo "$result" | jq -e '.message' > /dev/null 2>&1; then
    local err=$(echo "$result" | jq -r '.message // "unknown"')
    printf "  [FAIL] %s: %s\n" "$desc" "$err"
  else
    printf "  [ok]   %s\n" "$desc"
  fi
}

echo "=== Fixing ID column types (UUID → TEXT) ==="
echo ""

# Drop all foreign keys first
echo "--- Dropping Foreign Keys ---"
run_sql "drop fk skill_node_questions→skill_nodes" "ALTER TABLE skill_node_questions DROP CONSTRAINT IF EXISTS skill_node_questions_skill_node_id_fkey"
run_sql "drop fk skill_node_questions→questions" "ALTER TABLE skill_node_questions DROP CONSTRAINT IF EXISTS skill_node_questions_question_id_fkey"
run_sql "drop fk learner_profiles→users" "ALTER TABLE learner_profiles DROP CONSTRAINT IF EXISTS learner_profiles_user_id_fkey"
run_sql "drop fk learner_profiles→skill_nodes" "ALTER TABLE learner_profiles DROP CONSTRAINT IF EXISTS learner_profiles_skill_node_id_fkey"
run_sql "drop fk question_attempts→users" "ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_user_id_fkey"
run_sql "drop fk question_attempts→questions" "ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_question_id_fkey"
run_sql "drop fk question_attempts→exam_sessions" "ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_session_id_fkey"
run_sql "drop fk exam_sessions→users" "ALTER TABLE exam_sessions DROP CONSTRAINT IF EXISTS exam_sessions_user_id_fkey"
run_sql "drop fk gamification→users" "ALTER TABLE gamification DROP CONSTRAINT IF EXISTS gamification_user_id_fkey"

echo ""
echo "--- Altering Column Types ---"

# Users
run_sql "users.id" "ALTER TABLE users ALTER COLUMN id TYPE TEXT"

# Skill Nodes
run_sql "skill_nodes.id" "ALTER TABLE skill_nodes ALTER COLUMN id TYPE TEXT"
run_sql "skill_nodes.parent_ids" "ALTER TABLE skill_nodes ALTER COLUMN parent_ids TYPE TEXT[] USING parent_ids::TEXT[]"

# Questions
run_sql "questions.id" "ALTER TABLE questions ALTER COLUMN id TYPE TEXT"

# Skill Node Questions
run_sql "skill_node_questions.skill_node_id" "ALTER TABLE skill_node_questions ALTER COLUMN skill_node_id TYPE TEXT"
run_sql "skill_node_questions.question_id" "ALTER TABLE skill_node_questions ALTER COLUMN question_id TYPE TEXT"

# Learner Profiles
run_sql "learner_profiles.id" "ALTER TABLE learner_profiles ALTER COLUMN id TYPE TEXT"
run_sql "learner_profiles.user_id" "ALTER TABLE learner_profiles ALTER COLUMN user_id TYPE TEXT"
run_sql "learner_profiles.skill_node_id" "ALTER TABLE learner_profiles ALTER COLUMN skill_node_id TYPE TEXT"

# Question Attempts
run_sql "question_attempts.id" "ALTER TABLE question_attempts ALTER COLUMN id TYPE TEXT"
run_sql "question_attempts.user_id" "ALTER TABLE question_attempts ALTER COLUMN user_id TYPE TEXT"
run_sql "question_attempts.question_id" "ALTER TABLE question_attempts ALTER COLUMN question_id TYPE TEXT"
run_sql "question_attempts.session_id" "ALTER TABLE question_attempts ALTER COLUMN session_id TYPE TEXT"

# Exam Sessions
run_sql "exam_sessions.id" "ALTER TABLE exam_sessions ALTER COLUMN id TYPE TEXT"
run_sql "exam_sessions.user_id" "ALTER TABLE exam_sessions ALTER COLUMN user_id TYPE TEXT"

# Gamification
run_sql "gamification.id" "ALTER TABLE gamification ALTER COLUMN id TYPE TEXT"
run_sql "gamification.user_id" "ALTER TABLE gamification ALTER COLUMN user_id TYPE TEXT"

echo ""
echo "--- Recreating Foreign Keys ---"
run_sql "skill_node_questions→skill_nodes" 'DO $$ BEGIN ALTER TABLE skill_node_questions ADD CONSTRAINT skill_node_questions_skill_node_id_fkey FOREIGN KEY (skill_node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "skill_node_questions→questions" 'DO $$ BEGIN ALTER TABLE skill_node_questions ADD CONSTRAINT skill_node_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "learner_profiles→users" 'DO $$ BEGIN ALTER TABLE learner_profiles ADD CONSTRAINT learner_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "learner_profiles→skill_nodes" 'DO $$ BEGIN ALTER TABLE learner_profiles ADD CONSTRAINT learner_profiles_skill_node_id_fkey FOREIGN KEY (skill_node_id) REFERENCES skill_nodes(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→users" 'DO $$ BEGIN ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→questions" 'DO $$ BEGIN ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "question_attempts→exam_sessions" 'DO $$ BEGIN ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "exam_sessions→users" 'DO $$ BEGIN ALTER TABLE exam_sessions ADD CONSTRAINT exam_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'
run_sql "gamification→users" 'DO $$ BEGIN ALTER TABLE gamification ADD CONSTRAINT gamification_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$'

echo ""
echo "=== Done ==="
