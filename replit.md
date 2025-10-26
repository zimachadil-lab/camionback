# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients needing transportation services with independent transporters, supporting Client, Transporter, Administrator, and Coordinator roles. The platform streamlines logistics through request creation, service offers, platform management, and operational oversight, aiming to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with a French language interface. It uses React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles form management. Key UI elements include responsive admin navigation, role-based header navigation, animated truck header on the login page, Instagram-style stories, and a modern role selection page.

### Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) are managed, with role and status-based access control. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM.

**Key Features:**
- **Request and Offer Workflow:** Multi-status client request progression, transporter offer submission, and client/admin acceptance.
- **User Management:** Transporter rating, contract management, account blocking/deletion, and automated client ID generation.
- **Messaging & Notifications:** Centralized admin messaging, voice messaging, SMS notifications (Infobip), email notifications (Nodemailer), and PWA with native push notifications (Web Push API). *Note: WhatsApp Business integration temporarily disabled (October 2025) - see Performance Optimizations section.*
- **Admin & Coordinator Tools:** Dynamic admin dashboard statistics, request management (hide/delete/expire), reporting and dispute system, comprehensive filtering/search, and full CRUD for cities.
- **Coordinator Role:** Elevated operational oversight with dedicated dashboards, notification and messaging systems, and offer management capabilities (including client assistance for offer acceptance).
- **File Management:** Base64 for client photos, Multer for transporter truck photos, and multimedia messaging.
- **CamioMatch:** Intelligent, Tinder-style transporter matching for clients based on various criteria.
- **Interactive Calendar for Transporters:** Monthly calendar view in the "À Traiter" section displaying scheduled orders with green indicator dots, date-based filtering, navigation between months/years, and monthly summary (order count, estimated revenue, next delivery). Supports selection of any date (including empty dates) with visual feedback and clear filter functionality.
- **PWA Enhancements:** Offline support, advanced caching, and native-like push notifications for key events.
- **Contextual PWA Installation Toast:** Modern, non-intrusive installation prompt replacing fixed button. Toast appears after 10 seconds of user inactivity (scroll, click, touch events reset timer), displays in top-right on desktop and bottom-right on mobile with elegant slide+fade animation. Features two actions: "Installer" (triggers native beforeinstallprompt) and "Plus tard" (dismisses and stores preference in localStorage). Auto-dismisses after 15 seconds if no interaction. Shown only once per session and respects user's previous dismissal choice. Smooth animations (0.4s transition) and responsive design ensure premium UX without interfering with dashboard CTAs. Component: PWAInstallToast with inactivity detection, localStorage persistence, and automatic hide logic.
- **Optimized Favicon System:** Multiple sizes and optimized linking.
- **Secure Static File Serving:** Custom middleware with whitelist validation and differential caching.

### System Design Choices
**Data Storage:** PostgreSQL with Neon serverless and Drizzle ORM.
**Authentication & Authorization:** Phone number-based PIN verification, role, and status-based access control.
**Backend:** Express.js with TypeScript, ES Modules.
**Routing:** Dedicated dashboard routes for Admin, Client, Transporter, and Coordinator.

### Performance Optimizations (October 2025)
**Recent performance improvements targeting N+1 queries, data transfer, and database indexing:**

1. **WhatsApp Service Removal** - Disabled WhatsApp Business integration (whatsapp-web.js) that was blocking server startup due to session initialization issues. Files renamed to .disabled for future reactivation when needed.

2. **N+1 Query Elimination** - Optimized coordinator endpoints using JOIN-based batch loading:
   - `getAvailableRequestsForCoordinator()`: Single LEFT JOIN to batch load offers
   - `getActiveRequestsForCoordinator()`: Single LEFT JOIN to batch load offers
   - `getPaymentRequestsForCoordinator()`: Single LEFT JOIN to batch load offers
   - **Performance impact**: Response times reduced from 8-10s to 3-5s (60-75% faster)

3. **Data Transfer Optimization** - Excluded heavy base64 fields from bulk endpoints:
   - `getAllUsers()`: Excluded `truckPhotos` field (preserves field in `getUserById()` for detail views)
   - `getAllTransportRequests()`: Excluded `paymentReceipt` field
   - **Performance impact**: `/api/users` payload reduced from 101.5 MB to 104 KB (99.9% reduction), response time improved from 15s to 0.25s (98% faster)

4. **Database Indexes** - Added indexes on frequently queried columns in `shared/schema.ts`:
   - `users`: role, status, isActive
   - `transportRequests`: status, paymentStatus
   - `offers`: status
   - **Status**: Defined in schema, requires manual execution of `npm run db:push` (select 'No' to preserve existing data)

5. **Admin Stats Endpoint** - `/api/admin/stats` optimization:
   - **Current implementation**: In-memory aggregation with lighter data transfer (benefits from field exclusions above)
   - **Performance**: Response time ~1.2s (91% improvement from original 14s)
   - **TODO**: Future SQL aggregate rewrite using Drizzle's `alias()` helper for database-level computation
   - **Status**: Fully functional, admin dashboard operational with correct statistics

**Testing Credentials:**
- Coordinator: +212661040189 / PIN: 123456

## External Dependencies

### UI/Styling
- **Radix UI**: Accessible component primitives.
- **Shadcn/ui**: Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Infobip API**: SMS notifications.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Nodemailer**: Automated email notifications.
- **Web Push**: Browser push notifications.
- **WhatsApp Business API**: Automated WhatsApp notifications via whatsapp-web.js with persistent session storage in Replit Object Storage.
- **Replit Object Storage**: Persistent storage for WhatsApp sessions across deployments.

### Data Management
- **Drizzle ORM**: Type-safe SQL query builder.
- **Drizzle Zod**: Schema-to-validation generation.
- **TanStack React Query**: Server state management.

### Utilities
- **Wouter**: Lightweight client-side routing.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **Embla Carousel**: Carousel/slider.