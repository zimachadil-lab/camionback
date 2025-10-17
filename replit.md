# CamionBack - Logistics Marketplace Platform

## Overview

CamionBack is a full-stack logistics marketplace web application designed for the Moroccan market. It connects clients who need transportation services (furniture, freight, deliveries) with independent transporters. The platform features a mobile-first design with a dark teal theme, French language interface, and phone-based authentication using OTP verification.

The application supports three distinct user roles:
- **Clients**: Create transport requests and review offers from transporters
- **Transporters**: Browse available requests and submit price offers
- **Administrators**: Manage users, validate transactions, and access platform analytics

## Recent Changes (October 2025)

### Completed Features
✅ **Full Authentication Flow**: Phone-only OTP authentication with automatic user creation and role assignment
  - Dev mode accepts any 6-digit OTP code (e.g., "123456", "999999")
  - Automatic role detection based on phone number patterns
  - Test users: 0612345678 (client), 0698765432 (transporter), 0612000000 (admin)

✅ **Complete Frontend-Backend Integration**: All dashboards connected to real API endpoints
  - Client dashboard: Create requests, view/accept offers with commission display
  - Transporter dashboard: Browse available requests, submit offers, track status
  - Admin dashboard: User management, order tracking, commission configuration

✅ **Order Reference System**: Auto-generated CMD-2025-XXXXX format for all transport requests

✅ **Commission Calculation**: Automatic 10% commission calculation on offer acceptance
  - Configurable by admin
  - Displayed clearly to clients before acceptance
  - Example: 2500 MAD offer → 250 MAD commission → 2750 MAD total

✅ **Data Persistence**: In-memory storage with full CRUD operations for:
  - Users (with role-based access)
  - Transport requests (with status tracking)
  - Offers (pending/accepted/rejected)
  - OTP codes (with expiry)
  - Admin settings

✅ **End-to-End Testing**: Complete user journey validated via Playwright
  - Client creates request → Transporter submits offer → Client accepts → Commission calculated

### Technical Fixes Applied
- Fixed dateTime validation: Schema now uses `z.coerce.date()` to accept ISO strings
- Fixed optional fields: Frontend only sends non-empty values to prevent validation errors
- Fixed OTP verification: Dev mode accepts any 6-digit code for easier testing
- Fixed role assignment: Automatic role detection based on phone number patterns
- Fixed WebSocket path: Uses `/ws-chat` to avoid Vite HMR conflicts
- Fixed TypeScript errors: Explicit type annotations for array variables

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and API caching
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom dark teal theme

**Design System:**
- Mobile-first responsive design approach
- Consistent dark theme with teal color palette (`#0a2540` primary, `#163049` secondary)
- French language throughout the interface
- Custom CSS variables for theming and hover effects (`hover-elevate`, `active-elevate-2`)
- Component composition using Radix UI for accessibility

**State Management:**
- Client-side: React hooks and context for local UI state
- Server state: React Query with custom query functions (`getQueryFn`) for API data
- Authentication state: localStorage-based session management
- Form handling: React Hook Form with Zod validation

### Backend Architecture

**Framework & Runtime:**
- Express.js server with TypeScript
- ES Modules (type: "module" in package.json)
- Development mode with `tsx` for hot reloading
- Production build using esbuild with external packages bundling

**API Design:**
- RESTful API endpoints under `/api` prefix
- JSON request/response format with proper error handling
- Session-based authentication approach
- Middleware for request logging with duration tracking
- Multipart form data support via Multer for file uploads (5MB limit)

**Architecture Patterns:**
- Storage abstraction layer (`IStorage` interface) for database operations
- In-memory storage implementation (`MemStorage`) for development
- Separation of concerns: routes, storage, and business logic

**Rationale:** The Express + TypeScript combination provides flexibility for rapid development while maintaining type safety. The storage abstraction allows easy swapping between in-memory and database implementations without changing business logic.

### Data Storage Solutions

**Database:**
- PostgreSQL as the primary database (configured for Neon serverless)
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with migrations in `/migrations` directory

**Schema Design:**
Key tables include:
- `users`: Multi-role support (client/transporter/admin), phone-based authentication
- `otp_codes`: Time-limited verification codes with expiry tracking
- `transport_requests`: Client requests with reference IDs (CMD-2025-XXXXX format)
- `offers`: Transporter bids linked to requests
- `chat_messages`: Real-time messaging with content filtering
- `admin_settings`: Platform configuration and commission rates

**Alternative Considered:** In-memory storage is currently implemented for development, but the abstraction layer allows seamless migration to PostgreSQL in production.

**Pros:** 
- Type-safe queries with Drizzle ORM
- Easy schema versioning and migrations
- Scalable serverless PostgreSQL with Neon

### Authentication & Authorization

**Authentication Method:**
- Phone number-based OTP verification (no email required)
- 6-digit codes valid for 10 minutes
- Moroccan phone format support (+212, 06, 07)

**Session Management:**
- localStorage-based user session persistence
- Role-based access control (client/transporter/admin)
- Manual admin account creation for administrative access

**Future Integration:** Twilio API configured for SMS OTP delivery in production (currently console logging in development)

**Rationale:** Phone-based authentication is preferred in the Moroccan market where mobile phones are ubiquitous. This eliminates email verification friction and speeds up onboarding.

### Real-time Features

**WebSocket Integration:**
- WebSocketServer configured on HTTP server
- Real-time chat between clients and transporters per request
- Message filtering to prevent phone number and link sharing (regex patterns for +212, 06, 07)

**Notification System:**
- WhatsApp notifications via Twilio API (planned)
- Event-driven alerts for new requests and offer updates

### File Upload & Storage

**Implementation:**
- Multer middleware for multipart form uploads
- In-memory storage with 5MB file size limit
- Support for truck photos (transporters) and request photos (clients)
- Array-based photo storage in database schema

**Future Enhancement:** Cloud storage integration (S3/Cloudinary) for production scalability

## External Dependencies

### UI Component Libraries
- **Radix UI**: Headless, accessible component primitives (dialogs, dropdowns, popovers, etc.)
- **Shadcn/ui**: Pre-built components styled with Tailwind CSS
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation for forms and API data
- **date-fns**: Date formatting and manipulation with French locale support

### Backend Services & APIs
- **Twilio API** (configured): SMS OTP delivery and WhatsApp notifications for the Moroccan market
- **Neon Database**: Serverless PostgreSQL hosting with `@neondatabase/serverless` driver

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast production bundling for server code
- **Drizzle Kit**: Database migration management
- **Vite Plugins**: Runtime error overlay, cartographer (Replit integration), dev banner

### Database & ORM
- **Drizzle ORM**: Type-safe SQL query builder with PostgreSQL dialect
- **Drizzle Zod**: Schema-to-validation generation
- **pg-simple**: PostgreSQL session store for Express sessions

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework
- **Class Variance Authority**: Variant-based component styling
- **Autoprefixer**: CSS vendor prefixing

### State Management & Data Fetching
- **TanStack React Query**: Server state management, caching, and synchronization
- **Wouter**: Lightweight client-side routing (~1.2kb)

### Additional Features
- **CMDK**: Command palette interface component
- **Embla Carousel**: Carousel/slider functionality for photo galleries
- **Recharts**: Chart library for admin analytics dashboard