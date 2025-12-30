# Seller Ratings Implementation Plan

## Overview
Implement a rating system where users can rate each other after meaningful interactions. Each user will have an average rating (out of 5 stars) displayed on their profile.

## Key Requirements
- Users can rate each other after interacting more than X times
- Each user has an average rating displayed on their profile
- **Seller ratings are displayed on all listings they own** (e.g., on ListingCard, listing detail page)
- **Public user reviews page** - Users can view other users' ratings/reviews without full profile access
- Ratings are based on completed transactions or meaningful message exchanges
- Prevent duplicate ratings for the same interaction
- **All new features must have comprehensive test coverage** (unit, integration, and E2E tests)

---

## 1. Data Model Design

### 1.1 Create Rating Model (`src/models/Rating.ts`)

```typescript
import { Schema, model, models } from "mongoose";

const RatingSchema = new Schema({
  // Who is being rated
  ratedUserId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  
  // Who is giving the rating
  raterUserId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  
  // The rating value (1-5 stars)
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5 
  },
  
  // Optional review text
  review: { 
    type: String, 
    maxlength: 500 
  },
  
  // What interaction this rating is for
  listingId: { 
    type: Schema.Types.ObjectId, 
    ref: "Listing" 
  },
  requestId: { 
    type: Schema.Types.ObjectId, 
    ref: "DiscRequest" 
  },
  
  // Timestamp
  createdAt: { type: Date, default: Date.now },
  
  // Optional: mark if this was a buyer or seller rating
  role: { 
    type: String, 
    enum: ["buyer", "seller"], 
    required: true 
  },
});

// Prevent duplicate ratings for the same interaction
// A user can only rate another user once per listing/request
RatingSchema.index(
  { raterUserId: 1, ratedUserId: 1, listingId: 1 }, 
  { unique: true, sparse: true }
);
RatingSchema.index(
  { raterUserId: 1, ratedUserId: 1, requestId: 1 }, 
  { unique: true, sparse: true }
);

// Index for efficient queries
RatingSchema.index({ ratedUserId: 1, createdAt: -1 });

export default models.Rating || model("Rating", RatingSchema);
```

### 1.2 Update User Model

Add computed rating fields to User model:

```typescript
// Add to UserSchema in src/models/User.ts
averageRating: { type: Number, default: null }, // null if no ratings yet
ratingCount: { type: Number, default: 0 },
```

**Note:** These should be computed fields, not stored directly. Use virtuals or calculate on-the-fly for accuracy.

---

## 2. Interaction Tracking

### 2.1 Define "Interaction" Criteria

An interaction qualifies when:
- **Option A (Recommended):** Listing is marked as sold AND users have exchanged at least X messages
- **Option B:** Users have exchanged at least X messages (regardless of sale)
- **Option C:** Listing is marked as sold (regardless of messages)

**Recommendation:** Use Option A with X = 3 messages minimum. This ensures:
- Real transaction occurred (listing sold)
- Meaningful communication happened

### 2.2 Track Interactions

Create an `Interaction` model to track when users become eligible to rate each other:

```typescript
// src/models/Interaction.ts
const InteractionSchema = new Schema({
  user1Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user2Id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  listingId: { type: Schema.Types.ObjectId, ref: "Listing" },
  requestId: { type: Schema.Types.ObjectId, ref: "DiscRequest" },
  messageCount: { type: Number, default: 0 },
  listingSold: { type: Boolean, default: false },
  eligibleForRating: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure one interaction record per user pair + listing
InteractionSchema.index(
  { user1Id: 1, user2Id: 1, listingId: 1 }, 
  { unique: true, sparse: true }
);
```

**Alternative (Simpler):** Don't create a separate model. Instead, check eligibility on-the-fly when user tries to rate:
1. Check if listing is sold
2. Count messages in thread
3. Verify minimum threshold met

---

## 3. API Endpoints

### 3.1 GET `/api/ratings/[userId]` - Get user's ratings

```typescript
// Get all ratings for a user (with pagination)
// Returns: { ratings: [...], averageRating: number, ratingCount: number }
```

### 3.2 POST `/api/ratings` - Create a rating

```typescript
// Body: { ratedUserId, listingId?, requestId?, rating, review?, role }
// Validates:
// - User is authenticated
// - Interaction eligibility (sold + min messages)
// - No duplicate rating for this interaction
// - Updates user's average rating
```

