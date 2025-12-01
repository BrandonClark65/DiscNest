# 🥏 DiscNest

**DiscNest** is a private web platform for disc golf enthusiasts to **buy, sell, and manage discs**.  
It provides an easy way for users to post listings, message sellers, and manage their personal bag of discs — all within a clean, modern interface.

This project is built with **Next.js 14 (App Router)**, **TypeScript**, **MongoDB**, and **NextAuth** for authentication.  
It also includes image moderation and compression tools for safe, optimized uploads.

---

## 🧭 Overview

DiscNest consists of several core modules:

- **Listings** — CRUD interface for creating and browsing discs  
- **Messages** — Chat system for buyer-seller communication  
- **My Bag** — Personal disc collection management  
- **Map Integration** — Displays listings on a map based on geolocation  
- **Admin Tools** — Internal utilities for seeding data and managing content  
- **Authentication** — Handled through NextAuth, with optional auto-login in development  

---

## 🧩 Project Structure
```
disc-nest/
├── src/
│ ├── app/
│ │ ├── api/ # Next.js API routes
│ │ │ ├── listings/ # Listing CRUD endpoints
│ │ │ ├── users/ # User-related routes
│ │ │ ├── messages/ # Messaging endpoints
│ │ │ └── ...
│ │ ├── listings/ # Listing pages (list view, detail, etc.)
│ │ ├── messages/ # User chat interface
│ │ ├── admin/ # Admin-only tools (seed, moderation)
│ │ ├── layout.tsx # Global layout wrapper
│ │ └── page.tsx # Home page
│ │
│ ├── components/ # Reusable UI and functional components
│ │ ├── forms/ # Form components (CreateListingForm, etc.)
│ │ ├── modals/ # Modal components (ChatModal, etc.)
│ │ └── ui/ # Shared UI elements (buttons, cards, etc.)
│ │
│ ├── lib/ # Utilities (MongoDB, auth, geocoding, etc.)
│ ├── models/ # Mongoose models (Listing, User, Thread, etc.)
│ ├── types/ # TypeScript definitions
│ └── styles/ # Tailwind setup and global styles
│
├── public/ # Static assets (images, icons)
├── docs/ # Project documentation
│   └── testing/ # Testing documentation
├── .env.local # Local environment variables
├── next.config.js # Next.js config
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Tools |
|-------|--------|
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS |
| **Backend** | Node.js, Next.js API Routes, Mongoose |
| **Database** | MongoDB Atlas |
| **Auth** | NextAuth.js |
| **Image Handling** | `browser-image-compression`, custom NSFW filter |
| **Email** | Resend API |
| **Maps / Geolocation** | OpenCage API for reverse geocoding |

---

## 🧠 Environment Variables

All secrets are managed locally in `.env.local` and **should not be committed**.  

- **MONGODB_URI** = <your_mongodb_connection_string>
- **NEXTAUTH_SECRET** = <your_nextauth_secret>
- **NEXTAUTH_URL**= http://localhost:3000
- **CLOUDINARY_CLOUD_NAME** = <your_cloudinary_cloud_Name>
- **CLOUDINARY_API_KEY** = <your_cloudinary_api_key>
- **CLOUDINARY_API_SECRET** = <your-cloudinary_api_secret>
- **ADMIN_ALERT_EMAIL** = <your_email_for_moderation_and_contact>
- **GOOGLE_CLIENT_ID** = <optional>
- **GOOGLE_CLIENT_SECRET** = <optional>
- **RESEND_API_KEY** = <resend_api_key>
- **OPENCAGE_API_KEY** = <for_reverse_geocoding>

---

## 🧑‍💻 Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-org>/disc-nest.git
cd disc-nest
```
### 2. Install dependencies
```bash
npm install
```

### 3. Add .env.local
Create a .env.local file in the root directory and fill in the required keys above.

### 4. Run MongoDB
If using MongoDB Atlas, make sure your connection string is valid.
For local development, ensure mongod is running.

### 5. Start the development server
```bash
npm run dev
```

Once running, open:
👉 http://localhost:3000

## Common Commands
| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start dev server on localhost:3000       |
| `npm run build` | Build production bundle                  |
| `npm run start` | Serve built app                          |
| `npm run lint`  | Run ESLint checks                        |
| `npm run seed`  | Run data seeding script (if implemented) |

## 📚 Documentation

Additional documentation is available in the [`docs/`](./docs/) directory:

- **[Testing Documentation](./docs/testing/)** - Coverage, testing recommendations, and performance reports
  - [Coverage Guide](./docs/testing/COVERAGE.md) - Test coverage setup and tracking
  - [Testing Recommendations](./docs/testing/TESTING_RECOMMENDATIONS.md) - Testing roadmap
  - [Performance Report](./docs/testing/PERFORMANCE_REPORT.md) - API performance benchmarks

## Internal Admin Utilities
- Seeding Discs: Admin can seed a base set of discs for development or testing.
- Moderation: Basic filters and admin checks for images and listings.
- Access: /admin route is protected by a simple internal login gate (not public-facing).

## Deployment Notes
- Target: Vercel
- Database: MongoDB Atlas
- Email: Resend API
- Environment variables must be configured in Vercel before deployment.
- Disable development auto-login in production (via cookie or env flag).

# Private Use
This project is for internal DiscNest development only.
Do not distribute, fork publicly, or reuse without team approval.
All source code and assets are proprietary to the DiscNest development team

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
