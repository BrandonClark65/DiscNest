# Test Suite Documentation

This directory contains the test suite for DiscNest. This README provides a quick overview and links to detailed documentation.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/integration/api/listings.test.ts
```

## Test Structure

```
tests/
├── component/          # React component tests (React Testing Library)
├── e2e/               # End-to-end tests (Playwright)
├── helpers/            # Component test helpers
├── hooks/             # Custom hook tests
├── integration/       # API integration tests
│   └── api/          # API route tests
├── setup/             # Test setup files
├── unit/              # Unit tests
└── utils/             # Test utilities
    ├── testDb.ts      # Database utilities (MongoDB Memory Server)
    ├── testServer.ts  # Express server for API testing
    └── testMocks.ts   # Common mocks and helpers
```

## Documentation

- **[Test Patterns & Conventions](./docs/testing/TEST_PATTERNS.md)** - Comprehensive guide to writing tests
- **[Testing Recommendations](./docs/testing/TESTING_RECOMMENDATIONS.md)** - Test coverage roadmap and priorities
- **[Coverage Documentation](./docs/testing/COVERAGE.md)** - Coverage tracking and reporting

## Test Utilities

### Using Test Mocks

The `tests/utils/testMocks.ts` file provides reusable mocks and helpers:

```typescript
import { setupStandardMocks, mockAuthSuccess, resetAllMocks } from "../../utils/testMocks";
import User from "@/models/User";

// Setup common mocks (database, auth, Resend, OpenCage)
setupStandardMocks();

describe("My API Route", () => {
  afterEach(() => {
    resetAllMocks(); // Reset all mocks
  });

  test("requires authentication", async () => {
    const user = await User.create({ /* ... */ });
    mockAuthSuccess(user); // Helper to mock authenticated user
    
    // ... test code
  });
});
```

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

const res = await request(app)
  .get("/api/listings")
  .send({ /* body */ });
```

## Common Patterns

### Testing Authentication

```typescript
import { mockAuthFailure } from "../../utils/testMocks";

test("requires authentication", async () => {
  mockAuthFailure();
  const res = await request(app).get("/api/protected");
  expect(res.status).toBe(401);
});
```

### Testing External Services

```typescript
import { setupCloudinaryMocks, mockUploadStream } from "../../utils/testMocks";

setupCloudinaryMocks();

test("handles upload failure", async () => {
  mockUploadStream.mockImplementation((options, callback) => {
    callback(new Error("Upload failed"), null);
    return { end: vi.fn() };
  });
  // ... test code
});
```

## Best Practices

1. **Use test utilities** - Don't duplicate mock setup code
2. **Reset mocks** - Always reset mocks in `afterEach`
3. **Clean database** - Use `resetTestDb()` in `afterEach`
4. **Test isolation** - Each test should be independent
5. **Descriptive names** - Test names should clearly describe what they test
6. **Document complex tests** - Add JSDoc comments for complex scenarios

## Running Specific Test Categories

While Vitest doesn't have built-in tag support, you can organize tests using describe blocks and filter by name:

```bash
# Run only API tests
npm test -- tests/integration/api

# Run only component tests
npm test -- tests/component

# Run tests matching a pattern
npm test -- --grep "authentication"
```

## Coverage

Coverage reports are generated in the `coverage/` directory. See [COVERAGE.md](./docs/testing/COVERAGE.md) for details.

## Need Help?

- Check [TEST_PATTERNS.md](./docs/testing/TEST_PATTERNS.md) for detailed patterns and examples
- Review existing test files for examples
- See [TESTING_RECOMMENDATIONS.md](./docs/testing/TESTING_RECOMMENDATIONS.md) for test coverage priorities

