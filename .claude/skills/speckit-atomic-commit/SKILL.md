---
name: "speckit-atomic-commit"
description: "Analyze all unstaged and staged changes, group them into atomic logical units, and execute well-crafted conventional commits one by one. Each commit covers a single responsibility and passes git hooks."
argument-hint: "Optional: 'plan' to only show the commit plan without executing, or 'execute' to run immediately without confirmation"
compatibility: "Requires a git repository. Works best with spec-kit project structure."
metadata:
  author: "proyecto-hotel"
  source: "skills/speckit-atomic-commit"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

Modes:
- `plan` → show the proposed commit plan, do NOT execute any commit
- `execute` → execute commits directly without asking for per-commit confirmation
- *(empty)* → show the plan, then ask for confirmation before executing

## Outline

### Phase 1: Gather State

1. Run the following commands in parallel and capture all output:
   ```sh
   git status --short
   git diff HEAD
   git diff --cached
   git log --oneline -10
   git branch --show-current
   ```

2. If working tree is completely clean → report "Nothing to commit" and stop.

3. Parse `git status --short` output and classify every changed file:

   | Symbol | Meaning |
   |--------|---------|
   | `M`    | Modified (unstaged) |
   | `A`    | Added / new (staged) |
   | `??`   | Untracked |
   | `D`    | Deleted |
   | `R`    | Renamed |
   | `MM`   | Modified both staged and unstaged |

4. Stage ALL changes for analysis: `git add -A`
   Then immediately run `git diff --cached --name-status` to get the full staged picture.

---

### Phase 2: Group into Atomic Commits

Analyze the complete file list and group files into **atomic commit units** following these rules:

#### Grouping Rules

**Rule 1 — One responsibility per commit**
Each commit must answer "what does this change do?" in a single sentence.
Never mix migrations with middleware, routes with documentation, etc.

**Rule 2 — Natural grouping categories** (in recommended commit order):

| Priority | Category | Conventional Type | Typical files |
|----------|----------|------------------|---------------|
| 1 | Project setup & config | `chore` | package.json, knexfile.js, .gitignore, .env.example, tsconfig |
| 2 | Database migrations | `feat` | `migrations/00N_*.js` |
| 3 | Core infrastructure | `feat` | database.js, logger.js, error-handler.js, base.repository.js |
| 4 | Middleware | `feat` | `middlewares/*.js` |
| 5 | Module skeleton | `chore` | empty module files (routes, controller, service, repository, schema) |
| 6 | Feature implementation | `feat` | non-empty module files with real logic |
| 7 | API entry point | `feat` | app.js, server.js |
| 8 | Documentation & specs | `docs` | `docs/`, `specs/`, `*.md` (non-spec files) |
| 9 | Tests | `test` | `tests/`, `*.test.js`, `*.spec.js` |

**Rule 3 — Migration commits are always individual**
Each migration file gets its own commit ONLY if it introduces a distinct schema concept.
Exception: if all migrations are new (initial setup), group them as one `feat(db): initialize database schema`.

**Rule 4 — Empty skeleton files = one chore commit**
All empty module scaffolding files (0 bytes or only whitespace) → single commit:
`chore(modules): scaffold module structure for {list of modules}`

**Rule 5 — Spec/task files go last**
Changes to `specs/`, `tasks.md`, `plan.md` always go in the final commit as `docs`.

**Rule 6 — Never commit secrets**
If any file contains patterns like `password=`, `secret=`, `token=`, `DATABASE_URL=` with a real value → **STOP**, warn the user, exclude the file.

**Rule 7 — Respect logical order**
Commits must be orderable so that each builds on the previous.
If B depends on A, commit A first.

---

### Phase 3: Build the Commit Plan

Present the plan as a numbered table. Example format:

```
## Proposed Commit Plan

Branch: 001-db-design-setup
Total commits: 5

| # | Type | Scope | Message | Files |
|---|------|-------|---------|-------|
| 1 | chore | setup | initialize Node.js backend project structure | package.json, knexfile.js, .env.example, .gitignore |
| 2 | feat | db | initialize database schema with 25 tables and critical indexes | migrations/001_*.js ... migrations/010_*.js |
| 3 | feat | core | add database connection, logger, and centralized error handler | src/config/database.js, src/utils/logger.js, src/middlewares/error-handler.js |
| 4 | feat | middleware | add RBAC guard and idempotency middleware skeletons | src/middlewares/auth.guard.js, src/middlewares/idempotency.js |
| 5 | chore | modules | scaffold 10 feature module directories | src/modules/**/*.js (empty) |
| 6 | feat | api | implement Express app with health check and Swagger | src/app.js, src/server.js, src/config/swagger.js |
| 7 | feat | core | add base repository with transactions and pessimistic locking | src/modules/base.repository.js |
| 8 | docs | specs | update task tracking and spec artifacts | specs/001-db-design-setup/tasks.md |

Estimated commits: 8
```

