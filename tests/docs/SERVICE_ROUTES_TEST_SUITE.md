# Service Routes Test Suite

## Overview

A comprehensive Jest test suite for all service routes in the helpdesk API, ensuring compliance with the system's requisites and proper authorization checks across all service management operations.

## Test Coverage

### 59 Total Tests covering:

#### 1. **POST /services** - Create Service (9 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only admin can create)
- Tech cannot create services
- Client cannot create services
- Field validation:
  - title must be at least 3 characters
  - price must be a non-negative number
  - title is required
  - price is required
- Admin can create services with valid data

#### 2. **GET /services/list** - List Services (5 tests)

- Authentication required (401 when missing token)
- Any authenticated user can list services (admin, tech, client)
- All roles receive JSON response
- Proper response structure validation

#### 3. **PUT /services/:id** - Update Service (9 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only admin can update)
- Tech cannot update services
- Client cannot update services
- Field validation:
  - title must be at least 3 characters
  - price must be a non-negative number
  - serviceId must be valid UUID format
  - title is required
  - price is required
- Admin can update services with valid data
- Support for decimal prices on updates

#### 4. **DELETE /services/:id** - Deactivate Service (6 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only admin can deactivate)
- Tech cannot deactivate services
- Client cannot deactivate services
- Field validation:
  - serviceId must be valid UUID format
- Admin can deactivate services
- Returns 204 on successful deactivation

#### 5. **Authorization Requirements - Requisites Compliance** (10 tests)

**Admin Operations:**

- Can create services
- Can list all services
- Can update services
- Can deactivate services (soft delete)

**Technician Operations:**

- Cannot create services
- Cannot update services
- Cannot deactivate services
- Can list services (for ticket reference)

**Client Operations:**

- Cannot create services
- Cannot update services
- Cannot deactivate services
- Can list services (for ticket creation)

#### 6. **Validation - Requisites Compliance** (9 tests)

- Minimum 3 characters required in title
- Exactly 3 characters accepted in title
- Negative prices rejected
- Zero price accepted
- Large decimal prices (9999.99) accepted
- UUID format validation in update endpoint
- UUID format validation in deactivation endpoint
- Valid UUID accepted in update
- Valid UUID accepted in deactivation

#### 7. **Service Requisites - Soft Delete Behavior** (3 tests)

- Deactivation of services allowed
- Soft delete prevents display in new ticket creation
- Authentication required for deactivation

#### 8. **Multiple Admin Users** (2 tests)

- Different admins can create different services
- Different admins can list services

#### 9. **Authentication** (4 tests)

- POST endpoint rejects requests without token
- GET endpoint rejects requests without token
- PUT endpoint rejects requests without token
- DELETE endpoint rejects requests without token

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

# Run with verbose output
npm test -- tests/serviceRoutes.spec.ts --verbose
```

## Test Configuration

- **Framework**: Jest with TypeScript support (ts-jest)
- **HTTP Testing**: Supertest for Express testing
- **Environment**: Node.js
- **Test Timeout**: 5 seconds per test (default)
- **Mock UUID**: `serviceId = "55555555-5555-5555-5555-555555555555"`

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

**All 59 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       59 passed, 59 total
Time:        ~16 seconds
```

## Key Testing Patterns

### Authorization Testing

Tests verify that only admin users can create, update, and deactivate services. Tech and client users attempting these operations receive appropriate authorization errors.

### Validation Testing

Tests verify that malformed requests (invalid UUIDs, insufficient title length, negative prices, missing required fields) return 400 Bad Request errors.

### Happy Path Testing

Each endpoint includes tests verifying successful operation with valid authentication and data.

### Role-Based Access Control

Comprehensive testing of Admin, Technician, and Client roles to ensure proper access levels:

- Admin: Full CRUD operations on services
- Tech: Read-only access (for assigning to tickets)
- Client: Read-only access (for creating tickets)

### Soft Delete Strategy

Tests verify that service deactivation follows soft delete strategy:

- Deactivated services don't appear in new operations
- But persist in historical data
- Authentication/authorization still required for deactivation

## Service Examples

The requisites mention 5 service types that should be available:

- Instalação e atualização de softwares (Software Installation and Updates)
- Instalação e atualização de hardwares (Hardware Installation and Updates)
- Diagnóstico e remoção de vírus (Virus Diagnosis and Removal)
- Suporte a impressoras (Printer Support)
- Suporte a periféricos (Peripheral Support)

Additional service examples:

- Solução de problemas de conectividade de internet (Internet Connectivity Troubleshooting)
- Backup e recuperação de dados (Backup and Data Recovery)
- Otimização de desempenho do sistema operacional (OS Performance Optimization)
- Configuração de VPN e Acesso Remoto (VPN and Remote Access Configuration)
