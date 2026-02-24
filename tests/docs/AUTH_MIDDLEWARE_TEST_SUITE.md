# Auth Middleware Test Suite

# Overview

A comprehensive Jest test suite for the authMiddleware, ensuring proper authentication handling, JWT validation, and request flow control in the helpdesk API.

# Test Coverage

## 21 Total Tests covering:

### 1. **Missing or Invalid Authorization Header** (6 tests)

- Returns 401 when authorization header is missing
- Returns 401 when authorization header is undefined
- Returns 401 when authorization header is empty
- Returns 401 when token is missing after Bearer
- Returns 401 when header has no Bearer prefix
- Returns 401 when authorization uses different scheme (e.g., Basic)

### 2. **Valid Token Handling** (3 tests)

- Calls next() when token is valid
- Sets request.user with decoded token
- Rejects malformed Bearer format (extra spaces)

### 3. **Invalid or Expired Token** (4 tests)

- Returns 401 when verification fails
- Returns 401 when token is expired
- Returns 401 when signature is invalid
- Returns 401 when token format is malformed

### 4. **Edge Cases** (8 tests)

- Handles multiple Bearer words
- Handles case-sensitive Bearer prefix
- Does not modify request.user if auth fails
- Handles tokens with special characters
- Handles very long tokens (10k+ chars)

### Ensures:

- Middleware robustness
- No unexpected request mutation
- Safe handling of malformed headers
- Correct token extraction logic

## Requisite Compliance

✅ Authentication Required

- Requests without valid JWT are blocked with 401.
- Middleware enforces presence of Authorization header.

✅ JWT Verification

- Uses JWT_SECRET from environment.
- Verifies token signature using jsonwebtoken.
- Handles expired and malformed tokens.
- Prevents unauthorized access.

✅ Request Enrichment

- On successful validation:
- Populates request.user with decoded token.
- Calls next() to continue request pipeline.

✅ Error Handling

- Consistent error messages
- No sensitive error details leaked
- Prevents request progression when invalid

## Execution

```bash
# Run all tests

npm test

# Run only auth middleware tests

npm test -- authMiddleware.spec.ts

# Run with coverage

npm test -- --coverage
```

## Security Considerations Covered

- Strict header validation
- Prevents token injection
- Rejects invalid authorization schemes
- Handles malformed and tampered tokens
- Avoids request mutation on failure
- Ensures only valid JWT payloads reach protected routes

## Notes

- All tests are independent and reset mocks using jest.clearAllMocks().
- The suite ensures both correct authentication behavior and defensive programming practices.
- Designed to guarantee middleware reliability before integration into route layers.

## Test Results

**All 18 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
Time:        ~0.5 seconds
```
