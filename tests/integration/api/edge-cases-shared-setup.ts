// tests/integration/api/edge-cases-shared-setup.ts
// Shared mocks and setup for edge case tests
// Re-export mocks from centralized testMocks for convenience
export {
  setupFullMocks,
  mockRequireUser,
  mockGetServerSession,
  mockAddSystemMessageToThreads,
  mockIsProfane,
  mockSendEmail,
  mockCloudinaryDestroy,
  mockFetch,
  resetAllMocks,
} from "../../utils/testMocks";

// Setup all mocks
import { setupFullMocks } from "../../utils/testMocks";
setupFullMocks();

