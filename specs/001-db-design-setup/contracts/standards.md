# API Standards: DB Design & Project Setup (Semana 1)

## Standard Response Format

All successful responses MUST return a `data` object.

```json
{
  "data": {
    "id": "uuid",
    "attribute": "value"
  },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

## Standard Error Format

All error responses MUST return an `error` object with a stable code.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "details": null
  }
}
```

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | The request body or parameters are invalid. |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token. |
| `FORBIDDEN` | 403 | User does not have the required RBAC role. |
| `NOT_FOUND` | 404 | Resource does not exist. |
| `CONFLICT` | 409 | Resource state conflict (e.g., overbooking, duplicate key). |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |

## Health Check Contract

- **Endpoint**: `GET /api/health`
- **Auth**: Public
- **Response**:
  ```json
  {
    "data": {
      "status": "UP",
      "timestamp": "2026-04-16T12:00:00Z",
      "database": "CONNECTED"
    }
  }
  ```
