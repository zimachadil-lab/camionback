# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients needing transportation with independent transporters. It supports Client, Transporter, and Administrator roles, facilitating request creation, service offers, and platform management. The platform aims to streamline logistics operations through a robust, user-friendly interface with a mobile-first, dark teal design, a French interface, and phone-based PIN authentication. The project's ambition is to become a leading logistics platform in Morocco, enhancing efficiency and connectivity within the transport sector.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with a French language interface. It utilizes React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles form management. Key UI enhancements include responsive admin navigation, clear messaging buttons, and role-based header navigation.

### Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin) are managed, with Transporters requiring admin validation. Session persistence uses localStorage, and access control is role and status-based. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM for type-safe database operations.

**Key Features:**
- **Request and Payment Workflow:** Multi-status client request progression with admin-validated payment flows.
- **Transporter Offers System:** Transporters submit offers; clients can accept/decline, and admins can also accept.
- **Transporter Rating System:** Clients rate transporters upon completion.
- **Contract Management System:** Automated contract generation and admin management.
- **Centralized Admin Messaging:** Admins monitor and intervene in client-transporter chats.
- **Voice Messaging System:** Full voice recording and playback in chats.
- **Dynamic Admin Dashboard Statistics:** Real-time stats for users, conversion, ratings, orders, and payments.
- **Automatic Client Identification:** Sequential C-XXXX IDs for clients.
- **User Account Management:** Admins can block/unblock and permanently delete user accounts with cascade deletion.
- **Request Management (Admin):** Admins can hide/unhide and delete transport requests. Request expiration system with backend support for republishing expired requests with new dates.
- **Reporting and Dispute System:** Users can report issues with admin resolution tools.
- **SMS Notification System (Infobip):** Fire-and-forget SMS for key events, admin bulk messaging, and individual SMS to specific phone numbers.
- **Automated Email Notification System (Nodemailer):** Fire-and-forget emails for critical platform events.
- **LoadingTruck Animation Component:** Reusable truck driving animation for consistent loading states across dashboards and transporter profiles.
- **Admin Dashboard Refresh Control:** Dedicated button to refresh all dashboard data on-demand via TanStack Query cache invalidation.
- **Enhanced Admin Data Display:** Comprehensive admin views showing client IDs with phone numbers in Demandes/Facturation, transporter names with phone numbers in Offres/Contrats/Retours, ensuring admins have complete contact information for all entities.
- **File Upload:** Base64 for client photos, Multer for transporter truck photos, and multimedia messaging (photos/videos) in chat.
- **Photo Gallery System:** Fullscreen modal with carousel navigation.
- **Client Privacy & Anonymization:** Client details anonymized across interfaces except for admin.
- **Dynamic City Management:** Admin CRUD operations for cities.
- **RIB (Bank Account) Management:** Transporters manage RIBs, visible/editable by admins.
- **Informational Pages:** Role-specific "How It Works" pages.
- **WhatsApp Contact Integration:** Direct support link for all users.
- **Advanced Admin Request Filtering & Search:** Comprehensive filtering, searching, and sorting in the admin "Demandes" view.
- **Empty Return Access Restriction:** Restricted to validated transporters with professional blocking dialog.
- **Admin Transporter Profile Editing:** Admins can edit transporter profiles, reset PINs, and upload truck photos.
- **CamioMatch - Intelligent Transporter Matching System:** Tinder-style swipe interface for clients to find prioritized transporters based on empty returns, activity, and ratings. Includes contact tracking and WhatsApp coordinator option.
- **PWA with Native Push Notifications:** Full PWA implementation (v2.3) with offline support, advanced caching, and native-like push notifications via Web Push API and VAPID protocol. Push notifications work even when the app is closed or in background, appearing in the device's notification center with vibration and sound. Notifications are sent for key events (new messages, offers, order validation, account activation) with deep links to specific pages. Installation uses native browser beforeinstallprompt event only (no custom buttons). Service Worker v2.3 includes updateViaCache: 'none' for instant updates and 30-minute update checks. **IMPORTANT:** Service Worker registration is conditionally disabled in development mode to prevent API response caching issues (500 errors on admin endpoints). Production mode enables full PWA functionality. VAPID keys externalized to Replit Secrets for security. Icon configuration: large notification icon at `/apple-touch-icon.png` (180x180 colored PNG), monochrome badge at `/icons/notification-badge.png` (96x96 white-on-transparent for Android compatibility). Test endpoint: `/api/pwa/test-push-notification?userId=XXX` for easy testing.
- **Instagram-Style Stories Feature:** Dynamic story cards displayed horizontally at the top of client and transporter dashboards. Admin can create, edit, and manage stories with role-based targeting (client/transporter/all), custom titles, content, optional media URLs, and display ordering. Stories are stored in PostgreSQL with fields: title, content, mediaUrl, role, order, isActive. Full CRUD API endpoints for admin management. Pre-populated with 7 base stories (3 for clients, 3 for transporters, 1 universal) covering platform benefits and key features.
- **Optimized Favicon System:** Comprehensive favicon implementation with multiple sizes (16x16, 32x32, 180x180 Apple, 192x192, 512x512) optimized via ImageMagick, properly linked in index.html and manifest.json.
- **Secure Static File Serving:** Custom middleware with whitelist-based file validation using `path.resolve(publicPath, '.' + req.path)` to prevent path traversal attacks. Differential caching: service-worker.js served with `Cache-Control: no-cache, no-store, must-revalidate` for instant PWA updates, while favicons/icons use 1-year cache (`max-age=31536000`) for performance.

### System Design Choices
**Data Storage:** PostgreSQL with Neon serverless and Drizzle ORM.
**Authentication & Authorization:** Phone number-based PIN verification, role, and status-based access control.
**Backend:** Express.js with TypeScript, ES Modules, `tsx`, and Multer.
**Routing:** Dedicated dashboard routes (`/admin-dashboard`, `/client-dashboard`, `/transporter-dashboard`).
**Admin Account:** Default admin account: `+212664373534`, PIN `040189`.

## External Dependencies

### UI/Styling
- **Radix UI**: Accessible component primitives.
- **Shadcn/ui**: Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Infobip API**: Critical SMS notifications and admin bulk messaging.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Nodemailer**: Automated email notifications.
- **Web Push**: Browser push notifications via VAPID protocol.

### Data Management
- **Drizzle ORM**: Type-safe SQL query builder.
- **Drizzle Zod**: Schema-to-validation generation.
- **TanStack React Query**: Server state management.

### Utilities
- **Wouter**: Lightweight client-side routing.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **Embla Carousel**: Carousel/slider for photo galleries.