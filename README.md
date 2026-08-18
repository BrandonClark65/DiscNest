# DiscNest

DiscNest is a disc golf toolkit built with Next.js. It helps players manage the discs they own, look up any disc in a searchable catalog, and calculate a rating and handicap from the rounds they play.

This repository is public as a portfolio project. It shows how I approach a full production web application: data modeling, authentication, a REST-style API, a component-driven front end, image handling, and a real test suite.

**Live site:** https://www.discnest.com

## What it does

**Bag Builder.** Track every disc you own and organize it between a shelf and an active bag. The bag view shows how your collection breaks down by speed and stability so you can see the gaps, and you can share a read-only view of your bag with a link.

**Disc Catalog.** A searchable database of discs from the major brands, each with its flight numbers (speed, glide, turn, fade). Filter and compare molds before you throw or buy.

**Handicap Calculator.** Enter PDGA round ratings, UDisc ratings, or plain scores and get a rating and a handicap in throws. It works without an account, and signing in saves your rounds and charts your progress over time. The rating math combines the PDGA round-rating formula with the World Handicap System's "best 8 of 20" selection, which holds up better against self-reported scores than a simple average.

A buy-and-sell marketplace also exists in the codebase (listings, storefronts, messaging, and seller reviews). It is switched off by default and can be re-enabled with a single environment variable. See [Feature flags](#feature-flags) below.

## Tech stack

| Layer | Tools |
|-------|-------|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS |
| Data | MongoDB with Mongoose |
| Auth | NextAuth.js |
| Images | browser-image-compression, plus a lightweight NSFW image check |
| Email | Resend |
| Maps | Leaflet with OpenCage for reverse geocoding |
| Testing | Vitest, Testing Library, Playwright |
| Hosting | Vercel and MongoDB Atlas |

## Project structure

```
src/
  app/
    api/         REST-style route handlers
    catalog/     Disc catalog pages
    gear/        Bag builder
    handicap/    Handicap calculator and shared-rating pages
    marketplace/ Buy/sell listings (currently disabled)
    admin/       Internal moderation and seeding tools
  components/     UI and feature components
  lib/           Database, auth, and domain logic (handicap engine, etc.)
  models/        Mongoose schemas
  types/         Shared TypeScript types
tests/
  unit/          Domain logic (the handicap math, validation, and more)
  component/     React component tests
  integration/   API route tests
  e2e/           Playwright end-to-end tests
```

## A few things worth a look

If you are reading this to get a sense of the code, these are the parts I would point to first:

- `src/lib/handicap/` holds the rating engine. It is pure and framework-free, so the exact same math runs in the browser for a logged-out visitor and on the server for saved rounds. The reasoning behind each rule is written out in the comments, and `tests/unit/handicap.test.ts` pins the tricky sign conventions in place.
- `src/lib/features.ts` is the single switch that deactivates the marketplace across navigation, routing, sitemap, and metadata without deleting any of it.
- `tests/` covers the domain logic, components, API routes, and a set of end-to-end flows.

## Getting started

You will need Node.js and a MongoDB connection string (a free MongoDB Atlas cluster works).

```bash
git clone https://github.com/BrandonClark65/DiscNest.git
cd DiscNest
npm install
```

Create a `.env.local` file in the project root with at least the required variables below, then start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:3000.

### Environment variables

Required:

- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: secret used to sign session tokens (32+ characters)
- `NEXTAUTH_URL`: base URL of the app (for example `http://localhost:3000`)

Optional, enabling specific features:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: image uploads
- `RESEND_API_KEY`, `RESEND_FROM_PROD`, `RESEND_FROM_DEV`: transactional email
- `OPENCAGE_API_KEY`: reverse geocoding for location features
- `ADMIN_EMAIL`: where admin and contact notifications are sent
- `NEXT_PUBLIC_BASE_URL`: canonical URL used for metadata, sitemap, and links
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 (analytics is off if unset)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google sign-in
- `NEXT_PUBLIC_MARKETPLACE_ENABLED`: set to `true` to turn the marketplace back on

## Feature flags

The buy-and-sell marketplace is deactivated by default. The code stays in the tree rather than being removed, so it can be brought back without a rewrite.

Setting `NEXT_PUBLIC_MARKETPLACE_ENABLED=true` restores the marketplace links in the navigation and footer, re-enables the listing, storefront, request, and messaging routes, and adds the marketplace back to the sitemap. With the flag unset or set to anything else, those routes redirect to the home page.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server at localhost:3000 |
| `npm run build` | Build the production bundle |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the unit and component test suite |
| `npm run test:e2e` | Run the Playwright end-to-end tests |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run seed` | Seed a base set of discs for local development |

## Testing

The project uses Vitest and Testing Library for unit and component tests, and Playwright for end-to-end tests. More detail lives in [`docs/testing/`](./docs/testing/), including coverage setup and a performance report.

```bash
npm run test
npm run test:e2e
```

## License and use

This is a personal portfolio project. The source is public so it can be read and reviewed. It is not licensed for reuse or redistribution, and the DiscNest name and assets are not open for reuse. If something here is useful to you or you would like to talk about it, feel free to get in touch.
