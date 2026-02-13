# PROJECT_MEMORY.md — GMAT Focus Edition Adaptive Learning Platform

> Persistent architectural context file. Updated continuously across sessions.

---

## 1. Project Overview

A heavily gamified, adaptive study platform for the **GMAT Focus Edition** targeting **705+ (98.6th percentile)** for M7 Business School admission. The platform uses Item Response Theory (IRT) maximum likelihood estimation to dynamically track user proficiency and serve optimally challenging questions.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Mobile-first SSR/SSG web app, React Server Components, API routes as backend |
| **Language** | TypeScript (strict mode) | Type safety across full stack; enforces domain model correctness |
| **Testing** | Vitest + @testing-library/react | Fast ES-module-native test runner, compatible with TypeScript |
| **Database** | PostgreSQL via Supabase | Managed Postgres with real-time subscriptions, Row Level Security, auth |
| **ORM** | Prisma | Type-safe DB access, migration management, schema-first design |
| **Styling** | Tailwind CSS 4 | Utility-first, mobile-first responsive design |
| **State Management** | Zustand | Lightweight, TypeScript-friendly client state |
| **Linting** | ESLint + Prettier | Code quality enforcement |
| **Package Manager** | pnpm | Fast, disk-efficient, strict dependency resolution |
| **CI/CD** | GitHub Actions | Automated test/lint/build pipeline |

---

## 3. GMAT Focus Edition Domain Constraints (IMMUTABLE)

### Scoring Rules
- **Total Score**: 205–805 (always ends in 5)
- **Section Scores**: 60–90 (integer)
- **Sections equally weighted**
- 705 Focus = 98.6th percentile = ~740 legacy GMAT

### Section Specifications

| Section | Questions | Duration | Question Types | Calculator |
|---|---|---|---|---|
| Quantitative Reasoning | 21 | 45 min | Problem Solving ONLY (Arithmetic, Algebra). **NO GEOMETRY.** | **No** |
| Verbal Reasoning | 23 | 45 min | Reading Comprehension, Critical Reasoning. **NO SENTENCE CORRECTION.** | **No** |
| Data Insights | 20 | 45 min | Data Sufficiency, Multi-Source Reasoning, Table Analysis, Graphics Interpretation, Two-Part Analysis | **Yes** |

### Testing Mechanics
- Users can **bookmark** unlimited questions during a section
- Users can **review & edit up to 3 answers** per section at the end
- Strategic abandonment training is core to the platform

---

