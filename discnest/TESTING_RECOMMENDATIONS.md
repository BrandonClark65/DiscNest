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

#### 7. User Utility Routes
- `GET /api/user/discs/share` - Share bag functionality
- `GET /api/user/onboarded` - Check onboarding status
- `POST /api/user/onboarded` - Update onboarding status

#### 8. Admin Routes
- Admin endpoints (only if actively developing admin features)

---

## Recommended Implementation Order

1. **Profile API** - Great starting point, user-facing, moderate complexity
2. **Listings [id] routes** - Completes listings coverage, important security tests
3. **Auth routes** - Security-critical, should be tested early
4. **User disc routes (update/reorder)** - Completes disc management suite
5. **Requests POST** - Completes requests coverage

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

---

## Notes

- Your existing test structure is excellent and consistent
- Focus on integration tests for API routes (you're doing this well)
- Component tests and unit tests already exist in other directories
- Consider adding tests for edge cases (e.g., concurrent updates, large payloads)

