# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients needing transportation with independent transporters. It supports Client, Transporter, and Administrator roles, enabling request creation, service offers, and platform management. Key features include a mobile-first, dark teal design, a French interface, and phone-based PIN authentication. The project aims to streamline logistics operations and provide a robust, user-friendly platform for the Moroccan transport sector.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first design with a dark teal theme and a French language interface. It utilizes React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles forms.

### Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing, supporting Moroccan phone formats. User roles (Client, Transporter, Admin) are managed, with Transporters requiring admin validation. Session persistence uses localStorage, with role and status-based access control.

Real-time chat is implemented via WebSockets for direct client-transporter communication. An in-app notification system provides alerts for offers, payments, and chat messages.

**Database:** The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM for type-safe database operations. The database connection is configured with WebSocket support for compatibility with Neon's serverless architecture (`server/db.ts`). Database storage is handled by the `DbStorage` class (`server/storage.ts`), implementing all CRUD operations through Drizzle ORM queries. Schema migrations are managed via `npm run db:push` (no manual SQL migrations required).

### Feature Specifications
**Request and Payment Workflow:** Clients create requests that progress through 'Open', 'Accepted', and 'Completed' statuses. Clients can accept offers, mark requests complete, and republish them. The payment flow includes 'pending', 'awaiting_payment', 'pending_admin_validation', and 'paid' statuses, involving receipt uploads and admin validation.

**Transporter Offers System:** Transporters submit offers with amount, pickup date, and load type ("Retour" or "Groupage / Partagé"). Clients can accept (triggering commission calculation and notifications) or decline offers. Admins can also accept offers on behalf of clients. Transporters can edit their pending offers (amount, pickup date, load type) with numeric validation using z.coerce.number(). Transporters cannot see requests where they have already submitted an offer (automatic filtering) or requests hidden by admins.

**Transporter Rating System:** Clients rate transporters (1-5 stars) upon request completion, updating average ratings and completed trips.

**Contract Management System:** Automated contract generation occurs when offers are accepted. Contracts track requestId, offerId, clientId, transporterId, amount, and status ('in_progress', 'marked_paid_transporter', 'marked_paid_client', 'completed'). The admin dashboard provides comprehensive contract listing and management.

**Centralized Admin Messaging System:** Admins can monitor and intervene in client-transporter conversations. The admin dashboard displays all conversations, allows viewing full threads, and enables admins to send messages as "Admin CamionBack."

**Dynamic Admin Dashboard Statistics:** The admin dashboard provides real-time statistics, including active users, conversion rates, average ratings, order processing times, and pending payments. It also displays detailed statistics for clients and transporters.

**Automatic Client Identification System:** Clients receive sequential IDs (C-XXXX) upon registration, displayed in their interface. The admin dashboard includes a "Clients" tab with comprehensive client statistics and search functionality.

**User Account Management System:** Admins can block/unblock user accounts, controlling login access. Blocked users receive notifications and cannot log in.

**Request Management System (Admin):** Admins can hide/unhide transport requests (isHidden field) to control visibility for transporters. Hidden requests are not displayed in transporter dashboards. Admins can delete transport requests with automatic cascade deletion of all related data (contracts, reports, offers, messages, notifications) to maintain database integrity.

**Reporting and Dispute System:** Clients and transporters can report issues on active and completed orders, categorizing problem types. Clients can report problems in "Commandes actives" for accepted orders. Transporters can report clients for all in-progress orders. The admin dashboard lists all reports, allowing admins to resolve, reject, or block reported users.

**SMS Notification System:** Critical SMS alerts are sent via Twilio for the first offer received by a client and offer acceptance confirmation to a transporter.

**File Upload:** Client request photos use Base64 encoding. Transporter truck photos use Multer middleware.

**Photo Gallery System:** Transport request photos are displayed in a fullscreen modal with carousel navigation (Embla Carousel). The gallery dialog shows "Photos du chargement – Commande [REF]" as title and allows navigation between multiple photos with previous/next controls.

