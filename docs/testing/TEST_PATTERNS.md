# Test Patterns and Conventions

This document outlines the testing patterns, conventions, and best practices used in the DiscNest test suite.

## Table of Contents

- [Test Structure](#test-structure)
- [Mocking Patterns](#mocking-patterns)
- [Test Utilities](#test-utilities)
- [Common Test Scenarios](#common-test-scenarios)
- [Test Organization](#test-organization)
- [Writing New Tests](#writing-new-tests)
- [Test Tags and Categories](#test-tags-and-categories)

## Test Structure

### File Organization

```
tests/
├── component/          # React component tests
├── e2e/               # End-to-end tests (Playwright)
├── helpers/            # Component test helpers
├── hooks/             # Custom hook tests
├── integration/       # API integration tests
│   └── api/          # API route tests
├── setup/             # Test setup files
├── unit/              # Unit tests
└── utils/             # Test utilities (testDb, testServer, testMocks)
```

### Test File Naming

- API tests: `[route-name].test.ts` (e.g., `listings.test.ts`)
- Component tests: `[ComponentName].test.tsx` (e.g., `DiscCard.test.tsx`)
- Hook tests: `use[HookName].test.ts` (e.g., `useChatThread.test.ts`)
- Utility tests: `[utility-name].test.ts` (e.g., `messageMapping.test.ts`)

### Test Structure Template

```typescript
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import { setupStandardMocks, mockRequireUser, resetAllMocks } from "../../utils/testMocks";
import User from "@/models/User";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

// Setup mocks
setupStandardMocks();

describe("GET /api/my-route", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));
    
    const res = await request(app).get("/api/my-route");
    
    expect(res.status).toBe(401);
  });

  test("returns expected data", async () => {
    // Test implementation
  });
});
```

## Mocking Patterns

### Common Mocks

All API tests should use the common mocks from `tests/utils/testMocks.ts`:

```typescript
import { setupStandardMocks } from "../../utils/testMocks";

setupStandardMocks(); // Sets up: DB, error logger, auth, Resend, OpenCage
```

### Authentication Mocking

```typescript
import { mockRequireUser, mockAuthSuccess, mockAuthFailure } from "../../utils/testMocks";
import User from "@/models/User";

// Mock authentication success
const user = await User.create({ /* ... */ });
mockAuthSuccess(user);

// Or manually:
mockRequireUser.mockResolvedValueOnce({
  user: { id: user._id.toString(), email: user.email }
});

// Mock authentication failure
mockAuthFailure();
// Or manually:
mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));
```

### External Service Mocking

#### Cloudinary

```typescript
import { setupCloudinaryMocks, mockUploadStream } from "../../utils/testMocks";

setupCloudinaryMocks();

// Mock successful upload
mockUploadStream.mockImplementation((options, callback) => {
  callback(null, { public_id: "test-id", secure_url: "https://example.com/image.jpg" });
  return { end: vi.fn() };
});
```

#### Resend (Email)

```typescript
import { setupResendMocks, mockSendEmail } from "../../utils/testMocks";

setupResendMocks();

// Mock successful email
mockSendEmail.mockResolvedValueOnce({ id: "email-123" });

// Mock email failure
mockSendEmail.mockRejectedValueOnce(new Error("Email failed"));
```

#### OpenCage (Reverse Geocoding)

```typescript
import { setupOpenCageMocks, mockFetch } from "../../utils/testMocks";

setupOpenCageMocks("New York", "NY");

// Mock API failure
mockFetch.mockRejectedValueOnce(new Error("Network error"));
```

#### NSFW Model

```typescript
import { setupNSFWModelMocks, mockNSFWModel } from "../../utils/testMocks";

setupNSFWModelMocks();

// Mock NSFW classification
mockNSFWModel.classify.mockResolvedValueOnce([
  { className: "Porn", probability: 0.1 }, // Below threshold
]);
```

## Test Utilities

### Database Utilities

```typescript
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";

beforeAll(connectTestDb);    // Connect to in-memory MongoDB
afterEach(resetTestDb);      // Clear all collections
afterAll(closeTestDb);       // Close connection
```

### Test Server

```typescript
import app from "../../utils/testServer";
import request from "supertest";

// Make requests to your API routes
const res = await request(app)
  .get("/api/listings")
  .send({ /* body */ });
```

### Mock Utilities

See `tests/utils/testMocks.ts` for all available utilities:
- `setupStandardMocks()` - Common mocks for most routes
- `setupFullMocks()` - All mocks including external services
- `mockAuthSuccess(user)` - Helper for authenticated requests
- `mockAuthFailure()` - Helper for unauthenticated requests
- `resetAllMocks()` - Reset all mocks in afterEach

## Common Test Scenarios

### Testing Authentication

```typescript
test("requires authentication", async () => {
  mockAuthFailure();
  
  const res = await request(app).get("/api/protected-route");
  
  expect(res.status).toBe(401);
  expect(res.body.error).toBeDefined();
});
```

### Testing Authorization (Ownership)

```typescript
test("only owner can update", async () => {
  const owner = await User.create({ /* ... */ });
  const otherUser = await User.create({ /* ... */ });
  const listing = await Listing.create({ userId: owner._id });
  
  mockAuthSuccess(otherUser);
  
  const res = await request(app)
    .patch(`/api/listings/${listing._id}`)
    .send({ /* update data */ });
  
  expect(res.status).toBe(403);
});
```

### Testing Validation

```typescript
test("validates required fields", async () => {
  mockAuthSuccess(user);
  
  const res = await request(app)
    .post("/api/listings")
    .send({}); // Missing required fields
  
  expect(res.status).toBe(400);
  expect(res.body.error).toContain("required");
});
```

### Testing 404 Errors

```typescript
test("returns 404 for non-existent resource", async () => {
  mockAuthSuccess(user);
  
  const res = await request(app)
    .get("/api/listings/non-existent-id");
  
  expect(res.status).toBe(404);
});
```

### Testing External Service Failures

```typescript
test("handles Cloudinary upload failure", async () => {
  mockAuthSuccess(user);
  mockUploadStream.mockImplementation((options, callback) => {
    callback(new Error("Upload failed"), null);
    return { end: vi.fn() };
  });
  
  const res = await request(app)
    .post("/api/upload")
    .attach("file", buffer, "test.jpg");
  
  expect(res.status).toBe(500);
  expect(res.body.error).toBeDefined();
});
```

## Test Organization

### Test Categories

Tests are organized by type and can be filtered using tags:

- `@unit` - Unit tests
- `@integration` - Integration tests
- `@component` - Component tests
- `@e2e` - End-to-end tests
- `@api` - API route tests
- `@auth` - Authentication-related tests
- `@external` - Tests involving external services
- `@performance` - Performance tests
- `@edge-case` - Edge case tests

### Grouping Related Tests

Use `describe` blocks to group related tests:

```typescript
describe("POST /api/listings", () => {
  describe("authentication", () => {
    test("requires authentication", () => { /* ... */ });
  });
  
  describe("validation", () => {
    test("validates required fields", () => { /* ... */ });
    test("validates field types", () => { /* ... */ });
  });
  
  describe("business logic", () => {
    test("creates listing", () => { /* ... */ });
    test("sets default values", () => { /* ... */ });
  });
});
```

## Writing New Tests

### Checklist for New API Route Tests

- [ ] Import test utilities (`testServer`, `testDb`, `testMocks`)
- [ ] Set up appropriate mocks (`setupStandardMocks()` or `setupFullMocks()`)
- [ ] Use `beforeAll(connectTestDb)`, `afterEach(resetTestDb)`, `afterAll(closeTestDb)`
- [ ] Test authentication requirement (if route is protected)
- [ ] Test validation errors
- [ ] Test successful operations
- [ ] Test error cases (404, 403, 500)
- [ ] Test edge cases (empty data, boundary values)
- [ ] Reset mocks in `afterEach` using `resetAllMocks()`

### Example: Complete Test File

```typescript
import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../../utils/testServer";
import { connectTestDb, resetTestDb, closeTestDb } from "../../utils/testDb";
import { setupStandardMocks, mockRequireUser, mockAuthSuccess, resetAllMocks } from "../../utils/testMocks";
import User from "@/models/User";
import Listing from "@/models/Listing";
import { UnauthorizedError } from "@/lib/errors/UnauthorizedError";

setupStandardMocks();

describe("GET /api/listings", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("returns empty array initially", async () => {
    const res = await request(app).get("/api/listings");
    
    expect(res.status).toBe(200);
    expect(res.body.listings).toEqual([]);
  });

  test("returns listings", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });
    
    await Listing.create({
      userId: user._id,
      title: "Test Listing",
      price: 20,
      // ... other fields
    });
    
    const res = await request(app).get("/api/listings");
    
    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].title).toBe("Test Listing");
  });
});

describe("POST /api/listings", () => {
  beforeAll(connectTestDb);
  afterEach(async () => {
    await resetTestDb();
    resetAllMocks();
  });
  afterAll(closeTestDb);

  test("requires authentication", async () => {
    mockRequireUser.mockRejectedValueOnce(new UnauthorizedError("Unauthorized"));
    
    const res = await request(app)
      .post("/api/listings")
      .send({ title: "Test", price: 20 });
    
    expect(res.status).toBe(401);
  });

  test("creates listing", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashed",
    });
    
    mockAuthSuccess(user);
    
    const res = await request(app)
      .post("/api/listings")
      .send({
        title: "Test Listing",
        price: 20,
        // ... other required fields
      });
    
    expect(res.status).toBe(200);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.title).toBe("Test Listing");
  });
});
```

## Test Tags and Categories

### Running Tests by Tag

```bash
# Run only API tests
npm test -- --grep @api

# Run only authentication tests
npm test -- --grep @auth

# Run only external service tests
npm test -- --grep @external

# Run performance tests
npm test -- --grep @performance
```

### Adding Tags to Tests

```typescript
describe("POST /api/upload @api @external", () => {
  // Tests for upload endpoint
});

test("handles Cloudinary failure @external @error", () => {
  // Test implementation
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always reset database and mocks in `afterEach`
3. **Descriptive Names**: Test names should clearly describe what they test
4. **Arrange-Act-Assert**: Structure tests with clear sections
5. **Mock External Services**: Never make real API calls in tests
6. **Test Edge Cases**: Include boundary values, empty data, null/undefined
7. **Test Error Paths**: Test both success and failure scenarios
8. **Use Helpers**: Reuse test utilities instead of duplicating code
9. **Document Complex Tests**: Add JSDoc comments for complex test scenarios
10. **Keep Tests Fast**: Use in-memory database and mocked services

## Common Pitfalls

1. **Forgetting to Reset Mocks**: Always reset mocks in `afterEach`
2. **Not Cleaning Database**: Use `resetTestDb()` in `afterEach`
3. **Real External Calls**: Ensure all external services are mocked
4. **Test Dependencies**: Avoid tests that depend on execution order
5. **Hardcoded IDs**: Use MongoDB ObjectIds from created documents
6. **Missing Authentication**: Test both authenticated and unauthenticated cases

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](./TESTING_RECOMMENDATIONS.md)