### 3.3 PATCH `/api/ratings/[id]` - Update a rating

```typescript
// Allow users to update their own ratings
// Body: { rating, review }
```

### 3.4 DELETE `/api/ratings/[id]` - Delete a rating

```typescript
// Allow users to delete their own ratings
// Recalculates average rating
```

### 3.5 GET `/api/ratings/eligibility/[userId]` - Check if user can rate

```typescript
// Returns: { eligible: boolean, interactions: [...] }
// Shows which interactions are available for rating
```

### 3.6 GET `/api/users/[userId]/public` - Get public user info (for reviews page)

```typescript
// Returns: { 
//   user: { _id, name, username, avatarUrl, averageRating, ratingCount },
//   ratings: [...], // Paginated ratings
//   canRate: boolean // If current user can rate this user
// }
// Public endpoint - no authentication required
// Used for public user reviews/profile page
```

---

## 4. Implementation Logic

### 4.1 Check Rating Eligibility

When a user wants to rate another user:

```typescript
async function checkRatingEligibility(
  raterUserId: string,
  ratedUserId: string,
  listingId?: string
): Promise<{ eligible: boolean; reason?: string }> {
  // 1. Find message thread between users for this listing
  const thread = await MessageThread.findOne({
    participants: { $all: [raterUserId, ratedUserId] },
    listingId: listingId || null,
  });

  if (!thread) {
    return { eligible: false, reason: "No conversation found" };
  }

  // 2. Check if listing is sold
  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing?.sold) {
      return { eligible: false, reason: "Listing not sold yet" };
    }
  }

  // 3. Count messages (excluding system messages)
  const messageCount = thread.messages.filter(
    (msg) => msg.sender && msg.sender.toString() !== "system"
  ).length;

  const MIN_MESSAGES = 3; // Configurable
  if (messageCount < MIN_MESSAGES) {
    return { 
      eligible: false, 
      reason: `Need at least ${MIN_MESSAGES} messages` 
    };
  }

  // 4. Check if already rated
  const existingRating = await Rating.findOne({
    raterUserId,
    ratedUserId,
    listingId: listingId || null,
  });

  if (existingRating) {
    return { eligible: false, reason: "Already rated this interaction" };
  }

  return { eligible: true };
}
```

### 4.2 Calculate Average Rating

```typescript
async function updateUserRating(userId: string): Promise<void> {
  const ratings = await Rating.find({ ratedUserId: userId });
  
  if (ratings.length === 0) {
    await User.findByIdAndUpdate(userId, {
      averageRating: null,
      ratingCount: 0,
    });
    return;
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const average = sum / ratings.length;
  const rounded = Math.round(average * 10) / 10; // Round to 1 decimal

  await User.findByIdAndUpdate(userId, {
    averageRating: rounded,
    ratingCount: ratings.length,
  });
}
```

---

## 5. UI Components

### 5.1 Rating Display Component

```typescript
// src/components/profile/UserRating.tsx
// Shows: ⭐⭐⭐⭐⭐ (4.5) (23 reviews)
```

### 5.2 Rating Form Component

```typescript
// src/components/ratings/RatingForm.tsx
// Star selector + optional review text
// Only shown when user is eligible to rate
```

### 5.3 Ratings List Component

```typescript
// src/components/profile/RatingsList.tsx
// Shows all ratings with reviews, paginated
```

### 5.4 Rating Eligibility Banner

```typescript
// src/components/ratings/RatingPrompt.tsx
// Shows on profile/messages when user can rate someone
// "You can now rate [User] for your recent transaction"
```

### 5.5 Seller Rating on Listings

```typescript
// src/components/ratings/SellerRatingBadge.tsx
// Compact rating display for listings
// Shows: ⭐ 4.5 (12) - displayed on ListingCard and listing detail pages
// Clickable - links to user's public reviews page
// Used in:
// - src/components/ListingCard.tsx
// - src/app/listing/[id]/page.tsx
// - src/components/marketplace/MarketplaceGrid.tsx
```

### 5.6 Public User Reviews Page

