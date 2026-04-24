# BRX SYSTEM API Overview

The BRX SYSTEM API provides a comprehensive REST interface for all AI capabilities.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

API endpoints support Bearer token authentication. Set the `Authorization` header:

```
Authorization: Bearer YOUR_TOKEN
```

## Rate Limiting

Default rate limit: 100 requests per minute per IP.

## Response Format

All responses use JSON format:

```json
{
  "status": "success",
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

## Error Handling

Error responses follow this structure:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description",
  "details": {}
}
```

Common status codes:
- 400: Bad Request - Invalid input parameters
- 401: Unauthorized - Missing or invalid authentication
- 404: Not Found - Resource does not exist
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Unexpected server error