## 4. Application Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│  ┌───────────────────────────────────────────┐  │
│  │          Frontend (React/TSX)             │  │
│  │  - Executive Command Center Dashboard     │  │
│  │  - Adaptive Drill Interface               │  │
│  │  - Full Exam Simulator (Review & Edit)    │  │
│  │  - Gamification Overlays                  │  │
│  │  - Knowledge Decay Visualizations         │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                           │
│  ┌───────────────────▼───────────────────────┐  │
│  │        API Routes / Server Actions        │  │
│  │  - /api/tutor-engine/*                    │  │
│  │  - /api/exam-session/*                    │  │
│  │  - /api/gamification/*                    │  │
│  └───────────────────┬───────────────────────┘  │
│                      │                           │
│  ┌───────────────────▼───────────────────────┐  │
│  │           TutorEngine Module              │  │
│  │  ┌─────────────┐ ┌──────────────┐        │  │
│  │  │Expert Model │ │Learner Model │        │  │
│  │  │(Skill Graph)│ │ (IRT θ vec)  │        │  │
│  │  └──────┬──────┘ └──────┬───────┘        │  │
│  │         └───────┬───────┘                 │  │
│  │         ┌───────▼───────┐                 │  │
│  │         │  Tutor Model  │                 │  │
│  │         │ (Orchestrator)│                 │  │
│  │         └───────────────┘                 │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │  PostgreSQL/Supabase│
            │  - Users            │
            │  - Skill Nodes      │
            │  - Questions        │
            │  - Attempts         │
            │  - Learner Profiles │
            │  - Gamification     │
            └─────────────────────┘
```

---

## 5. Database Schema Design

### Table: `skill_nodes` (Expert Model)
```sql
id              UUID PRIMARY KEY
section         ENUM('quantitative', 'verbal', 'data_insights')
name            VARCHAR(255)          -- e.g., "Absolute Value Inequalities"
description     TEXT
tier            INT                   -- 1=foundational, 2=intermediate, 3=advanced, 4=elite(700+)
parent_ids      UUID[]                -- dependency graph edges
created_at      TIMESTAMPTZ
```

### Table: `questions`
```sql
id              UUID PRIMARY KEY
section         ENUM('quantitative', 'verbal', 'data_insights')
question_type   ENUM('problem_solving', 'reading_comprehension', 'critical_reasoning',
                     'data_sufficiency', 'multi_source_reasoning', 'table_analysis',
                     'graphics_interpretation', 'two_part_analysis')
skill_node_ids  UUID[]                -- tags to skill nodes (many-to-many)
difficulty_b    FLOAT                 -- IRT difficulty parameter b ∈ [-3, 3]
discrimination_a FLOAT               -- IRT discrimination parameter a > 0
guessing_c      FLOAT DEFAULT 0.2    -- 5 options = 20% chance
content         JSONB                 -- question text, passages, options, graphics metadata
correct_answer  VARCHAR(10)           -- "A","B","C","D","E" or composite for two-part
explanation     TEXT
estimated_time  INT                   -- seconds (for pacing analytics)
created_at      TIMESTAMPTZ
```

### Table: `users`
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE
display_name    VARCHAR(100)
target_score    INT DEFAULT 705       -- user's target GMAT Focus score
test_date       DATE                  -- scheduled exam date
created_at      TIMESTAMPTZ
```

### Table: `learner_profiles` (Learner Model)
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
skill_node_id   UUID REFERENCES skill_nodes(id)
theta           FLOAT DEFAULT 0.0    -- proficiency estimate θ ∈ [-3, 3]
attempts        INT DEFAULT 0
correct          INT DEFAULT 0
last_practiced  TIMESTAMPTZ
decay_factor    FLOAT DEFAULT 1.0    -- 1.0 = full mastery display, decays over time
UNIQUE(user_id, skill_node_id)
```

### Table: `question_attempts`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
question_id     UUID REFERENCES questions(id)
session_id      UUID                  -- groups attempts into exam sessions
selected_answer VARCHAR(10)
is_correct      BOOLEAN
time_spent      INT                   -- seconds
was_bookmarked  BOOLEAN DEFAULT FALSE
was_edited      BOOLEAN DEFAULT FALSE -- was answer changed during review
theta_before    FLOAT                 -- θ before this attempt
theta_after     FLOAT                 -- θ after update
created_at      TIMESTAMPTZ
```

### Table: `exam_sessions`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
session_type    ENUM('drill', 'section_practice', 'full_exam')
section_order   VARCHAR(100)          -- e.g., "quant,verbal,di" user-chosen order
started_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ
total_score     INT                   -- 205-805 (ends in 5)
quant_score     INT                   -- 60-90
verbal_score    INT                   -- 60-90
di_score        INT                   -- 60-90
edits_used      JSONB                 -- tracks review/edit usage per section {quant: 2, verbal: 1, di: 3}
```

### Table: `gamification`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
xp_total        INT DEFAULT 0
level           INT DEFAULT 1
streak_days     INT DEFAULT 0
streak_last_date DATE
vault_unlocked  BOOLEAN DEFAULT FALSE  -- 700+ question vault
badges          JSONB DEFAULT '[]'
bookmark_xp     INT DEFAULT 0          -- XP earned from strategic bookmark usage
```

---

## 6. TutorEngine Module Structure

### 6.1 IRT Probability Model (3-Parameter Logistic)
```
P(θ) = c + (1 - c) / (1 + e^(-a(θ - b)))
```
- `θ` = learner proficiency (estimated per skill node)
- `b` = item difficulty parameter
- `a` = item discrimination parameter
- `c` = guessing parameter (default 0.2 for 5-choice MCQ)

### 6.2 Theta Update via Maximum Likelihood Estimation
After each response, update θ using Newton-Raphson iteration:
```
θ_new = θ_old + Σ[a_i * (x_i - P_i(θ))] / Σ[a_i^2 * P_i(θ) * (1 - P_i(θ))]
```
Where x_i = 1 if correct, 0 if incorrect.

### 6.3 Question Selection Algorithm
1. Query all questions tagged to skill nodes where user is **underperforming** relative to 705-baseline θ
2. Filter to questions where |θ_user - b_question| is minimized
3. Prioritize nodes with fewest recent attempts and highest decay
4. Apply spaced repetition weighting

### 6.4 GMAT Focus Score Concordance
Maps section θ values (continuous) to section scores (60–90 integer) and aggregates to total score (205–805, ending in 5).

Mapping logic (piecewise linear interpolation):
- θ = -3.0 → Section score = 60
- θ =  0.0 → Section score = 75
- θ =  3.0 → Section score = 90

Total score = `round_to_nearest_5(205 + (sum_of_section_scores - 180) * (600 / 90))`
- Where section scores sum from 180 (all 60s) to 270 (all 90s)
- Total maps from 205 to 805

---

## 7. Gamification Mechanics (Octalysis Framework)

| Core Drive | Implementation | Data Model Impact |
|---|---|---|
| Epic Meaning | "Executive Command Center" dashboard theme | UI/UX only |
| Accomplishment | XP system, level progression, visual progress bars | `gamification.xp_total`, `gamification.level` |
| Scarcity | Tier-4 "Vault" locked until 90% accuracy in foundational tiers | `gamification.vault_unlocked`, question tier filtering |
| Loss Avoidance | Knowledge Decay bars — 7-day inactivity degrades mastery display | `learner_profiles.decay_factor`, `learner_profiles.last_practiced` |
| Strategic Time | Bonus XP for successful bookmark-then-solve pattern | `gamification.bookmark_xp`, `question_attempts.was_bookmarked` |
| Ownership | Customizable dashboard, section order preference | User preferences |
| Social Influence | Anonymized percentile leaderboards | Aggregate scoring queries |

---

## 8. File Structure Plan

```
GMAT_Focus_Game.V1/
├── PROJECT_MEMORY.md
├── init.sh
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── prisma/
│   └── schema.prisma
├── src/
│   ├── lib/
│   │   ├── tutor-engine/
│   │   │   ├── irt.ts              -- IRT probability & theta update functions
│   │   │   ├── scoring.ts          -- GMAT Focus score concordance logic
│   │   │   ├── question-selector.ts -- Adaptive question selection algorithm
│   │   │   ├── decay.ts            -- Knowledge decay calculations
│   │   │   └── types.ts            -- TypeScript interfaces for TutorEngine
│   │   ├── constants/
│   │   │   └── gmat-focus.ts       -- GMAT Focus domain constants
│   │   └── utils/
│   │       └── math.ts             -- Shared math utilities
│   ├── app/                         -- Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── drill/
│   │   ├── exam/
│   │   └── api/
│   │       ├── tutor-engine/
│   │       ├── exam-session/
│   │       └── gamification/
│   └── components/
│       ├── ui/
│       ├── dashboard/
│       ├── exam/
│       └── gamification/
├── tests/
│   ├── unit/
│   │   ├── irt.test.ts
│   │   ├── scoring.test.ts
│   │   ├── question-selector.test.ts
│   │   └── decay.test.ts
│   └── integration/
└── public/
```

---

## 9. Task Tracking

### Completed
- [x] PROJECT_MEMORY.md created

### In Progress
- [ ] init.sh script
- [ ] Project initialization & dependency installation
- [ ] First batch of failing unit tests

### Pending
- [ ] Core TutorEngine implementation (awaiting user approval)
- [ ] Prisma schema and migrations
- [ ] API routes
- [ ] Frontend components
- [ ] Gamification layer
- [ ] Full exam simulator with Review & Edit
- [ ] Knowledge decay system
- [ ] Seeding script for question bank

---

## 10. Key Architectural Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo vs Microservices | Monorepo (Next.js full-stack) | Simpler deployment, shared types, faster iteration for MVP |
| Test Runner | Vitest over Jest | Native ESM support, faster execution, Vite ecosystem |
| Database | Supabase (Postgres) | Managed hosting, auth built-in, real-time for leaderboards |
| ORM | Prisma | Type-safe queries, migration management, schema-first |
| IRT Model | 3-Parameter Logistic (3PL) | Accounts for guessing (c param), standard in psychometrics |
| Score Mapping | Piecewise linear interpolation | Simple, deterministic, testable concordance |
