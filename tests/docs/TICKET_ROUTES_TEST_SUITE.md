# Ticket Routes Test Suite

## Overview

A comprehensive Jest test suite for all ticket routes in the helpdesk API, ensuring compliance with the system's requisites and proper authorization checks across all ticket operations.

## Test Coverage

### 44 Total Tests covering:

#### 1. **POST /tickets** - Create Ticket (9 tests)

- Authentication required (401 when missing token)
- Tech cannot create tickets
- Admin cannot create tickets
- At least one service must sent (0 services -> 400)
- Not valid techId returns error 400
- Inexistent tech returns error 400
- Not valid serviceId returns error 400
- 2 services, 1 inexistent -> error 400
- Client successfully creates ticket with valid data

#### 2. **GET /tickets/clientHistory** - List Client Tickets (4 tests)

- Authentication required (401 when missing token)
- Tech cannot view client history
- Admin cannot view client history
- Client can view their own ticket history

#### 3. **GET /tickets/tech** - List Tech Tickets (4 tests)

- Authentication required (401 when missing token)
- Client cannot list tech tickets (403)
- Admin cannot list tech tickets (403)
- Technician can list their assigned tickets

#### 4. **GET /tickets/list** - List All Tickets (4 tests)

- Authentication required (401 when missing token)
- Client cannot list all tickets (403)
- Tech cannot list all tickets (403)
- Admin can list all tickets in system

#### 5. **PUT /tickets/addServices/:ticketId** - Add Services to Ticket (12 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (only tech and admin can add services)
- Technician can add services to a ticket
- Admin can add services to a ticket
- It returns 400 when ticketId is not UUID
- It returns 400 when ticketId doesn't exists
- It returns 400 when servicesIds is empty
- It returns 400 when servicesIds has non-UUID values
- It returns 400 when servicesIds doesn't exists
- Tech can add more than one service
- Tech can't add services to other techs tickets
- It returns 400 when some of the services doesn't exists

#### 6. **PUT /tickets/status/:ticketId** - Update Ticket Status (11 tests)

- Authentication required (401 when missing token)
- Authorization enforcement (client cannot update status)
- Tech can update ticket status
- Admin can update ticket status
- Invalid status returns error 400
- Accepts status "aberto"
- Accepts status "em_atendimento"
- Accepts status "encerrado"
- Rejects not UUID ticketId
- Rejects inexistent ticketId
- Tech cannot update other tech ticket status

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
npm test --coverage
```

## Test Configuration

- **Framework**: Jest with TypeScript support (ts-jest)
- **HTTP Testing**: Supertest for Express testing
- **Environment**: Node.js
- **Test Timeout**: 5 seconds per test

## Notes

- Tests use `supertest` to make HTTP requests to Express app
- All tests are independent and use mocked JWT tokens (no database required)
- Tests verify both authorization (role-based access) and validation (data format)
- Authorization failures typically return 403, validation failures return 400
- The test suite respects the business requisites defined in `requisites.md`

## Test Results

**All 44 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       44 passed, 44 total
Time:        ~5 seconds
```