```typescript
// src/app/user/[userId]/page.tsx (or /user/[username]/page.tsx)
// Public page showing:
// - User's name, avatar, average rating
// - All ratings/reviews received (paginated)
// - Link to message user (if logged in)
// - Link to view user's listings (if any)
// No authentication required - publicly accessible
```

### 5.7 Seller Info Component

```typescript
// src/components/listing/SellerInfo.tsx
// Shows seller information on listing detail page
// Includes:
// - Seller name/avatar
// - Seller rating badge (clickable)
// - Link to seller's public reviews page
// - "Message Seller" button
```

---

## 6. Integration Points

### 6.1 When Listing is Marked Sold

Update `src/app/api/listings/[id]/route.ts`:

```typescript
// After marking as sold, check if users can now rate each other
// Optionally send notification/email
```

### 6.2 Profile Page

Update `src/app/profile/page.tsx`:
- Display user's own rating
- Show ratings they've received

### 6.3 User Profile View

Update profile display components:
- Show average rating prominently
- Link to full ratings list

### 6.4 Messages Page

Update `src/app/messages/page.tsx`:
- Show rating prompt when eligible
- "Rate this seller" button in conversation

### 6.5 Listing Display Components

Update listing-related components to show seller ratings:

**ListingCard Component** (`src/components/ListingCard.tsx`):
- Display seller's rating badge below listing title or price
- Format: ⭐ 4.5 (12 reviews) - clickable
- Clicking rating badge navigates to `/user/[userId]` (public reviews page)

**Listing Detail Page** (`src/app/listing/[id]/page.tsx`):
- Add `SellerInfo` component showing:
  - Seller name/avatar
  - Seller rating badge (clickable, links to reviews page)
  - "Message Seller" button
  - Link to view seller's other listings
- Include rating in structured data (Schema.org)

**Marketplace Grid** (`src/components/marketplace/MarketplaceGrid.tsx`):
- Ensure ratings are passed through to ListingCard components
- Fetch seller ratings when loading listings

**API Updates:**
- Update `/api/listings` and `/api/listings/[id]` to include seller rating data
- Populate seller's `averageRating` and `ratingCount` when fetching listings
- Include seller's `userId` or `username` for navigation

### 6.6 Public User Reviews Page

Create new route: `src/app/user/[userId]/page.tsx` (or `/user/[username]/page.tsx`)

**Features:**
- Publicly accessible (no authentication required)
- Shows user's public info: name, username, avatar, bio (if public)
- Displays average rating and rating count prominently
- Lists all ratings/reviews received (paginated)
- Shows "Message User" button (if logged in and not own profile)
- Shows link to user's active listings (if any)
- SEO-friendly with metadata and structured data

**Navigation:**
- Accessible from:
  - Seller rating badges on listings
  - Seller info on listing detail pages
  - Direct URL: `/user/[userId]` or `/user/[username]`
- If user has `username`, prefer username-based URL for better SEO

---

## 7. Configuration

Add to environment or constants:

```typescript
// src/app/constants/ratingConfig.ts
export const RATING_CONFIG = {
  MIN_MESSAGES_FOR_RATING: 3,
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_REVIEW_LENGTH: 500,
};
```

---

## 8. Database Migration

For existing users:
- Set `averageRating: null` and `ratingCount: 0` for all users
- No migration needed for new Rating model (empty collection)

---

## 9. Implementation Steps

### Phase 1: Data Models
1. ✅ Create `Rating` model
2. ✅ Add rating fields to User model (computed)
3. ✅ Update model index

### Phase 2: Core API
4. ✅ Create `/api/ratings` endpoints
5. ✅ Implement eligibility checking
6. ✅ Implement rating calculation

### Phase 3: UI Components
7. ✅ Create rating display components
8. ✅ Create rating form component
9. ✅ Add ratings to profile page
10. ✅ Create public user reviews page
11. ✅ Create seller info component for listings

### Phase 4: Integration
12. ✅ Add rating prompts to messages
13. ✅ Add rating prompts after sale
14. ✅ Update listing/message flows
15. ✅ Add seller ratings to ListingCard
16. ✅ Add seller info to listing detail pages
17. ✅ Create public user reviews page route

### Phase 5: Testing
18. ✅ Unit tests for rating logic
19. ✅ Integration tests for API endpoints
20. ✅ E2E tests for rating flow
21. ✅ Component tests for all UI components
22. ✅ Tests for listing display with ratings
23. ✅ Tests for public user reviews page
24. ✅ Tests for seller info component

