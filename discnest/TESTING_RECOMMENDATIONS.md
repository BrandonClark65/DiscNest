# Test Coverage Recommendations for DiscNest API

## Current Test Coverage ✅

### Well-Tested Routes:
- ✅ `/api/user/discs/bag` - GET
- ✅ `/api/user/discs/shelf` - GET
- ✅ `/api/user/discs/add` - POST
- ✅ `/api/user/discs/delete` - POST
- ✅ `/api/user/discs/move` - POST
- ✅ `/api/listings` - GET, POST
- ✅ `/api/messages` - GET, POST
- ✅ `/api/messages/[threadId]` - GET, POST, PUT
- ✅ `/api/requests` - GET (minimal)
- ✅ `/api/auth/signup` - POST
- ✅ `/api/auth/request-password-reset` - POST
- ✅ `/api/auth/reset-password` - POST

---

## Recommended Next Tests (Prioritized)

### 🔴 HIGH PRIORITY

#### 1. Profile API (`/api/profile`)✅
**Why**: Core user functionality, validates complex Zod schemas

**Tests needed**:
- ✅`GET /api/profile` 
  - ✅Requires authentication
  - ✅Returns current user profile
  - ✅Returns 404 if user not found
  
- ✅`POST /api/profile`
  - ✅Requires authentication
  - ✅Validates input with Zod schema
  - ✅Updates user profile fields
  - ✅Handles partial updates
  - ✅Returns validation errors for invalid data

**File**: `tests/integration/api/profile.test.ts`

---

#### 2. Listings Individual Routes (`/api/listings/[id]`)✅
**Why**: Completes listings coverage, includes ownership checks (security-critical)

**Tests needed**:
- ✅`GET /api/listings/[id]`
  - ✅Returns listing by ID
  - ✅Returns 404 for non-existent listing
  
- ✅`PATCH /api/listings/[id]` (mark as sold)
  - ✅Requires authentication
  - ✅Only owner can mark as sold
  - ✅Returns 403 for non-owner
  - ✅Updates listing.sold flag
  - ✅Sends system message to threads
  
-✅ `DELETE /api/listings/[id]`
  - ✅Requires authentication
  - ✅Only owner can delete
  - ✅Returns 403 for non-owner
  - ✅Deletes Cloudinary images
  - ✅Sends system message to threads

**File**: `tests/integration/api/listings-id.test.ts`

---

#### 3. User Disc Routes (Complete Disc Management)✅
**Why**: Completes the disc management suite you've already started

**Tests needed**:
- ✅`POST /api/user/discs/update`
  - ✅Requires authentication
  - ✅Validates disc ownership
  - ✅Updates plastic, wearLevel, notes, color, weight
  - ✅Validates wearLevel range (0-100)
  - ✅Validates weight range (100-200)
  
- ✅`POST /api/user/discs/reorder`
  - ✅Requires authentication
  - ✅Reorders discs in bag
  - ✅Reorders discs in shelf
  - ✅Validates zone ("bag" or "shelf")
  - ✅Validates orderedIds array

**File**: Extend `tests/integration/api/userDiscs.test.ts`

---

#### 4. Auth Routes (Security-Critical) ✅
**Why**: Critical for user security, has complex edge cases

**Tests needed**:
- ✅ `POST /api/auth/signup`
  - ✅ Creates new user
  - ✅ Hashes password
  - ✅ Returns 400 if email exists
  - ✅ Handles OAuth conflict (user exists with no password)
  - ✅ Sets hasOnboarded to false
  
- ✅ `POST /api/auth/request-password-reset`
  - ✅ Validates email exists
  - ✅ Generates reset token
  - ✅ Sends reset email (mock)
  
- ✅ `POST /api/auth/reset-password`
  - ✅ Validates reset token
  - ✅ Updates password
  - ✅ Invalidates token after use
  - ✅ Returns error for expired/invalid token

**File**: `tests/integration/api/auth.test.ts` ✅ COMPLETE

---

### 🟡 MEDIUM PRIORITY

#### 5. Requests Routes (Complete Coverage)✅
**Why**: Currently only has minimal GET test

