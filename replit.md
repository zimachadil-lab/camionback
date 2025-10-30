# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients needing transportation services with independent transporters, supporting Client, Transporter, Administrator, and Coordinator roles. The platform streamlines logistics through request creation, service offers, platform management, and operational oversight, aiming to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **2025-10-30**: Created dedicated PWA installation page at `/app` route. Built comprehensive installation landing page (PWAInstallPage component) with permanent install button, platform detection (iOS/Android/Desktop), branded header with Truck icon, gradient background design, feature highlights (instant access, real-time notifications, offline capability, zero downloads), platform-specific installation instructions (Safari for iOS with Share button guidance, Chrome for Android with menu instructions, desktop browser with install prompt), success state display when already installed, direct app access link, and complete beforeinstallprompt event capture. Page designed for sharing via QR codes or short URLs like camionback.com/app to enable immediate PWA installation without waiting for contextual toast prompt.
- **2025-10-30**: Enhanced coordination status management with Archives category and usage statistics. Added "archives" as third category option in coordination status schema alongside "en_action" and "prioritaires". Created dedicated Archives section in admin UI displaying archived statuses in separate table. Implemented usage statistics tracking showing count of requests using each coordination status. Added new API route GET `/api/admin/coordination-status-usage` calling `getCoordinationStatusUsage()` storage method with GROUP BY SQL query on transport_requests.coordination_status. Added "Utilisations" column with Badge display in all three status tables (En Action, Prioritaires, Archives). Fixed critical apiRequest argument order bug (method must come first) in CoordinatorManagement and CoordinationStatusManagement components. Unified route parameters accepting both `userId` and `adminId` (with fallback) for admin and coordinator access across all coordination status routes (GET/POST/PATCH/DELETE). Implemented automatic cache invalidation for usage statistics after status mutations to keep data fresh.
- **2025-10-29**: Implemented comprehensive coordination status tracking system for coordinator dashboard. Added 4 new database columns via SQL (coordination_status, coordination_reason, coordination_reminder_date, coordination_updated_at, coordination_updated_by) to transport_requests table. Created 4 backend filtering methods (getCoordinationNouveauRequests, getCoordinationEnActionRequests, getCoordinationPrioritairesRequests, getCoordinationArchivesRequests) in storage layer to organize open requests without accepted offers into 4 workflow views: Nouveau (default), En Action (6 statuses: client_injoignable, infos_manquantes, photos_a_recuperer, rappel_prevu, attente_concurrence, refus_tarif), Prioritaires (4 statuses: livraison_urgente, client_interesse, transporteur_interesse, menace_annulation), and Archives (archive status). Added 5 API routes (4 GET endpoints for views + 1 PATCH for status updates) at /api/coordinator/coordination/*. Built complete frontend with new "Coordination" tab in coordinator dashboard containing 4 sub-tabs with TanStack Query integration, mutations, and professional status selector dialog supporting optional reason text and conditional reminder date field (shown only when status = rappel_prevu). Enhanced coordinator workflow management for efficient tracking and prioritization of requests requiring attention.
- **2025-10-29**: Excluded transporters without truck photos from admin validation tab. Modified getPendingDrivers() in MemStorage to filter truckPhotos existence and length > 0. Modified DbStorage to use isNotNull(users.truckPhotos) and array_length SQL check. Added request date/time display in admin validation tab with newest-first sorting. Modified getPendingDrivers() in both MemStorage and DbStorage to sort by createdAt desc. Added "Date de demande" column showing date (dd/MM/yyyy) and time (HH:mm) in French format using date-fns. Fixed transporter name display in coordinator returns tab by adding LEFT JOIN with users table in getActiveEmptyReturns(). Created ActiveEmptyReturnWithTransporter type for proper typing. Fixed client delete button with success/error toast notifications, removed 100-item limit on admin validation page, resolved admin messaging system with dual-recipient delivery (client + transporter), enhanced getAdminConversations() with 4-level fallback logic for transporter identification.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with a French language interface. It uses React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles form management. Key UI elements include responsive admin navigation, role-based header navigation, animated truck header on the login page, Instagram-style stories, and a modern role selection page.

### Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) are managed, with role and status-based access control. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM.

**Key Features:**
- **Request and Offer Workflow:** Multi-status client request progression, transporter offer submission, and client/admin acceptance.
- **User Management:** Transporter rating, contract management, account blocking/deletion, and automated client ID generation.
- **Messaging & Notifications:** Centralized admin messaging, voice messaging, SMS notifications (Infobip), email notifications (Nodemailer), and PWA with native push notifications (Web Push API).
- **Admin & Coordinator Tools:** Dynamic admin dashboard statistics, request management (hide/delete/expire), reporting and dispute system, comprehensive filtering/search, and full CRUD for cities.
- **Coordinator Role:** Elevated operational oversight with dedicated dashboards, notification and messaging systems, and offer management capabilities (including client assistance for offer acceptance).
- **File Management:** Base64 for client photos, Multer for transporter truck photos, and multimedia messaging.
- **CamioMatch:** Intelligent, Tinder-style transporter matching for clients based on various criteria.
- **Interactive Calendar for Transporters:** Monthly calendar view in the "À Traiter" section displaying scheduled orders with green indicator dots, date-based filtering, navigation between months/years, and monthly summary (order count, estimated revenue, next delivery). Supports selection of any date (including empty dates) with visual feedback and clear filter functionality.
- **PWA Enhancements:** Offline support, advanced caching, and native-like push notifications for key events.
- **Contextual PWA Installation Toast:** Modern, non-intrusive installation prompt replacing fixed button. Toast appears after 10 seconds of user inactivity (scroll, click, touch events reset timer), displays in top-right on desktop and bottom-right on mobile with elegant slide+fade animation. Features two actions: "Installer" (triggers native beforeinstallprompt) and "Plus tard" (dismisses and stores preference in localStorage). Auto-dismisses after 15 seconds if no interaction. Shown only once per session and respects user's previous dismissal choice. Smooth animations (0.4s transition) and responsive design ensure premium UX without interfering with dashboard CTAs. Component: PWAInstallToast with inactivity detection, localStorage persistence, and automatic hide logic.
- **Dedicated PWA Installation Page:** Standalone landing page accessible at `/app` route designed for direct sharing and installation. Features permanent install button (no timeout), platform-specific instructions (iOS Safari, Android Chrome, Desktop), branded design with gradient background, feature highlights, installation state detection, and complete beforeinstallprompt handling. Ideal for QR codes, social media sharing, and direct distribution via short URLs like camionback.com/app.
- **Optimized Favicon System:** Multiple sizes and optimized linking.
- **Secure Static File Serving:** Custom middleware with whitelist validation and differential caching.

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
- **Embla Carousel**: Carousel/slider.