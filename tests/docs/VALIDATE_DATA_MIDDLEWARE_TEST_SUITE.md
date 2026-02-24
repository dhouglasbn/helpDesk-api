# Validate Zod Schema Middleware Test Suite

## Overview

A comprehensive Jest test suite for the validateZodSchema middleware, ensuring robust request validation using Zod across:

## Test Coverage

## 37 Total Tests covering:

#### 1. No Schemas Provided (2 tests)

- Calls next() when no schemas are provided
- Preserves original request data when no validation is configured

#### Ensures:

- Middleware is safely optional
- No unintended mutation occurs
- No false validation failures

#### 2. Body Validation (9 tests)

#### Successful Cases

- Validates simple object schema
- Validates nested objects
- Supports optional fields
- Replaces req.body with parsed/trimmed data
- Handles transformations (e.g., trim())
- Handles nullable fields
- Applies default values

#### Failure Cases

- Returns 400 when body validation fails
- Includes detailed error messages

#### Validates:

- Email format
- Minimum string length
- Required fields
- Nested validation failures

#### 3. Params Validation (5 tests)

#### Successful Cases

- Valid UUID validation
- Numeric transformations
- Value coercion (z.coerce)
- Replacement of validated/transformed params

#### Failure Cases

- Invalid UUID
- Invalid numeric values
- Negative values when positive expected

#### Ensures:

- Route parameters are safe and correctly typed
- Prevents malformed IDs from reaching services

#### 4. Query Validation (4 tests)

#### Successful Cases

- Optional query parameters
- Transformations (e.g., toLowerCase())
- Replacement of validated query data

#### Failure Cases

- Invalid numeric query params
- Invalid transformations

#### Ensures:

- Pagination and filtering inputs are validated
- Clean query parsing before business logic execution

#### 5. Combined Validation (Body, Params, Query) (5 tests)

- Validates all three when schemas are provided
- Fails immediately if:
  - Body fails
  - Params fail
  - Query fails
- Skips validation for undefined schemas

#### Ensures:

- Short-circuit behavior
- No next() call when any validation fails
- Correct validation priority

#### 6. Error Handling and Edge Cases (13+ tests)

#### Complex Structures

- Nested objects
- Arrays
- Discriminated unions (enum-based)
- Multiple simultaneous validation failures

#### Zod Features Covered

- `.nullable()`
- `.default()`
- `.coerce()`
- `.transform()`
- `.strict()`
- `.passthrough()`
- `.pipe()`

#### Strict vs Passthrough

- `.strict()` rejects unknown fields
- `.passthrough()` allows extra fields

#### Multiple Errors

- Ensures all validation errors are included
- Confirms consistent error structure

#### Guarantees:

- Middleware resilience
- Safe handling of advanced schema configurations
- No partial validation leaks

### Requisite Compliance

✅ Input Validation Layer

- Validates body, params, and query independently
- Supports partial schema usage
- Prevents invalid data from reaching controllers

✅ Request Mutation with Safe Data

- Replaces request sections with parsed values
- Applies transformations
- Applies defaults
- Coerces types
- Removes or rejects unexpected fields depending on schema mode

✅ Middleware Flow Control

- Calls next() only when all validations pass
- Never calls next() if any validation fails
- Does not partially modify request on failure

### Execution

```bash
# Run all tests

npm test

# Run only validation middleware tests

npm test -- validateZodSchema.spec.ts

# Run with coverage

npm test -- --coverage
```

### Security & Reliability Considerations Covered

- Prevents malformed input injection
- Enforces schema contract at route level
- Handles coercion safely
- Prevents over-posting attacks (via strict mode)
- Ensures consistent error structure
- Stops request pipeline on validation failure
- Avoids request mutation when validation fails

## Notes

- All tests are isolated and reset with `jest.clearAllMocks()`.
- Covers both happy paths and failure paths.
- Designed to validate middleware correctness before integration with route handlers.
- Ensures production-grade input validation behavior using Zod best practices.

## Test Results

**All 37 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       37 passed, 37 total
Time:        ~1.5 seconds
```
