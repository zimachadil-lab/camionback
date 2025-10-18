# CamionBack - Logistics Marketplace Platform

## Overview

CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients needing transportation services (furniture, freight, deliveries) with independent transporters. The platform features a mobile-first design, dark teal theme, French language interface, and phone-based PIN authentication with bcrypt hashing. It supports three user roles: Clients, Transporters, and Administrators, enabling clients to create requests, transporters to offer services, and administrators to manage and validate the platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:** React 18, TypeScript, Vite, Wouter (routing), TanStack Query (server state), Shadcn/ui (components), Tailwind CSS (styling).

**Design System:** Mobile-first, dark theme with a dark teal palette, French language interface, custom CSS for theming, Radix UI for accessibility.

**State Management:** React hooks/context (local UI), React Query (API data), localStorage (authentication), React Hook Form with Zod (forms).

### Backend Architecture

**Framework & Runtime:** Express.js with TypeScript, ES Modules, `tsx` for hot reloading, esbuild for production.

**API Design:** RESTful endpoints (`/api`), JSON format, session-based authentication, logging middleware, Multer for multipart form data (5MB limit).

**Architecture Patterns:** Storage abstraction layer (`IStorage`), in-memory storage (`MemStorage`) for development, separation of concerns (routes, storage, business logic).

### Data Storage Solutions

**Database:** PostgreSQL (configured for Neon serverless) with Drizzle ORM for type-safe queries and migrations.

**Schema Design:** Key tables for users (multi-role with passwordHash, city, status fields), transport requests (CMD-2025-XXXXX format), offers, notifications, chat messages (with filtering), and admin settings.

### Authentication & Authorization

**Authentication Method:** Phone number-based PIN verification (6-digit codes with bcrypt hashing) supporting Moroccan phone formats (+212 + 9 digits, displayed with spaces: 6 12 34 56 78).

**Registration Flow:** 
1. Enter phone number → check if exists
2. New users: create 6-digit PIN (bcrypt hashed) → select role (Client/Transporter)
3. Transporters: complete profile (name, city, truck photo) → status set to "pending"
4. Admin validation required for transporters before accessing features
5. Existing users: enter PIN to login

**Session Management:** localStorage-based user session persistence with automatic status refresh, role-based access control (client/transporter/admin), status-based feature access for transporters (pending/validated). Logout functionality uses `window.location.href` for complete session clearing and state reset.

**User Data Refresh System:**
- Dashboards automatically call GET `/api/auth/me/:userId` on mount to fetch latest user data from database
- Updates localStorage and React state with fresh data (critical for status changes)
- Ensures transporters see validation status updates immediately after admin approval

**Admin Validation Workflow:** 
- New transporters have "pending" status after profile completion
- Admin validates transporters via dedicated validation tab in dashboard (`/admin` route)
- Validation changes status to "validated", enabling full platform access
- Status updates are immediately visible to transporters upon next dashboard load (via auto-refresh)
- Rejection removes transporter from pending queue

### Real-time Features

**WebSocket Integration:** WebSocketServer at `/ws-chat` for real-time chat between clients and transporters per request. Includes message filtering for sensitive information (phone numbers, URLs) and proper lifecycle management.

**Notification System:** In-app notifications with badge counter, dedicated notifications page, automatic notification creation on offer events.

### Request Status Management

**Client Request Workflow:**
1. **Open Status:** Client creates request → appears in transporters' "Disponibles" tab
2. **Accepted Status:** Client accepts offer → request status = "accepted", acceptedOfferId set
   - Badge "Acceptée" displayed in client dashboard
   - Button "Infos transporteur" shows transporter details popup (name, city, phone, price, commission)
   - Menu "Mettre à jour" with options: "Terminée" and "Republier"
3. **Completed Status:** Client marks request as completed → status = "completed"
   - Request moves to "Terminées" tab
   - Transporter info and republish buttons remain available
4. **Republish:** Client republishes completed/accepted request → status reset to "open"
   - All previous offers deleted (via `deleteOffersByRequest`)
   - acceptedOfferId reset to null
   - Request becomes visible to all transporters again in "Disponibles"
   - All transporters (including those who previously submitted offers) can submit new offers

**Backend Endpoints:**
- GET `/api/requests/:id/accepted-transporter` - Retrieves accepted transporter info with commission calculation
- POST `/api/requests/:id/complete` - Marks accepted request as completed with transporter rating (1-5 stars)
- POST `/api/requests/:id/republish` - Republishes accepted/completed request, deletes all offers, resets to open status

**Key Implementation Details:**
- `deleteOffersByRequest(requestId)` method in storage layer ensures clean slate for republished requests
- Transporter visibility in "Disponibles" filtered by existing offers (via `hasOfferForRequest`)
- Republishing removes this filter by deleting all offers, allowing fresh bidding

### Transporter Rating System

**Rating Workflow:**
1. Client marks request as "Terminée" → Rating dialog appears
2. Client rates transporter (1-5 stars, mandatory)
3. Backend calculates new average: `((currentRating * totalRatings) + newRating) / (totalRatings + 1)`
4. Transporter stats updated: `rating`, `totalRatings`, `totalTrips`
5. Request status changes to "completed"

**Rating Display:**
- Offer cards show: 5 yellow stars (filled according to rating) + average score (e.g., "4.3") + trip count (e.g., "12 courses réalisées")
- Rating scale: decimal (3,2) precision
- Stats tracked: `totalRatings` (number of reviews), `totalTrips` (completed orders), `rating` (weighted average)

**Database Schema:**
- `users.rating`: decimal (average rating for transporters)
- `users.totalRatings`: integer (number of ratings received)
- `users.totalTrips`: integer (number of completed trips)

### Mobile Responsive Design

**Mobile-First Adaptations:**
- Popups/Dialogs: `max-w-[90vw] sm:max-w-md` for responsive sizing on small screens
- Button layouts: `flex-col sm:flex-row` to stack vertically on mobile
- Button text: adaptive labels (e.g., "Infos transporteur" → "Infos" on very small screens)
- Button widths: `w-full sm:w-auto` for full-width buttons on mobile
- No horizontal scrolling required for any UI elements

### File Upload & Storage

**Implementation:** Base64 encoding for request photos, Multer middleware for truck photos. 

**Request Photos (Client → Transporter):**
- Client uploads photos via file input during request creation
- Photos converted to base64 using FileReader API
- Stored as text array in transportRequests.photos field
- Transporter views photos via PhotoGalleryDialog modal with carousel navigation
- "Voir les photos (N)" button shows photo count
- Gallery includes previous/next navigation and photo counter (e.g., "1 / 2")

**Truck Photos (Transporter Profile):** Multer middleware for multipart form uploads, in-memory storage with a 5MB limit.

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless, accessible component primitives.
- **Shadcn/ui**: Pre-built, Tailwind-styled components.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management with validation.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.

### Backend Services & APIs
- **Twilio API**: Configured for SMS OTP delivery.
- **Neon Database**: Serverless PostgreSQL hosting.

### Database & ORM
- **Drizzle ORM**: Type-safe SQL query builder for PostgreSQL.
- **Drizzle Zod**: Schema-to-validation generation.

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework.

### State Management & Data Fetching
- **TanStack React Query**: Server state management and caching.
- **Wouter**: Lightweight client-side routing.

### Additional Features
- **Embla Carousel**: Carousel/slider for photo galleries.