Then show the full conventional commit message for each planned commit:

```
## Commit Messages Preview

### Commit 1
chore(setup): initialize Node.js backend project structure

Set up package.json with Express, Knex, pg, Joi, Winston and dotenv.
Add knexfile.js with dev/test/prod environments and SSL config for Railway.
Add .env.example with all required variables documented.
Add .gitignore for Node.js, env files, and OS artifacts.

### Commit 2
feat(db): initialize database schema with 25 tables and critical indexes

Add 10 sequential Knex migrations covering all entities defined in
CONTEXTO_MAESTRO.md:
- 001: users (RBAC roles ENUM) + refresh_tokens
- 002: media_library + rooms (slug, amenities JSONB) + room_media
- 003: plans + plan_media + plan_activities + optional_activities + plan_optional_activities
- 004: availability (total_slots, blocked_slots) + seasons
- 005: reservations (5-state ENUM) + activity_snapshot + optional_activities
- 006: payment_attempts + payments + idempotency_keys (24h TTL)
- 007: suppliers + inventory_items (category ENUM) + inventory_movements
- 008: site_content (section+key unique) + faqs + business_config + audit_logs
- 009: critical partial indexes (idx_availability_lookup, idx_reservations_active, etc.)
- 010: check_availability() PL/pgSQL function + audit triggers + pg_cron cleanup

... (and so on for each commit)
```

---

### Phase 4: Confirm and Execute

**If mode is `plan`**: Stop here. Do not execute any git command.

**If mode is `execute`**: Skip confirmation and proceed to execution.

**If mode is empty (default)**:
Ask the user:
```
Ready to execute 8 commits on branch 001-db-design-setup.

Options:
  [A] Execute all commits as planned
  [E] Edit the plan before executing
  [S] Skip specific commits (enter numbers to skip)
  [C] Cancel

Your choice:
```
Wait for response before proceeding.

---

### Phase 5: Execute Commits

For each commit in the plan (in order):

1. Stage only the files for this commit:
   ```sh
   git add {file1} {file2} ...
   ```

2. Verify staged files match plan:
   ```sh
   git diff --cached --name-only
   ```

3. Create the commit:
   ```sh
   git commit -m "$(cat <<'EOF'
   {type}({scope}): {subject}

   {body}

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

4. On success: report `✓ Commit {N}/{total}: {message_summary}`

5. On failure (hook rejection or other error):
   - Report the error clearly
   - Do NOT skip silently
   - Ask the user: `Commit {N} failed. Fix and retry, skip this commit, or abort all?`
   - Never use `--no-verify` unless the user explicitly requests it

6. After all commits: run `git log --oneline -{total}` and display the result.

---

### Phase 6: Post-Execution Summary

Display a final summary:

```
## Commit Summary

Branch: 001-db-design-setup
Commits created: 8/8

| # | Commit SHA | Message |
|---|-----------|---------|
| 1 | abc1234 | chore(setup): initialize Node.js backend project structure |
| 2 | def5678 | feat(db): initialize database schema with 25 tables |
...

Next step: run /speckit-atomic-commit to commit any remaining changes,
or push to remote when ready.
```

---

## Conventional Commit Types Reference

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability added |
| `fix` | Bug fix |
| `refactor` | Code restructure without behavior change |
| `chore` | Tooling, scaffolding, config, dependencies |
| `docs` | Documentation only |
| `test` | Adding or modifying tests |
| `style` | Formatting, whitespace (no logic change) |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or external dependencies |
| `revert` | Revert a previous commit |

## Scope Conventions (this project)

| Scope | Covers |
|-------|--------|
| `setup` | Project initialization, config files |
| `db` | Migrations, database config |
| `core` | Shared infrastructure (logger, errors, base repo) |
| `middleware` | Express middleware |
| `modules` | Module scaffolding or feature code |
| `api` | app.js, server.js, routing |
| `auth` | Authentication / authorization |
| `specs` | Spec artifacts in specs/ directory |
| `docs` | Documentation files in docs/ |
| `ci` | GitHub Actions, Docker, Railway config |

## Key Rules

- **Atomic**: each commit compiles/runs independently and represents one logical change
- **Never `--no-verify`** unless user explicitly says so
- **Never commit `.env`** files with real values — check for secrets before staging
- **Order matters**: migrations before app code, infrastructure before features
- **Subject line**: imperative mood, max 72 chars, no period at end
- **Body**: explain the *what* and *why*, not the *how*; reference spec tasks when relevant
- **Empty files**: always group into a single `chore` commit, never scatter them
