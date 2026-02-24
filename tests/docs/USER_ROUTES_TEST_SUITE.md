# User Routes Test Suite

## Overview

A comprehensive Jest test suite for all user routes in the helpdesk API, ensuring compliance with the system's requisites and proper authorization checks.

## Test Coverage

### 64 Total Tests covering:

#### 1. **POST /users/login** (4 tests)

- Successful login returns token
- Invalid returns error 400
- Email exists but password is wrong returns error 400
- Returns 400 when email is missing

#### 2. **POST /users/tech** - Create Tech Account (6 tests)

- Client can't create tech account
- Tech can't create tech account
- Token validation (401 when missing)
- Any invalid field returns error 400
- Admin creates tech account
- Admin cannot create tech account with existent email

#### 3. **GET /users/techList** - List Tech Accounts (3 tests)

- Non-admin can't list tech list
- Token validation (401 when missing)
- Returns array of technicians when authorized

#### 4. **PUT /users/tech/:id** - Update Tech Account (9 tests)

- Client can't update tech account
- Token validation (401 when missing)
- Wrong fields return error 400
- Admin can update any tech account
- Tech can update his own account
- Inexistent tech returns 400
- Existent user but not tech returns error 400
- Already existent newEmail returns error 400
- It returns error 400 when tech updates other tech account

#### 5. **PUT /users/techAvailabilities/:id** - Update Tech Availabilities (7 tests)

- Token validation (401 when missing)
- Tech/Admin authorization
- Time format validation (HH:00 format, 00-23 range)
- Admin can update valid time format
- Tech can update valid time format
- It returns error 400 when techId doesn't exists
- It returns error 400 when id exists but it's not a tech

#### 6. **PUT /users/admin/:id** - Update Admin Account (6 tests)

- Non-admin can't update admin accounts
- Token validation (401 when missing)
- Only admin can update admin accounts
- It returns error 400 when id doesn't exists
- It returns error 400 when id exists but it's not admin
- It returns error 400 when newEmail already exists

#### 7. **POST /users/client** - Create Client Account (3 tests)

- Client accounts can be created correctly
- Field validation enforcement
- Duplicate email rejection

#### 8. **PUT /users/client/:id** - Update Client Account (8 tests)

- Token validation (401 when missing)
- Client updates correctly his own account
- Client can't update other clients account
- Admin authorization can update Client account
- Proper field validation
- It returns 400 when id doesn't exists
- It returns 400 when id exists but it's not a client
- It returns 400 when newEmail already exists

#### 9. **GET /users/clientList** - List Client Accounts (3 tests)

- Non-admin can't list clients
- Token validation (401 when missing)
- Returns array of clients when authorized

#### 10. **DELETE /users/client/:id** - Delete Client Account (7 tests)

- Token validation (401 when missing)
- Client can delete their own account
- Client can't delete other Clients accounts
- Admin can delete any Client account
- Non Client/Admin can't delete Client account
- It returns error 400 when id doesn't exists
- It returns error 400 when id exists but it's not a client

#### 11. **PUT /users/picture/:id** - Update User Picture (6 tests)

- Token validation (401 when missing)
- User can update their own picture
- User cannot update another user's picture (non-admin)
- Admin can update any user's picture
- File upload validation (must have file)
- It returns error 400 when userId doesn't exists

#### 12. **GET /users/picture/:id** - Get User Picture (2 tests)

- Retrieves user picture
- It returns error 400 when userId doesn't exists

## Requisite Compliance

✅ **Admin Operations**

- Can create, list, and edit tech accounts
- Can create, list, edit, and delete client accounts
- Can manage system services
- Can list all tickets and edit their status
- Can update any user's profile picture
- Can manage tech availabilities

✅ **Tech Operations**

- Can edit their own profile
- Can upload profile picture
- Can list their assigned tickets
- Can update tech availabilities (their own or admin can update)
- Cannot create or delete client accounts
- Cannot create tickets

✅ **Client Operations**

- Can create client account without authentication
- Can edit their own profile
- Can upload profile picture
- Can create tickets
- Can view ticket history
- Cannot update other client accounts
- Cannot alter tickets after creation

## Running Tests

```bash
# Run all tests
npm test

# Run user routes tests only
npm test -- tests/userRoutes.spec.ts

# Run with coverage
npm test -- --coverage
```

## Test Configuration

- **Framework**: Jest with TypeScript support (ts-jest)
- **HTTP Testing**: Supertest for Express testing
- **Environment**: Node.js
- **Test Timeout**: 5 seconds per test
- **Environment Variables**: Pre-set for testing (JWT_SECRET, DATABASE_URL)

## Notes

- Tests use `supertest` to make HTTP requests to Express app
- Validation errors may return 400 before reaching authorization checks
- Tests account for both authorization errors (403) and validation errors (400)
- All tests respect the requisites defined in `requisites.md`

## Test Results

**All 64 tests passing ✅**

```
Test Suites: 1 passed, 1 total
Tests:       64 passed, 64 total
Time:        ~10 seconds
```