---

## 10. Edge Cases & Considerations

### 10.1 Self-Rating Prevention
- Users cannot rate themselves
- Validate in API endpoint

### 10.2 Duplicate Prevention
- Unique index on `raterUserId + ratedUserId + listingId`
- Handle duplicate errors gracefully

### 10.3 Rating Updates
- Allow users to update their rating (change stars/review)
- Recalculate average when updated

### 10.4 Rating Deletion
- Allow users to delete their own ratings
- Recalculate average when deleted

### 10.5 Privacy
- Users can see who rated them (or anonymize?)
- Consider privacy settings

### 10.6 Abuse Prevention
- Rate limiting: max X ratings per day
- Flag suspicious patterns (all 1-star, all 5-star)
- Admin review for reported ratings

---

## 11. Testing Requirements

### 11.1 Unit Tests

**Rating Model Tests** (`tests/unit/rating.test.ts`):
- ✅ Rating schema validation (min/max values)
- ✅ Unique index enforcement (duplicate prevention)
- ✅ Required field validation
- ✅ Optional field handling

**Rating Logic Tests** (`tests/unit/ratingLogic.test.ts`):
- ✅ `checkRatingEligibility()` function
  - Valid interaction (sold + enough messages)
  - Invalid: listing not sold
  - Invalid: insufficient messages
  - Invalid: already rated
  - Invalid: no conversation found
- ✅ `updateUserRating()` function
  - Calculate average correctly
  - Handle zero ratings
  - Round to 1 decimal place
  - Update user document

**Component Tests**:
- ✅ `UserRating.tsx` - Display rating correctly
- ✅ `RatingForm.tsx` - Form validation, submission
- ✅ `SellerRatingBadge.tsx` - Display on listings, click navigation
- ✅ `RatingsList.tsx` - Pagination, display reviews
- ✅ `RatingPrompt.tsx` - Show/hide based on eligibility
- ✅ `SellerInfo.tsx` - Display seller info, rating, navigation
- ✅ Public user reviews page - Display ratings, pagination, navigation

### 11.2 Integration Tests

**API Endpoint Tests** (`tests/integration/api/ratings.test.ts`):
- ✅ `GET /api/ratings/[userId]`
  - Returns ratings with pagination
  - Returns correct average and count
  - Handles non-existent user
  - Handles user with no ratings
  
- ✅ `POST /api/ratings`
  - Creates rating successfully
  - Validates eligibility before creating
  - Prevents duplicate ratings
  - Updates user's average rating
  - Requires authentication
  - Validates rating value (1-5)
  - Validates review length (max 500)
  - Prevents self-rating
  
- ✅ `PATCH /api/ratings/[id]`
  - Updates own rating
  - Prevents updating others' ratings
  - Recalculates average after update
  - Validates new rating value
  
- ✅ `DELETE /api/ratings/[id]`
  - Deletes own rating
  - Prevents deleting others' ratings
  - Recalculates average after deletion
  
- ✅ `GET /api/ratings/eligibility/[userId]`
  - Returns eligible interactions
  - Returns empty when not eligible
  - Handles invalid user
  
- ✅ `GET /api/users/[userId]/public`
  - Returns public user info and ratings
  - Works without authentication
  - Handles non-existent user
  - Returns paginated ratings
  - Includes canRate flag for authenticated users

**Listing API Integration** (`tests/integration/api/listings-rating.test.ts`):
- ✅ Listings include seller rating data
- ✅ Rating displayed correctly in listing responses
- ✅ Rating included in listing detail page

### 11.3 E2E Tests

**Rating Flow Tests** (`tests/e2e/ratings.spec.ts`):
- ✅ Complete rating flow:
  1. User creates listing
  2. Another user messages about listing
  3. Users exchange messages (≥3)
  4. Seller marks listing as sold
  5. Buyer sees rating prompt
  6. Buyer submits rating
  7. Rating appears on seller's profile
  8. Rating appears on seller's listings
  
- ✅ Rating on listing display:
  1. Seller has rating
  2. Create listing
  3. Verify rating appears on ListingCard
  4. Verify rating appears on listing detail page
  5. Click rating badge - navigates to public reviews page
  6. Verify public reviews page displays correctly
  
