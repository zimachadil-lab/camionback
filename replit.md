# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application designed for the Moroccan market. It connects clients requiring transportation services with independent transporters, supporting Client, Transporter, Administrator, and Coordinator roles. The platform aims to streamline logistics operations through features like request creation, service offers, platform management, and operational oversight, with the vision of becoming a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with a French language interface. It utilizes React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. UI components are built with Shadcn/ui for aesthetics and Radix UI for accessibility, while React Hook Form with Zod manages form states. Key UI elements include responsive role-based navigation, an animated truck header on the login page, Instagram-style stories, a modern role selection page, and an interactive calendar for transporters. PWA enhancements provide offline support, advanced caching, and native-like push notifications.

### Technical Implementations
The backend is an Express.js and TypeScript application providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) define access control. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM.

**Key Features:**
- **Request and Offer Workflow:** Multi-status client request progression, transporter offer submission, and acceptance. The workflow has been redesigned to centralize pricing and matching decisions with coordinators, simplifying the transporter's role to expressing interest.
- **User Management:** Transporter rating, contract management, account blocking/deletion, and automated client ID generation with robust race-condition handling.
- **Messaging & Notifications:** Comprehensive multi-channel notification system with in-app, SMS (Infobip), email (Nodemailer), and PWA push notifications for all coordinator-centric workflow events including qualification, publication for matching, transporter interest, archival, and client-transporter contacts. All 12 canonical archive reasons from shared/schema.ts have dedicated French labels for consistent messaging.
- **Admin & Coordinator Tools:** Dynamic dashboards, comprehensive request management (hide/delete/expire, advanced coordination status tracking), reporting, dispute resolution, full CRUD for cities, and automated coordinator assignment. **Coordinator Dashboard Restructure (Nov 2025):** Streamlined from 7+ tabs to 4 intuitive views (Nouveau → Qualifiés → En Production → Archives) with unified search bar featuring text, city, status, date, and **coordinator filters**. Implemented client-side filtering with deduplication to prevent duplicate key warnings. Code optimized by ~23% (2750→2100 lines) while maintaining all functionality. **Recent Enhancements (Nov 2025):** Added coordinator attribution display on qualified requests showing "Qualifié par [name]", re-qualification capability via "Requalifier" button for updating pricing on qualified requests without archiving, and coordinator filter in unified search bar for filtering requests by qualifying coordinator. Fixed critical cache invalidation bug where qualified requests weren't appearing in "Qualifiés" view after publication.
- **Public Order Sharing:** Coordinators can share transport requests via unique, secure public links with sanitized order details, WhatsApp integration, and direct offer submission for authenticated users.
- **CamioMatch:** An intelligent, Tinder-style transporter matching system for clients.
- **File Management:** Base64 encoding for client photos, Multer for transporter truck photos, and multimedia messaging support.
- **Security:** Comprehensive backend security with 72 protected and sanitized endpoints, session-based authentication using PostgreSQL, HttpOnly/Secure/SameSite cookies, role-based access control, masked phone numbers, and unique tokens for public sharing links exposing only sanitized data. Transporter endpoints use explicit SQL projection to prevent coordinator pricing data leakage (transporterAmount, platformFee, clientTotal, budget fields excluded at query level). E2E security testing validates proper field redaction.
- **PWA Installation:** Dedicated `/app` route for direct PWA installation with platform detection and a contextual installation toast.

### System Design Choices
**Data Storage:** PostgreSQL with Neon serverless and Drizzle ORM.
**Authentication & Authorization:** Phone number-based PIN verification, role, and status-based access control.
**Backend:** Express.js with TypeScript, ES Modules.
**Routing:** Dedicated dashboard routes for Admin, Client, Transporter, and Coordinator.

## External Dependencies

### UI/Styling
- **Radix UI**: Accessible component primitives.
- **Shadcn/ui**: Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Embla Carousel**: Carousel/slider.

### Backend Services
- **Infobip API**: SMS notifications.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Nodemailer**: Automated email notifications.
- **Web Push**: Browser push notifications.

### Data Management
- **Drizzle ORM**: Type-safe SQL query builder.
- **Drizzle Zod**: Schema-to-validation generation.
- **TanStack React Query**: Server state management.

### Utilities
- **Wouter**: Lightweight client-side routing.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.