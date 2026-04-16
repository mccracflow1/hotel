# Feature Specification: DB Design & Project Setup (Semana 1)

**Feature Branch**: `001-db-design-setup`  
**Created**: 2026-04-16  
**Status**: Draft  

## Clarifications
### Session 2026-04-16
- Q: What is the approximate scale of the establishment to optimize indexing, connection pooling, and locking strategies? → A: Enterprise/Multi-property (200+ rooms, high concurrency).
- Q: For security and compliance, should the audit log capture full request/response payloads for all mutations, or only metadata and status changes? → A: Full Payload (Metadata + Full Request/Response bodies).
- Q: Which observability standard should the project foundation implement to ensure rapid diagnosis of issues in production? → A: Basic Text Logs + External Uptime Monitoring.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Database Schema Initialization (Priority: P1)
As a developer, I need the database schema to be fully defined and migrated so that I can persist data for rooms, plans, and users.

**Independent Test**: Run `knex migrate:latest` and verify that all 19 tables are created with correct constraints and indexes in PostgreSQL.

**Acceptance Scenarios**:
1. **Given** a clean PostgreSQL database, **When** migrations are executed, **Then** the schema matches the design in CONTEXTO_MAESTRO.md.
2. **Given** an existing schema, **When** rollback is executed, **Then** the database returns to its previous state without orphaned records.

---

### User Story 2 - API Project Foundation (Priority: P1)
As a developer, I want a standardized Node.js project structure so that I can implement feature modules consistently and handle errors gracefully.

**Independent Test**: Start the server and verify that the modular structure exists and a health-check endpoint responds.

**Acceptance Scenarios**:
1. **Given** the Node.js setup, **When** a request results in a "Not Found" error, **Then** the system returns a structured JSON response with a custom error code.

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST implement a schema with 19 tables including Users, Rooms, Plans, Reservations, Payments, Inventory, and CMS.
- **FR-002**: [Principle III Check] System MUST implement `reservation_activity_snapshot` and `reservation_optional_activities` to preserve immutable records of plan details at the time of booking.
- **FR-003**: [Principle II Check] System MUST implement an idempotency mechanism for reservations and payments using an `Idempotency-Key` header and a dedicated tracking table.
- **FR-004**: [Principle IV Check] System MUST define the following RBAC roles: `SUPER_ADMIN`, `ADMIN`, `BUSINESS`, `VIEWER`, `AGENT`.
- **FR-005**: System MUST implement pessimistic locking using `SELECT FOR UPDATE SKIP LOCKED` for availability checks, optimized for high concurrency.
- **FR-006**: Backend project MUST be organized into modules by feature (e.g., `/modules/auth`, `/modules/reservations`).
- **FR-007**: Database connection pooling and indexing MUST be configured to support an Enterprise-scale environment (200+ rooms).
- **FR-008**: Audit log system MUST capture full request/response payloads for all data mutations to ensure a complete forensic trail.
- **FR-009**: System MUST implement a standardized logging module providing basic text logs for critical lifecycle events and errors.

### Key Entities
- **Users**: Portal users with name, email, password_hash, and role.
- **Rooms**: Accommodations with capacity, base price, and metadata.
- **Plans**: Experience packages linking rooms and activities.
- **Reservations**: Transactional record of customer bookings with status tracking.
- **InventoryItems**: Stock items with current level and minimum alert thresholds.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Migrations 001 through 010 execute in under 10 seconds in a local environment.
- **SC-002**: Concurrent booking attempts for the same resource result in zero overbookings under high-load stress tests.
- **SC-003**: Idempotent requests return identical responses and prevent duplicate DB writes.
- **SC-004**: System provides basic text logs and integrates with external uptime monitors for health tracking.

## Assumptions
- PostgreSQL 14+ is used for persistence.
- Knex.js is the chosen ORM/Migration tool.
- Node.js 20 LTS is the execution environment.