- ✅ Rating eligibility:
  1. Attempt to rate before meeting criteria (should fail)
  2. Meet criteria (sold + messages)
  3. Successfully rate
  
- ✅ Rating updates:
  1. Submit initial rating
  2. Update rating
  3. Verify average updates correctly
  
- ✅ Rating deletion:
  1. Submit rating
  2. Delete rating
  3. Verify average updates correctly

**Component E2E Tests**:
- ✅ Rating form interaction (star selection, review input)
- ✅ Rating display on profile page
- ✅ Rating display on listings
- ✅ Rating list pagination
- ✅ Public user reviews page navigation
- ✅ Seller info component interaction
- ✅ Clicking rating badge navigates to reviews page

### 11.4 Test Coverage Goals

- **Unit Tests:** ≥90% coverage for rating logic and models
- **Integration Tests:** 100% coverage for all API endpoints
- **Component Tests:** All new components have tests
- **E2E Tests:** Critical user flows covered

### 11.5 Test Files Structure

```
tests/
├── unit/
│   ├── rating.test.ts
│   └── ratingLogic.test.ts
├── integration/
│   └── api/
│       ├── ratings.test.ts
│       └── listings-rating.test.ts
├── component/
│   └── ratings/
│       ├── UserRating.test.tsx
│       ├── RatingForm.test.tsx
│       ├── SellerRatingBadge.test.tsx
│       ├── RatingsList.test.tsx
│       ├── RatingPrompt.test.tsx
│       └── SellerInfo.test.tsx
└── e2e/
    └── ratings.spec.ts
```

### 11.6 Test Data Setup

Create test fixtures for:
- Users with various rating scenarios (no ratings, some ratings, many ratings)
- Listings in different states (active, sold)
- Message threads with varying message counts
- Existing ratings for edge case testing

---

## 12. Future Enhancements

- **Rating Categories:** Rate specific aspects (communication, item quality, shipping speed)
- **Verified Purchases:** Only allow ratings from verified transactions
- **Response to Reviews:** Allow sellers to respond to ratings
- **Rating Filters:** Filter by rating value, date, verified purchases
- **Rating Analytics:** Show rating trends over time
- **Badges/Achievements:** "5-Star Seller" badge for high ratings

---

## 13. Example User Flow

1. User A lists a disc for sale
2. User B messages User A about the disc
3. They exchange 5+ messages
4. User A marks listing as sold
5. System detects eligibility:
   - ✅ Listing is sold
   - ✅ 5 messages exchanged (≥ 3 minimum)
   - ✅ No existing rating
6. User B sees prompt: "Rate your experience with User A"
7. User B submits 5-star rating with review
8. User A's profile now shows: ⭐⭐⭐⭐⭐ (5.0) (1 review)
9. **User A's rating now appears on all their listings** (ListingCard and detail pages)
10. **Clicking the rating badge on a listing navigates to `/user/[userId]`** - public reviews page
11. **Public reviews page shows:** User A's name, avatar, average rating, and all reviews
12. User A can also rate User B (buyer rating)

---

## 14. Questions to Consider

1. **Minimum interaction threshold:** How many messages? (Recommend: 3)
2. **Rating visibility:** Can users see who rated them? (Recommend: Show rater's name/username)
3. **Buyer vs Seller ratings:** Separate averages or combined? (Recommend: Combined for simplicity)
4. **Time limit:** Can users rate after X days/weeks? (Recommend: No time limit, but can add later)
5. **Notification:** Email/push notification when eligible to rate? (Recommend: Add later)
6. **Moderation:** Auto-flag suspicious ratings? (Recommend: Add admin review capability)
7. **Public profile URL:** Use userId or username? (Recommend: Username if available, fallback to userId)
8. **Privacy:** What user info should be public on reviews page? (Recommend: Name, username, avatar, bio, ratings - no private info)

---

## 15. Recommended Next Steps

1. **Start Simple:** Implement basic rating (1-5 stars) without reviews
2. **Add Reviews Later:** Once core rating works, add optional review text
3. **Iterate on Eligibility:** Start with "sold + 3 messages", adjust based on usage
4. **Monitor & Adjust:** Track rating distribution, adjust thresholds as needed

