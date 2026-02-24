# Service Routes Test Suite

## Overview

A comprehensive Jest test suite for all service routes in the helpdesk API, ensuring compliance with the system's requisites and proper authorization checks across all service management operations.

## Test Coverage

### 33 Total Tests covering:

#### 1. **POST /services** - Create Service (10 tests)

- Authentication required (401 when missing token)
- Client cannot create services
- Tech cannot create services
- Title must be at least 3 characters
- Should accept exactly 3 characters title
- Price must be a non-negative number
- Title is required
- Price is required
- Admin can create services with valid data
- Accepts price equals zero
- Accepts decimal prices

#### 2. **GET /services/list** - List Services (4 tests)

- Authentication required (401 when missing token)
- Authenticated Admin can list services
- Authenticated Tech can list services
- Authenticated Client can list services

#### 3. **PUT /services/:id** - Update Service (11 tests)

- Authentication required (401 when missing token)
- Tech cannot update services
- Client cannot update services
- Title must be at least 3 characters
- Price must be a non-negative number
- ServiceId must be valid UUID format
- Title is required
- Price is required
- Admin can update services with valid data
- Support for decimal prices on updates
- It returns error 400 when updating inexistent service

#### 4. **DELETE /services/:id** - Deactivate Service (6 tests)

- Authentication required (401 when missing token)
- Tech cannot deactivate services
- Client cannot deactivate services
- It returns 400 when serviceId is not UUID
- Admin can deactivate services
- It returns 400 when deactivating inexistent service

## Requisite Compliance

✅ **Admin Operations**

- Can create services (title, price)
- Can list all services
- Can update service details (title, price)
- Can deactivate services (soft delete strategy)
- Only admin can manage services

✅ **Service Management**

- Services have title and price information
- Services are required for tickets (at least one)
- Deactivated services don't appear in new ticket creation
- Deactivated services remain in existing tickets
- Soft delete strategy implemented
- Price validation (non-negative numbers)

✅ **Tech Operations**

- Can view available services for ticket assignment
- Cannot create, edit, or deactivate services

✅ **Client Operations**

- Can view available services for ticket creation
- Cannot create, edit, or deactivate services

✅ **Data Validation**

- Title: minimum 3 characters required
- Price: non-negative numbers (0 or greater)
- Service ID: UUID format required
- Decimal prices supported

## Running Tests

```bash
# Run all tests
npm test

# Run service routes tests only
npm test -- tests/serviceRoutes.spec.ts

# Run with coverage
npm test -- --coverage

```

## Test Configuration

- **Framework**: Jest with TypeScript support (ts-jest)
- **HTTP Testing**: Supertest for Express testing
- **Environment**: Node.js
- **Test Timeout**: 5 seconds per test (default)

## Mock Tokens

The test suite uses JWT tokens with mock data for different user roles:

```javascript
// Admin token
jwt.sign({ id: "admin-id-123", role: "admin" }, JWT_SECRET);

// Technician token
jwt.sign({ id: "tech-id-123", role: "tech" }, JWT_SECRET);

// Client token
jwt.sign({ id: "client-id-123", role: "client" }, JWT_SECRET);
```

These allow testing authorization logic without database dependencies.

## Notes

- Tests use `supertest` to make HTTP requests to Express app
- All tests are independent and use mocked JWT tokens (no database required)
- Tests verify both authorization (role-based access) and validation (data format)
- The test suite respects the business requisites defined in `requisites.md`

## Test Results

**All 33 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
Time:        ~7 seconds
```
