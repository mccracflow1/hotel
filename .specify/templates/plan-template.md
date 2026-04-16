# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: Node.js 20 LTS (Backend), Angular 17+ (Admin), HTML5/Tailwind (Landing)
**Storage**: PostgreSQL 14+ (ACID compliant)
**IA Integration**: n8n Cloud (MCP Protocol)
**Testing**: Integration tests for critical modules (Reservations, Payments, Availability)
**Target Platform**: Railway (API/DB), Vercel (Admin), Netlify (Landing)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **API-First**: Does this feature bypass the API? (Must not)
- [ ] **Idempotency**: Does it handle critical state changes with Idempotency-Keys?
- [ ] **Snapshots**: If affecting reservations, does it use immutable snapshots?
- [ ] **Security**: Is the RBAC role correctly assigned in the controller?
- [ ] **IA Autonomy**: If it's a tool for Sofia, is it exposed via MCP?
- [ ] **Angular Standards**: Are standalone components and signals used? (Admin only)

## Project Structure

### Documentation (this feature)
```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (Multi-project layout)
```text
backend/                 # Node.js API
├── src/
│   ├── modules/         # Feature-based modular structure
│   ├── middlewares/     # Auth, Idempotency, Validation
│   └── config/          # Knex, DB, env
└── tests/               # Integration and contract tests

admin-portal/            # Angular 17+
├── src/app/
│   ├── core/            # Auth, Interceptors, Services
│   ├── shared/          # Reusable components
│   └── features/        # Business modules (Rooms, Plans, etc.)
└── tests/

landing-page/            # HTML + Tailwind
├── index.html
└── scripts/             # chat-widget.js

mcp-server/              # n8n workflows
└── workflows/           # JSON exports of n8n flows
```

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [Principle] | [Reason] | [Alternative] |