**Client Privacy & Anonymization:** Complete client anonymization across all interfaces for privacy protection. Standard anonymized format: `Client {client?.clientId || "Non défini"}` (e.g., "Client C-0001"). All admin operational views (Demandes, Offres, Contrats, Facturation tables and dialogs, Conversations, Reports) display only anonymized client identifiers with no phone number exposure. Transporters see "Client C-XXXX" in all interfaces (order cards, details dialogs, chat headers). The ONLY exception: Admin > Clients > "Nom" column displays real names for user management purposes. This ensures comprehensive privacy while maintaining necessary administrative functionality.

**Dynamic City Management System:** Administrators can manage cities through the dedicated "Villes" tab in the admin dashboard. Features include CRUD operations (add, edit, delete cities) with real-time updates across the platform. All city selection fields (client request forms, transporter registration, admin filters) dynamically fetch active cities from `/api/cities`. This replaces hardcoded city arrays, ensuring centralized management and consistency.

**RIB (Bank Account) Management System:** Transporters can manage their banking details (RIB - Relevé d'Identité Bancaire) through the "Mon RIB" page accessible from the header navigation menu. The system stores `ribName` (account holder name) and `ribNumber` (24-digit bank account number) in the users table. Administrators can view and edit any transporter's RIB information through a dedicated RIB column in the transporters list, which opens a management dialog. Frontend validation ensures RIB numbers contain exactly 24 digits. API routes: GET/PATCH `/api/user/rib` (transporter self-management) and GET/PATCH `/api/admin/users/:id/rib` (admin management).

**Informational Pages System:** Platform provides role-specific "Comment ça marche" (How It Works) pages explaining platform usage. Clients access `/how-it-works-client` with step-by-step guide for submitting requests, reviewing offers, and completing transactions. Transporters access `/how-it-works-transporter` with instructions for browsing requests, submitting offers, and managing deliveries. Both pages are accessible via the header navigation menu and feature comprehensive explanations in French, designed to onboard new users effectively.

**WhatsApp Contact Integration:** All users (clients, transporters, and admins) can contact support via WhatsApp through a "Nous contacter" menu option in the header. This opens a dialog component (`ContactWhatsAppDialog`) that provides a direct link to the platform's WhatsApp contact (+212664373534 via https://wa.me/212664373534). The integration ensures users have immediate access to support and customer service through their preferred communication channel.

**UI Enhancements:** Admin navigation tabs use responsive design with horizontal scrolling on mobile (`flex overflow-x-auto`) and grid layout on desktop (`lg:grid lg:grid-cols-N`). Client dashboard active orders feature a green "Message" button (#00cc88) that directly opens chat with the assigned transporter. Transporter "Envoyer un message" button styled with green background (#00cc88), white text, and shadow for improved visibility. Header component supports role-based navigation with both href-based routing and onClick actions for dialogs/modals.

### System Design Choices
**Data Storage:** PostgreSQL with Neon serverless and Drizzle ORM for type-safe queries and migrations. Database connection configured with WebSocket support (`ws` package) for Neon Serverless compatibility in Node.js environment.
**Authentication & Authorization:** Phone number-based PIN verification. Role and status-based access control.
**Backend:** Express.js with TypeScript, ES Modules, and `tsx`. Multer for multipart form data (5MB limit). DbStorage class implementing IStorage interface for all database operations.
**Routing:** Dashboard routes are explicitly defined: `/admin-dashboard` for administrators, `/client-dashboard` for clients, and `/transporter-dashboard` for transporters.
**Admin Account:** Default admin account created with phone number `+212664373534` and PIN `040189`. This account has full administrative access to the platform and can manage users, validate transporters, configure commission rates, and access all administrative features.

## External Dependencies

### UI/Styling
- **Radix UI**: Headless, accessible component primitives.
- **Shadcn/ui**: Pre-built, Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Twilio API**: For SMS notifications.
- **Neon Database**: Serverless PostgreSQL hosting.

### Data Management
- **Drizzle ORM**: Type-safe SQL query builder for PostgreSQL.
- **Drizzle Zod**: Schema-to-validation generation.
- **TanStack React Query**: Server state management and caching.

### Utilities
- **Wouter**: Lightweight client-side routing.
- **React Hook Form**: Form state management with validation.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.
- **Embla Carousel**: Carousel/slider for photo galleries.