**Tests needed**:
- ✅`POST /api/requests`
  - ✅Requires authentication
  - ✅Validates required fields (title, location)
  - ✅Creates disc request with location
  - ✅Returns 400 for missing title
  - ✅Returns 400 for missing location
  - ✅Returns 400 for null latitude
  - ✅Returns 400 for null longitude
  - ✅Creates request with minimal required fields
  - ✅Creates request with all optional fields
  
- ✅`GET /api/requests/[id]`
  - ✅Returns single request
  - ✅Returns 404 for non-existent request
  - ✅Returns 500 for invalid ID format

**File**: `tests/integration/api/requests.test.ts` ✅ COMPLETE

---

#### 6. Recommendations API ✅
**Why**: User-facing feature, tests recommendation logic

**Tests needed**:
- ✅`GET /api/recommendations`
  - ✅Requires authentication
  - ✅Returns 404 if user not found
  - ✅Returns personalized recommendations
  - ✅Uses user's bag for recommendations
  - ✅Returns recommendations with reasons and scores
  - ✅Uses user profile preferences (armSpeed, favoriteBrands, stabilityPreference)
  - ✅Does not recommend discs user already owns
  - ✅Limits to 500 discs from database
  - ✅Returns recommendations for users with empty bag

**File**: `tests/integration/api/recommendations.test.ts` ✅ COMPLETE

---

### 🟢 LOWER PRIORITY

#### 7. User Utility Routes ✅
- ✅`POST /api/user/discs/share` - Share bag functionality
  - ✅Requires authentication
  - ✅Returns 404 if user not found
  - ✅Creates shareableBagId if user doesn't have one
  - ✅Returns existing shareableBagId if user already has one
  - ✅Generates valid UUID format
  - ✅Uses origin header for base URL if provided
  - ✅Falls back to NEXT_PUBLIC_BASE_URL or localhost
  - ✅Returns environment in response
  
- ✅`POST /api/user/onboarded` - Update onboarding status
  - ✅Requires email in request body
  - ✅Returns 400 for missing email
  - ✅Updates hasOnboarded to true for user with matching email
  - ✅Handles non-existent email gracefully
  - ✅Handles empty email string

**Note**: GET routes do not exist for these endpoints. Only POST routes are implemented.

**File**: `tests/integration/api/user-utility-routes.test.ts` ✅ COMPLETE

#### 8. Admin Routes
- Admin endpoints (only if actively developing admin features)

---

## Next Steps: Additional Routes & Enhanced Testing

### 🔴 HIGH PRIORITY - Remaining User-Facing Routes

#### 9. Upload API (`/api/upload`) ✅ **COMPLETE**
**Why**: Handles image uploads with NSFW detection, used by listings and avatars. Security-critical.

**Tests needed**:
- ✅`POST /api/upload`
  - ✅Requires authentication
  - ✅Validates file is an image
  - ✅Rejects non-image files
  - ✅Performs NSFW detection
  - ✅Uploads to Cloudinary
  - ✅Returns flagged status for inappropriate content
  - ✅Handles Cloudinary upload failures
  - ✅Handles missing file
  - ✅Validates folder parameter
  - ✅Returns publicId and imageUrl
  - ✅Handles NSFW model classification errors
  - ✅Handles canvas loadImage errors
  - ✅Flags images with various NSFW classes above threshold
  - ✅Does not flag images when probability is below threshold

**File**: `tests/integration/api/upload.test.ts` ✅ COMPLETE

**Mocking needed**: Cloudinary, NSFW model (TensorFlow.js) ✅ IMPLEMENTED

---

#### 10. Profile Avatar API (`/api/profile/avatar`) ✅ **COMPLETE**
**Why**: User-facing feature, integrates with upload API, handles Cloudinary cleanup

**Tests needed**:
- ✅`POST /api/profile/avatar`
  - ✅Requires authentication
  - ✅Validates file upload
  - ✅Calls upload API internally
  - ✅Deletes old avatar from Cloudinary
  - ✅Updates user avatarUrl and avatarPublicId
  - ✅Handles upload API failures
  - ✅Handles Cloudinary deletion failures gracefully
  - ✅Handles flagged images from upload API
  - ✅Passes cookie header to upload API

