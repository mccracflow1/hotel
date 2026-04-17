# Plataforma de Gestión Hotelera con IA (Sofia) Constitution

<!-- 
  Sync Impact Report
  - Version change: 1.1.0 -> 1.2.0 (2026-04-17): IV extended — Public Web Acquisition Channel (anonymous landing writes) with compensating controls; clarifies JWT scope vs public booking API
  - Version change: 1.0.0 -> 1.1.0 (2026-04-16): Principles II, III, IV clarified — idempotency scope, snapshots at reservation creation, audit user_id contract
  - Version change (historical): Initial -> 1.0.0
  - Added principles: 
    - I. API-First & Single Source of Truth
    - II. Idempotency & Transactional Integrity
    - III. Immutable Data Snapshots
    - IV. Strict Security & RBAC
    - V. MCP-Driven IA Autonomy
    - VI. Standalone & Signal-Driven UI
  - Added sections: Technology Standards, Development Workflow, Governance
  - Templates updated:
    - .specify/templates/plan-template.md (✅ updated)
    - .specify/templates/spec-template.md (✅ updated)
    - .specify/templates/tasks-template.md (✅ updated)
  - Follow-up TODOs: None
-->

## Core Principles

### I. API-First & Single Source of Truth
The API is the only gateway to the data layer. Direct database access from any frontend (Landing, Portal) or external agent (n8n Sofia) is strictly prohibited. All business logic MUST be encapsulated within the Node.js backend to ensure consistency across the Landing Page, Admin Portal, and AI Agent interaction channels.

### II. Idempotency & Transactional Integrity
Critical operations (**reservations**, **payments**, and any mutation where duplicate processing would cause financial or inventory inconsistency) MUST be idempotent: the client MUST send an `Idempotency-Key` header and the server MUST return the same response for retries within the key’s validity window. Other write operations (e.g. catalog CRUD) SHOULD use idempotency when duplicate submits are likely. Database mutations for availability-sensitive flows MUST use strict transactions with pessimistic locking (`SELECT FOR UPDATE SKIP LOCKED` or equivalent) to prevent overbooking and race conditions.

### III. Immutable Data Snapshots
When a **reservation is created**, all plan base activities and optional activity pricing relevant to that booking MUST be captured in immutable rows (`reservation_activity_snapshot`, `reservation_optional_activities`). Later state transitions (e.g. confirmation or payment) MUST NOT replace or rewrite those snapshot rows. Master data changes (plans, activities, catalog prices) MUST NOT retroactively modify existing reservations, ensuring historical accuracy and customer trust.

### IV. Strict Security & Role-Based Access Control (RBAC)
Authentication is mandatory via JWT (short-lived access tokens + httpOnly refresh tokens). Access is restricted by a strict RBAC matrix: `SUPER_ADMIN`, `ADMIN`, `BUSINESS`, `VIEWER`, and `AGENT`. Every critical state change (INSERT, UPDATE, DELETE) MUST generate an audit log entry for accountability, including the **acting user** when the change is performed through the API (persisted in `audit_logs.user_id` via the application–database contract, e.g. transaction-local `set_config` consumed by `log_changes()`).

**Public Web Acquisition Channel (Landing — explicit exception to JWT-on-client):**  
End-user browsers on the **public marketing site** are not JWT holders. The product MAY expose a **narrow, namespaced HTTP surface** (e.g. under `/api/v1/public/...`) for **anonymous** `POST` operations that create a **reservation** or **initiate checkout**, provided **all** of the following hold:

1. **No secrets in static assets** — no AGENT or ADMIN tokens shipped to the browser.  
2. **Idempotency** — `Idempotency-Key` is **mandatory** on every anonymous mutating request (Principle II).  
3. **Abuse controls** — dedicated **rate limiting** (and future CAPTCHA/bot mitigation as needed) on those routes.  
4. **Same domain logic** — handlers delegate to the **same** reservation/payment services used by authenticated flows (snapshots, transactions, pessimistic availability).  
5. **Auditability** — mutations record a **non-forged** audit context (e.g. channel `WEB_PUBLIC` via `set_config` / application contract) where `user_id` is null; this does **not** replace JWT for portal or AGENT traffic.

JWT + RBAC remains mandatory for **Admin Portal**, **AGENT-authenticated** integrations, and any operation outside this documented public surface.

### V. MCP-Driven IA Autonomy
The AI Agent (Sofia) must remain stateless regarding business logic and data. It interacts with the system exclusively through a Model Context Protocol (MCP) server that exposes validated tools. The agent must never have direct write access to the database or bypass API security and validation layers.

**Scope note:** The **web chat widget** on the Landing Page MAY call an **external HTTPS webhook** (e.g. n8n) directly for conversational UX; that channel is **not** the MCP tool surface. MCP still applies to the **Sofia agent** tool execution path (WhatsApp / agent canvas) as defined in project specs. Business mutations initiated from chat that affect reservations or payments MUST ultimately go through the **same Node.js API** validation and idempotency rules (Principles I–III).

### VI. Standalone & Signal-Driven UI
The Admin Portal (Angular 17+) MUST use standalone components and Signals for state management. `ChangeDetectionStrategy.OnPush` is mandatory to ensure optimal performance. Business logic in the frontend is limited to UI state; all domain rules must be validated by the API.

## Technology Standards

- **Backend**: Node.js 20 LTS + Express 5. Use a repository pattern to decouple data access from business services.
- **Database**: PostgreSQL 14+. ACID compliance is non-negotiable. Use `pg_cron` for automated maintenance and PL/pgSQL for complex triggers.
- **Admin Portal**: Angular 17+. Use Angular Material for UI components and standard interceptors for auth/error handling.
- **Landing Page**: Vanilla HTML5 + Tailwind CSS (via CDN) for ultra-fast SEO and zero-dependency deployment.
- **IA**: n8n Cloud for orchestration. GPT-4o-mini as the primary LLM, interfaced via MCP SSE (Server-Sent Events).

## Development Workflow

- **TDD & Testing**: Critical modules (Reservations, Payments, Availability) MUST have automated integration tests before being marked as complete.
- **Documentation**: All API endpoints MUST be documented via Swagger/OpenAPI 3.0 and kept in sync with the implementation.
- **Soft Delete**: Records with historical or financial associations (rooms, plans, inventory) MUST use soft deletes to maintain referential integrity.
- **CI/CD**: Automatic deployments to Railway (API/DB), Vercel (Admin Portal), and Netlify (Landing Page) on every merge to the `main` branch.

## Governance
This Constitution is the supreme architectural authority for the Sofia project. Every Pull Request must be audited against these principles. Architectural complexity must be justified; YAGNI (You Ain't Gonna Need It) is the default stance for all technical decisions.

**Version**: 1.2.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-17
