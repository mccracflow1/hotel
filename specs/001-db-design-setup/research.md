# Research: DB Design & Project Setup (Semana 1)

## Decision Log

### Decision: Repository Pattern for Data Access
- **Rationale**: Decouples business logic from database-specific code (Knex), facilitating testing and future portability. It provides a clean interface for service layers.
- **Alternatives Considered**: Direct Knex queries in services (Rejected due to tight coupling and harder unit testing).

### Decision: Idempotency Tracking Table
- **Rationale**: Prevents double-processing of reservations and payments. Critical for the "Enterprise/Multi-property" scale clarified in the spec to handle high concurrency and network retries.
- **Alternatives Considered**: In-memory cache (Rejected as it's not persistent across server restarts).

### Decision: Pessimistic Locking with `SELECT FOR UPDATE SKIP LOCKED`
- **Rationale**: Ensures that availability checks are accurate and prevents race conditions during high-load concurrent booking attempts. "SKIP LOCKED" improves throughput by not waiting for locked rows that are already being processed.
- **Alternatives Considered**: Optimistic locking (Rejected as high contention in hotel booking makes retries less efficient than blocking for a short duration).

### Decision: Modular Backend Structure
- **Rationale**: Organizing by feature (`/modules/auth`, `/modules/reservations`) improves maintainability and allows teams to work on separate features with minimal conflicts.
- **Alternatives Considered**: Layered structure (all controllers together, all services together). Rejected as feature-based is more scalable for complex domains.