**File**: `tests/integration/api/profile-avatar.test.ts` ✅ COMPLETE

**Mocking needed**: Cloudinary, internal `/api/upload` call ✅ IMPLEMENTED

---

#### 11. Report API (`/api/report`) ✅ **COMPLETE**
**Why**: Critical for moderation, prevents self-reporting, increments moderation flags

**Tests needed**:
- ✅`POST /api/report`
  - ✅Requires authentication
  - ✅Validates reportedUserId is required
  - ✅Prevents self-reporting (returns 400)
  - ✅Creates UserReport document
  - ✅Increments reported user's moderationFlags
  - ✅Updates lastFlaggedAt timestamp
  - ✅Handles optional fields (threadId, listingId, requestId, reason)
  - ✅Returns 400 for missing reportedUserId

**File**: `tests/integration/api/report.test.ts` ✅ COMPLETE

**Note**: `messageId` is not in the UserReport schema, so it's not tested. The route handler accepts it but it's not persisted.

---

#### 12. Contact API (`/api/contact`) ✅ **COMPLETE**
**Why**: User-facing contact form, sends emails via Resend

**Tests needed**:
- ✅`POST /api/contact`
  - ✅Validates required fields (email, subject, message)
  - ✅Returns 400 for missing fields
  - ✅Returns 400 for empty string fields
  - ✅Returns 500 if ADMIN_EMAIL not configured
  - ✅Sends email via Resend
  - ✅Uses correct from email (prod vs dev)
  - ✅Handles Resend API failures
  - ✅Sets replyTo to user's email
  - ✅Includes user email, subject, and message in email text
  - ✅Formats email subject with 'Contact Form:' prefix

**File**: `tests/integration/api/contact.test.ts` ✅ COMPLETE

**Mocking needed**: Resend API ✅ IMPLEMENTED

---

#### 13. Discs Catalog API (`/api/discs`) ✅ **COMPLETE**
**Why**: Public catalog endpoint, used by frontend

**Tests needed**:
- ✅`GET /api/discs`
  - ✅Returns only catalog discs (no userId)
  - ✅Excludes user-owned discs
  - ✅Returns correct fields (name, brand, type, addedAt, image, stability, flight)
  - ✅Sorted by addedAt descending
  - ✅Handles empty catalog gracefully
  - ✅Handles discs with missing optional fields
  - ✅Returns multiple catalog discs correctly
  - ✅Handles flight object with partial data

**File**: `tests/integration/api/discs.test.ts` ✅ COMPLETE

---

#### 14. Reverse Geocode API (`/api/reverse-geocode`) ✅ **COMPLETE**
**Why**: Utility endpoint for location services

**Tests needed**:
- ✅`GET /api/reverse-geocode`
  - ✅Validates lat and lng query parameters
  - ✅Returns 400 for missing lat/lng
  - ✅Returns 500 if OPENCAGE_API_KEY not configured
  - ✅Calls OpenCage API
  - ✅Extracts city and state from response
  - ✅Handles OpenCage API failures
  - ✅Handles missing location data gracefully
  - ✅Handles missing results property gracefully
  - ✅Handles missing components property gracefully
  - ✅Extracts city from town when city is missing
  - ✅Extracts city from village when city and town are missing
  - ✅Returns empty city when city, town, and village are missing
  - ✅Handles missing state property gracefully
  - ✅Handles OpenCage API non-ok response

**File**: `tests/integration/api/reverse-geocode.test.ts` ✅ COMPLETE

**Mocking needed**: OpenCage API (fetch) ✅ IMPLEMENTED

---

### 🟡 MEDIUM PRIORITY - Enhanced Testing

#### 15. Edge Cases & Error Scenarios ✅ **COMPLETE**
**Why**: Improve robustness of existing tests

