# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Foundational (Backend)
- [ ] T001 Setup DB migrations in `backend/src/config/migrations/`
- [ ] T002 Implement Joi validation schema in `backend/src/modules/[module]/schema.js`
- [ ] T003 Implement Repository for data access in `backend/src/modules/[module]/repository.js`
- [ ] T004 Implement Service logic (Snapshots & Idempotency) in `backend/src/modules/[module]/service.js`
- [ ] T005 Implement Controller with RBAC middleware in `backend/src/modules/[module]/controller.js`
- [ ] T006 Register routes in `backend/src/modules/[module]/routes.js`

## Phase 2: Integration Tests
- [ ] T007 Write integration test for [Success Flow] in `backend/tests/integration/[module].test.js`
- [ ] T008 Write test for concurrency (SELECT FOR UPDATE) in `backend/tests/integration/concurrency.test.js`

## Phase 3: Admin UI (Angular)
- [ ] T009 Create standalone component in `admin-portal/src/app/features/[module]/[name].component.ts`
- [ ] T010 Define Signal-based state for the feature
- [ ] T011 Implement UI with Angular Material
- [ ] T012 Integrate with `ApiService` using OnPush strategy

## Phase 4: IA Integration (n8n MCP)
- [ ] T013 Update MCP Server workflow to include new tool in `mcp-server/workflows/[name].json`
- [ ] T014 Test tool invocation from AI Agent Sofia

## Phase 5: Documentation & Polish
- [ ] T015 Verify Swagger/OpenAPI documentation
- [ ] T016 Run final audit against Project Constitution
