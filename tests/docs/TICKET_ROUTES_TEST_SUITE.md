# Ticket Routes Test Suite

## Overview

A comprehensive Jest test suite for all ticket routes in the helpdesk API, ensuring compliance with the system's requisites and proper authorization checks across all ticket operations.

## Test Coverage

### 60 Total Tests covering:

#### 1. **POST /tickets** - Create Ticket (10 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only clients can create)
- Tech cannot create tickets
- Admin cannot create tickets
- Field validation:
  - techId must be valid UUID format
  - servicesIds must not be empty array
  - servicesIds must contain valid UUIDs
  - At least one service required
- Successful ticket creation with valid data

#### 2. **GET /tickets/clientHistory** - List Client Tickets (5 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only clients can view own history)
- Tech cannot view client history (403)
- Admin cannot view client history (403)
- Client can view their own ticket history

#### 3. **GET /tickets/tech** - List Tech Tickets (5 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only techs can view tech tickets)
- Client cannot list tech tickets (403)
- Admin cannot list tech tickets (403)
- Technician can list only their assigned tickets

#### 4. **GET /tickets/list** - List All Tickets (4 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only admin can list all)
- Tech cannot list all tickets (403)
- Client cannot list all tickets (403)
- Admin can list all tickets in system

#### 5. **PUT /tickets/addServices/:ticketId** - Add Services to Ticket (5 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only tech and admin can add services)
- Client cannot add services (403)
- Field validation:
  - ticketId must be valid UUID format
  - servicesIds must not be empty array
  - servicesIds must contain valid UUIDs
- Tech and admin can add multiple service IDs simultaneously

#### 6. **PUT /tickets/status/:ticketId** - Update Ticket Status (7 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (client cannot update status)
- Tech can update ticket status
- Admin can update ticket status
- Status value validation:
  - Only accepts: "aberto", "em_atendimento", "encerrado"
  - Rejects invalid status values
  - All three valid statuses accepted
- ticketId must be valid UUID format

#### 7. **Authorization Requirements - Requisites Compliance** (9 tests)

**Admin Operations:**

- Cannot create tickets directly
- Can list all tickets
- Can edit ticket status

**Technician Operations:**

- Cannot create tickets
- Can list only their assigned tickets
- Can add services to tickets
- Can edit ticket status

**Client Operations:**

- Can create tickets
- Can view their own ticket history
- Cannot alter tickets after creation

#### 8. **Validation - Requisites Compliance** (10 tests)

- Valid ticket status values: "aberto", "em_atendimento", "encerrado"
- Invalid status values rejection
- At least one service required when creating ticket
- At least one service required when adding services
- techId UUID format validation
- serviceIds UUID format validation
- ticketId UUID format validation (in status update)
- ticketId UUID format validation (in add services)

#### 9. **Multiple Users with Different Roles** (3 tests)

- Different clients can create independent tickets
- Different technicians see only their own assigned tickets
- Same client can assign tickets to different technicians

#### 10. **Authentication** (2 tests)

- Requests without authentication token are rejected
- Valid JWT tokens are accepted

## Requisite Compliance

✅ **Admin Operations**

- Can list all tickets in the system (GET /tickets/list)
- Can update ticket status (PUT /tickets/status/:ticketId)
- Can add services to any ticket (PUT /tickets/addServices/:ticketId)
- Cannot create tickets directly
- Can view all ticket information

✅ **Technician Operations**

- Can list only tickets assigned to them (GET /tickets/tech)
- Can add services to assigned tickets (PUT /tickets/addServices/:ticketId)
- Can update ticket status (PUT /tickets/status/:ticketId)
- Cannot create tickets
- Cannot view other technicians' assigned tickets
- Cannot access client history

✅ **Client Operations**

- Can create new tickets (POST /tickets)
  - Must specify a technician (techId)
  - Must specify at least one service (servicesIds)
- Can view only their own ticket history (GET /tickets/clientHistory)
- Cannot update their own tickets after creation
- Cannot list other clients' tickets
- Cannot access technician or admin endpoints

✅ **Data Validation**

- Ticket status values: only "aberto" (open), "em_atendimento" (in service), "encerrado" (closed)
- UUID format validation for: techId, serviceIds, ticketId
- Required fields enforced: techId, servicesIds (must be non-empty)
- At least one service required when creating or adding services to tickets

## Running Tests

```bash
# Run all tests
npm test

# Run ticket routes tests only
npm test -- tests/ticketRoutes.spec.ts

# Run with coverage
npm test -- --coverage

# Run with verbose output
npm test -- tests/ticketRoutes.spec.ts --verbose
```

## Test Configuration

- **Framework**: Jest with TypeScript support (ts-jest)
- **HTTP Testing**: Supertest for Express testing
- **Environment**: Node.js
- **Test Timeout**: 5 seconds per test
- **Mock UUIDs**:
  - `techId1 = "11111111-1111-1111-1111-111111111111"`
  - `techId2 = "22222222-2222-2222-2222-222222222222"`
  - `serviceId1 = "33333333-3333-3333-3333-333333333333"`
  - `serviceId2 = "44444444-4444-4444-4444-444444444444"`
  - `ticketId = "99999999-9999-9999-9999-999999999999"`

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
- Authorization failures typically return 403, validation failures return 400
- When both authorization and validation could fail, tests verify the response matches either status code
- The test suite respects the business requisites defined in `requisites.md`
- Express app is created fresh in `beforeEach()` hook to ensure test isolation
- Mock tokens are created using the same JWT library as production code for authenticity

## Test Results

**All 60 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       60 passed, 60 total
Time:        ~11 seconds
```

## Key Testing Patterns

### Authorization Testing

Tests verify that endpoints return 403 (Forbidden) when users without proper roles attempt to access protected operations.

### Validation Testing

Tests verify that malformed requests (invalid UUIDs, missing required fields, invalid enum values) return 400 (Bad Request).

### Happy Path Testing

Each endpoint includes at least one test verifying successful operation with valid authentication and data.

### Role-Based Access Control

Comprehensive testing of Admin, Technician, and Client roles to ensure each can only perform allowed operations.