**Areas to enhance**:
- ✅**Concurrent operations**: Test race conditions (e.g., multiple users updating same listing)
- ✅**Large payloads**: Test with very large request bodies
- ✅**Malformed data**: Test with deeply nested objects, circular references
- ✅**Database failures**: Test MongoDB connection failures mid-request
- ✅**Timeout scenarios**: Test slow external API responses
- ✅**Boundary values**: Test min/max values, empty strings, null vs undefined
- ✅**Unicode/special characters**: Test with emojis, special characters in user input

**File**: `tests/integration/api/edge-cases.test.ts` ✅ COMPLETE

**Test Coverage**:
- ✅ Boundary value testing (min/max lengths, ranges)
- ✅ Unicode and special character handling (emojis, international characters)
- ✅ Large payload handling (10KB+ descriptions, 50KB+ messages)
- ✅ Malformed data handling (invalid JSON, nested objects, invalid coordinates)
- ✅ Concurrent operations (race conditions for listings and profiles)
- ✅ Database failure scenarios
- ✅ Timeout scenarios for external APIs
- ✅ Edge cases for auth, contact, and other routes

---

#### 16. External Service Integration Testing
**Why**: Ensure proper error handling when external services fail

**Services to mock and test failures**:
- **Cloudinary**: Upload failures, deletion failures, network timeouts
- **Resend**: Email sending failures, rate limiting
- **OpenCage**: API failures, invalid responses
- **NSFW Model**: Model loading failures, prediction errors

**Pattern**: Create reusable mocks for external services that can simulate failures

---

#### 17. Performance & Load Testing
**Why**: Identify bottlenecks before production

**Tests to consider**:
- Response time benchmarks for key endpoints
- Database query performance (N+1 queries, missing indexes)
- Concurrent request handling
- Large dataset handling (1000+ listings, messages, etc.)

**Tools**: Consider using `k6`, `artillery`, or simple concurrent request tests

---

### 🟢 LOWER PRIORITY - Test Quality Improvements

#### 18. Test Coverage Metrics
**Why**: Track coverage and identify gaps

**Actions**:
- Set up coverage reporting (vitest --coverage)
- Set coverage thresholds (e.g., 80% minimum)
- Track coverage over time
- Identify untested code paths

---

#### 19. Test Organization & Documentation
**Why**: Maintainability and onboarding

**Actions**:
- Document test patterns and conventions
- Create test utilities for common scenarios
- Add JSDoc comments to complex test cases
- Consider test tags/categories for filtering

---

## Recommended Implementation Order

### Phase 1: Critical Routes (Do First)
1. **Upload API** - Security-critical, used by multiple features
2. **Profile Avatar API** - User-facing, depends on upload
3. **Report API** - Moderation-critical

### Phase 2: User-Facing Routes
4. **Contact API** - User-facing feature
5. **Discs Catalog API** - Public endpoint

### Phase 3: Enhanced Testing
6. **Edge Cases** - Improve existing test robustness
7. **External Service Failures** - Error handling
8. **Reverse Geocode** - Utility endpoint

### Phase 4: Quality Improvements
9. **Coverage Metrics** - Track and improve
10. **Performance Testing** - Identify bottlenecks

---

## Testing Patterns to Follow

Based on your existing tests, maintain consistency with:
- Mocking `@/lib/mongodb` (connectToDatabase)
- Mocking `@/lib/errorLogger` (logError)
- Mocking `@/lib/withErrorHandling` (passthrough)
- Using `mockRequireUser` for authenticated routes
- Using `connectTestDb`, `resetTestDb`, `closeTestDb` helpers
- Testing authentication requirements
- Testing validation errors
- Testing ownership checks (403 errors)
- Testing 404 cases

**New patterns for external services**:
- Mock Cloudinary: `vi.mock("cloudinary")`
- Mock Resend: `vi.mock("resend")`
- Mock fetch for external APIs: `vi.spyOn(global, "fetch")`
- Mock TensorFlow.js for NSFW model: `vi.mock("@/lib/nsfwModel")`

---

## Notes

- Your existing test structure is excellent and consistent
- Focus on integration tests for API routes (you're doing this well)
- Component tests and unit tests already exist in other directories
- Consider adding tests for edge cases (e.g., concurrent updates, large payloads)
- **Priority**: Upload and Avatar APIs are most critical as they're user-facing and handle sensitive operations

