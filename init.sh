#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# GMAT Focus Edition Adaptive Learning Platform — Environment Init Script
# ============================================================================
# Usage: bash init.sh [command]
# Commands:
#   setup     - Full project setup (install deps, generate prisma client, run linter)
#   test      - Run the full test suite via Vitest
#   test:watch - Run tests in watch mode
#   lint      - Run ESLint + Prettier checks
#   lint:fix  - Auto-fix lint issues
#   dev       - Start Next.js dev server
#   build     - Production build
#   db:push   - Push Prisma schema to database
#   db:seed   - Seed the database with initial data
#   all       - Run lint + tests + build (CI pipeline)
#   help      - Show this help message
# ============================================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
check_prerequisites() {
  log_step "Checking prerequisites"

  if ! command -v node &>/dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
  fi

  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ required. Found: $(node -v)"
    exit 1
  fi
  log_ok "Node.js $(node -v)"

  if command -v pnpm &>/dev/null; then
    PKG_MGR="pnpm"
  elif command -v npm &>/dev/null; then
    PKG_MGR="npm"
    log_warn "pnpm not found — falling back to npm. Consider: npm install -g pnpm"
  else
    log_error "No package manager found. Install pnpm or npm."
    exit 1
  fi
  log_ok "Package manager: $PKG_MGR"
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
cmd_setup() {
  check_prerequisites
  log_step "Installing dependencies"
  $PKG_MGR install
  log_ok "Dependencies installed"

  if [ -f "prisma/schema.prisma" ]; then
    log_step "Generating Prisma client"
    npx prisma generate
    log_ok "Prisma client generated"
  fi

  log_step "Running lint check"
  $PKG_MGR run lint || log_warn "Lint issues detected — run 'bash init.sh lint:fix'"

  log_ok "Setup complete!"
}

cmd_test() {
  log_step "Running test suite"
  npx vitest run --reporter=verbose
}

cmd_test_watch() {
  log_step "Running tests in watch mode"
  npx vitest --reporter=verbose
}

cmd_lint() {
  log_step "Running ESLint"
  npx eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' --max-warnings=0
  log_step "Running Prettier check"
  npx prettier --check 'src/**/*.{ts,tsx,json}' 'tests/**/*.ts'
  log_ok "All lint checks passed"
}

cmd_lint_fix() {
  log_step "Fixing lint issues"
  npx eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' --fix
  npx prettier --write 'src/**/*.{ts,tsx,json}' 'tests/**/*.ts'
  log_ok "Lint fixes applied"
}

cmd_dev() {
  log_step "Starting Next.js dev server"
  npx next dev
}

cmd_build() {
  log_step "Building for production"
  npx next build
  log_ok "Build complete"
}

cmd_db_push() {
  log_step "Pushing Prisma schema to database"
  npx prisma db push
  log_ok "Database schema updated"
}

cmd_db_seed() {
  log_step "Seeding database"
  npx prisma db seed
  log_ok "Database seeded"
}

cmd_all() {
  log_step "Full CI Pipeline: lint → test → build"
  cmd_lint
  cmd_test
  cmd_build
  log_ok "All checks passed!"
}

cmd_help() {
  echo -e "${BOLD}GMAT Focus Platform — init.sh${NC}"
  echo ""
  echo "Usage: bash init.sh [command]"
  echo ""
  echo "Commands:"
  echo "  setup      Full project setup (install, generate, lint)"
  echo "  test       Run full test suite"
  echo "  test:watch Run tests in watch mode"
  echo "  lint       Run ESLint + Prettier checks"
  echo "  lint:fix   Auto-fix lint issues"
  echo "  dev        Start Next.js dev server"
  echo "  build      Production build"
  echo "  db:push    Push Prisma schema to database"
  echo "  db:seed    Seed database with initial data"
  echo "  all        Full CI pipeline (lint + test + build)"
  echo "  help       Show this help message"
}

# ---------------------------------------------------------------------------
# Main entrypoint
# ---------------------------------------------------------------------------
COMMAND="${1:-help}"

case "$COMMAND" in
  setup)      cmd_setup ;;
  test)       cmd_test ;;
  test:watch) cmd_test_watch ;;
  lint)       cmd_lint ;;
  lint:fix)   cmd_lint_fix ;;
  dev)        cmd_dev ;;
  build)      cmd_build ;;
  db:push)    cmd_db_push ;;
  db:seed)    cmd_db_seed ;;
  all)        cmd_all ;;
  help)       cmd_help ;;
  *)
    log_error "Unknown command: $COMMAND"
    cmd_help
    exit 1
    ;;
esac
