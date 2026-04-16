---
name: "speckit-document"
description: "Generate technical documentation from implemented code and spec artifacts. Produces API reference, architecture guide, developer onboarding, and module-level docs aligned with the project constitution."
argument-hint: "Optional: specify scope — 'api', 'architecture', 'modules', 'onboarding', or leave empty for full suite"
compatibility: "Requires spec-kit project structure with .specify/ directory and at least plan.md"
metadata:
  author: "proyecto-hotel"
  source: "skills/speckit-document"
user-invocable: true
disable-model-invocation: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).
If a scope is provided (api | architecture | modules | onboarding), generate only that document.
If empty, generate the full documentation suite.

## Outline

1. **Setup**: Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -IncludeTasks` from repo root. Parse FEATURE_DIR and AVAILABLE_DOCS. All paths must be absolute.

2. **Determine scope**: Based on user input or default to full suite:
   - `api` → only `docs/api-reference.md`
   - `architecture` → only `docs/architecture.md`
   - `modules` → only `docs/modules.md`
   - `onboarding` → only `docs/onboarding.md`
   - *(empty)* → all four documents

3. **Load context** (read only what exists):
   - **Required**: `plan.md` — tech stack, file structure, architecture decisions
   - **If exists**: `spec.md` — user stories and acceptance criteria
   - **If exists**: `data-model.md` — entities and relationships
   - **If exists**: `contracts/` — API contracts and response formats
   - **If exists**: `research.md` — architectural decisions and rationale
   - **If exists**: `tasks.md` — completed tasks (to know what was actually implemented)
   - **If exists**: `.specify/memory/constitution.md` — project principles
   - **Source code**: Read `backend/src/` recursively to discover actual implementations

4. **Pre-documentation audit**: Before writing, scan implemented source files to verify:
   - Which endpoints exist in routes files
   - Which middleware is active in `app.js`
   - Which modules have content vs. are placeholders
   - Which migrations exist and what tables they create
   - Flag any gaps between spec and implementation

5. **Generate documents** based on scope:

   ### Document A — `docs/api-reference.md`
   **Purpose**: Complete REST API reference for developers and the AI agent.

   Structure:
   ```
   # API Reference — {Project Name}
   ## Base URL & Authentication
   ## Standard Response Format (success + error)
   ## Common Error Codes (table)
   ## Endpoints by Module
     ### {Module}
     #### METHOD /path
     - Description
     - Auth required: yes/no + roles
     - Request body (JSON schema)
     - Response 200 (example)
     - Error responses (code + when)
     - Idempotency-Key: required? (yes/no)
   ## Rate Limiting
   ## Changelog
   ```

   Rules:
   - Only document endpoints found in actual routes files
   - Mark placeholder endpoints clearly as `⚠️ Not implemented yet (Semana X)`
   - Include the health check endpoint
   - Show real request/response examples matching `contracts/standards.md` format

   ### Document B — `docs/architecture.md`
   **Purpose**: System architecture reference for the dev team.

   Structure:
   ```
   # Architecture — {Project Name}
   ## System Overview (diagram as ASCII or Mermaid)
   ## Layer Diagram (Client → API → DB → External)
   ## Tech Stack (table: layer / tech / version / justification)
   ## Database Schema
     ### Entity Relationship (Mermaid ER diagram)
     ### Tables (name / purpose / key columns / relations)
     ### Critical Indexes (name / table / type / purpose)
     ### PL/pgSQL Functions & Triggers
   ## Key Design Decisions (from research.md)
   ## Concurrency & Idempotency Mechanisms
   ## Module Dependency Graph
   ## External Services Integration Map
   ## Environment Configuration Reference
   ```

   Rules:
   - Generate Mermaid ER diagram from data-model.md entities
   - List ALL 25 tables with their purpose in one sentence each
   - Include the check_availability() function explanation
   - Document the audit trigger mechanism

   ### Document C — `docs/modules.md`
   **Purpose**: Module-level developer reference — what each module does, its API surface, and its dependencies.

   Structure:
   ```
   # Module Reference — {Project Name}
   ## Module Map (table: module / responsibility / status)
   ## Base Repository Pattern
   ## Middleware Stack
   ## {For each module}:
     ### {Module Name}
     - **Responsibility**: one-sentence description
     - **Status**: Implemented | Skeleton | Planned (Semana X)
     - **Files**: list with one-line description each
     - **Database tables**: which tables it owns
     - **Depends on**: other modules / middleware
     - **Exposes**: routes/endpoints (or "none yet")
     - **Joi schemas**: validation rules defined
   ```

   Rules:
   - Detect status by reading file content (empty = Skeleton, has exports = Implemented)
   - Be explicit about what is a placeholder vs. real code
   - Include `base.repository.js` as its own section

   ### Document D — `docs/onboarding.md`
   **Purpose**: Step-by-step guide for a new developer to run the project locally in under 15 minutes.

   Structure:
   ```
   # Developer Onboarding — {Project Name}
   ## Prerequisites (with versions)
   ## Repository Setup
   ## Environment Configuration
     ### Required variables (table: var / description / example)
     ### Optional variables
   ## Database Setup
     1. Create database
     2. Run migrations (with expected output)
     3. Verify tables (SQL snippet)
   ## Running the API
     - dev mode
     - production mode
   ## Verifying the Setup
     - Health check curl example
     - Expected response
   ## Running Migrations
     - migrate:latest / rollback / status commands
   ## Project Structure Explained
   ## Common Issues & Solutions
   ## Development Workflow
     - Branch strategy (from plan.md)
     - How to add a new module
     - How to add a migration
   ## Semana 2+ Setup (what still needs to be configured)
   ```

6. **Write output files**: Create `docs/` directory in project root if it doesn't exist. Write each document.

7. **Generate `docs/README.md`**: Index file listing all generated documents with one-line description each.

8. **Report**: Output a summary table:

   | Document | Path | Sections | Status |
   |----------|------|----------|--------|
   | API Reference | docs/api-reference.md | N | Generated |
   | Architecture | docs/architecture.md | N | Generated |
   | Module Reference | docs/modules.md | N | Generated |
   | Onboarding | docs/onboarding.md | N | Generated |

   List any gaps found between spec and implementation.

## Key Rules

- **Never invent**: only document what exists in source code or spec artifacts
- **Mermaid diagrams**: use `erDiagram` for DB schema, `graph TD` for module dependencies
- **Placeholder sections**: if a module is empty, say so explicitly — don't skip it
- **Absolute paths**: always reference source files with paths relative to project root
- **Sync with constitution**: every architectural decision documented must align with `.specify/memory/constitution.md`
- **No duplication**: if a fact appears in `research.md`, cite it; don't rewrite it
