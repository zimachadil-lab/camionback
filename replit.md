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

**Session Management:** localStorage-based user session persistence, role-based access control (client/transporter/admin), status-based feature access for transporters (pending/validated).

**Admin Validation Workflow:** 
- New transporters have "pending" status after profile completion
- Admin validates transporters via dedicated validation tab in dashboard
- Validation changes status to "validated", enabling full platform access
- Rejection removes transporter from pending queue

### Real-time Features

**WebSocket Integration:** WebSocketServer at `/ws-chat` for real-time chat between clients and transporters per request. Includes message filtering for sensitive information (phone numbers, URLs) and proper lifecycle management.

**Notification System:** In-app notifications with badge counter, dedicated notifications page, automatic notification creation on offer events.

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