# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients with independent transporters. It supports Client, Transporter, Administrator, and Coordinator roles, aiming to streamline logistics through request creation, service offers, and platform management. The platform's vision is to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with full French/Arabic bilingual support, built with React 18, TypeScript, Vite, Wouter, TanStack Query, and Tailwind CSS. UI components leverage Shadcn/ui for aesthetics and Radix UI for accessibility, with React Hook Form and Zod for form management. Key UI elements include responsive role-based navigation, an animated truck header, Instagram-style stories, a modern role selection page, and an interactive calendar for transporters. PWA enhancements provide offline support, advanced caching, and native-like push notifications. Recent UI/UX improvements include a redesigned transporter request card with a strong visual hierarchy, client dashboard enhancements with a premium blue "Offres reçues" button, and a restructured, card-based admin dashboard navigation.

**Bilingual Support (FR/AR):** The platform now features complete French/Arabic bilingualism with react-i18next, providing a seamless language-switching experience. Translation resources are bundled directly into the application via JSON imports (no HTTP backend) ensuring instant loading. A prominent language selector is integrated into authentication pages, allowing users to switch between French and Arabic. The platform automatically applies RTL (right-to-left) layout when Arabic is selected, with document.dir and document.lang attributes updated dynamically. User language preferences are persisted in the database (preferredLanguage field) and localStorage for consistent cross-session experience. All authentication flows (PhoneAuth and SelectRole) are fully translated with professional Arabic localizations.

### Technical Implementations
The backend is an Express.js and TypeScript application providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) define access control. Real-time chat uses WebSockets, and an in-app notification system provides alerts. PostgreSQL (Neon Serverless) with Drizzle ORM is used for data storage.

**Key Features:**
- **Request and Offer Workflow:** Multi-status client request progression, transporter offer submission, and acceptance. Coordinators centralize pricing and matching decisions. Transporters can propose alternative availability dates. Clients view proposed dates with color-coded badges and can switch between card and table views for comparing transporters. Error messaging for unavailable requests is enhanced. Coordinators can cancel requests with custom reasons for non-responsive clients or external bookings, automatically removing them from all transporter views. **Production Order Cancellation:** Coordinators can cancel accepted orders from the "Production" tab when clients don't honor their commitments. Cancellation generates an internal note for the client with the reason, sends an SMS notification to the assigned transporter, and updates the request status to 'cancelled'. **Order Requalification:** Coordinators can cancel and immediately requalify production orders when disputes arise between clients and transporters. The "Annuler et requalifier" feature resets the order to "qualified" status, clears the transporter assignment and interests, republishes for matching, and notifies all parties (client, previous transporter, active transporters) with appropriate messages.
- **User Management:** Features include transporter rating, contract management, account blocking/deletion, and automated client ID generation. Transporter registration has been simplified, removing the referent system.
- **Messaging & Notifications:** A comprehensive multi-channel notification system (in-app, SMS, email, PWA push) covers all coordinator-centric workflow events, including request cancellations from both "Intéressés" and "Production" tabs.
- **Admin & Coordinator Tools:** Dynamic dashboards, comprehensive request management (hide/delete/expire/republish/cancel, advanced coordination status tracking), reporting, dispute resolution, CRUD for cities, and coordinator self-assignment to requests. Coordinators can view and assign interested transporters, toggle their visibility to clients, and republish archived requests. The admin dashboard navigation is restructured into clear sections for Operations, Management, and Configuration. The coordinator dashboard is streamlined into four intuitive views with a unified search bar. Request cancellation feature allows coordinators to cancel orders from both the "Intéressés" tab (for matching phase) and "Production" tab (for accepted orders) with reason tracking and automatic notifications to all parties. **Payment Status Management:** Coordinators can update payment status on production orders with three options (à facturer, payé par client, payé par camionback) via a selector displayed below the assignment button. When marked "payé par camionback", orders automatically migrate to the Admin Contracts view with "completed" (terminé) status and disappear from all coordinator dashboards.
- **Public Order Sharing:** Coordinators can share transport requests via secure public links with WhatsApp integration.
- **CamioMatch:** An intelligent, Tinder-style transporter matching system.
- **File Management:** Supports Base64 encoding for client photos, Multer for transporter truck photos, and multimedia messaging.
- **Security:** Comprehensive backend security with 72 protected endpoints, session-based authentication, role-based access control, masked phone numbers, and unique tokens for public sharing links. Transporter endpoints prevent coordinator pricing data leakage.
- **PWA Installation:** Dedicated `/app` route for direct PWA installation with platform detection.
- **Performance Optimizations:** Client dashboard displays offer counts instantly using pre-calculated `interestedTransportersCount` and `offersCount` from `/api/requests`, eliminating delays from separate API calls. Interested transporters are loaded lazily only when the dialog opens, improving perceived performance. **Publish-for-matching endpoint** responds immediately while notifying transporters asynchronously in the background using `Promise.allSettled`, with database-level filtering via `getActiveValidatedTransporters()` to avoid full-table scans. **Coordinator "En production" tab** uses a single optimized SQL query with LEFT JOINs to fetch all request data (client, coordinator, transporter, offers) instead of N+1 queries, reducing database load from ~24 queries to 1 query for typical use cases.

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
- **Nodemailer**: Automated email notifications (nouvelle commande → camionback@gmail.com, commande validée → commande.camionback@gmail.com).
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