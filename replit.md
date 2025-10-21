# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application designed for the Moroccan market. It connects clients who need transportation services with independent transporters. The platform supports Client, Transporter, and Administrator roles, facilitating request creation, service offers, and overall platform management. The project aims to streamline logistics operations and provide a robust, user-friendly platform with a mobile-first, dark teal design, a French interface, and phone-based PIN authentication.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first design, a dark teal theme, and a French language interface. It leverages React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles form management.

### Technical Implementations
The backend is built with Express.js and TypeScript, offering RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing, supporting Moroccan phone formats. User roles (Client, Transporter, Admin) are managed, with Transporters requiring admin validation. Session persistence uses localStorage, with role and status-based access control. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM for type-safe database operations and schema migrations.

**Key Features:**
- **Request and Payment Workflow:** Clients create requests that progress through various statuses. Payment flows include multiple stages requiring admin validation.
- **Transporter Offers System:** Transporters submit offers; clients can accept or decline. Admins can also accept offers. Transporters cannot see requests where they have already submitted an offer.
- **Transporter Rating System:** Clients rate transporters upon request completion, affecting average ratings.
- **Contract Management System:** Automated contract generation upon offer acceptance, with admin dashboard management.
- **Centralized Admin Messaging System:** Admins can monitor, intervene in, and send messages within client-transporter conversations.
- **Voice Messaging System:** Full voice recording and playback capabilities across all user roles, stored with `messageType: 'voice'`.
- **Dynamic Admin Dashboard Statistics:** Real-time statistics for users, conversion, ratings, order processing, and payments.
- **Automatic Client Identification System:** Sequential IDs (C-XXXX) for clients, displayed in interfaces and admin dashboard.
- **User Account Management System:** Admins can block/unblock user accounts.
- **Request Management System (Admin):** Admins can hide/unhide transport requests and delete requests with cascade deletion of related data.
- **Reporting and Dispute System:** Clients and transporters can report issues on orders, with admin tools for resolution.
- **SMS Notification System (Infobip):** Fire-and-forget SMS alerts for key events (first offer, offer accepted, account activated) with auto-formatting for Moroccan numbers.
- **Automated Email Notification System:** Fire-and-forget email notifications via Nodemailer for critical platform events (new requests, offers, order validation, reports).
- **File Upload:** Base64 encoding for client request photos, Multer for transporter truck photos.
- **Photo Gallery System:** Fullscreen modal with carousel navigation for transport request photos.
- **Client Privacy & Anonymization:** Complete anonymization of client details (e.g., "Client C-XXXX") across all interfaces except for admin user management.
- **Dynamic City Management System:** Admins manage cities via CRUD operations, with real-time updates across the platform.
- **RIB (Bank Account) Management System:** Transporters manage their RIB details; admins can view and edit them.
- **Informational Pages System:** Role-specific "How It Works" pages for clients and transporters.
- **WhatsApp Contact Integration:** Direct WhatsApp support link for all users.
- **Admin SMS Communications System:** Bulk SMS messaging system for admins to communicate with users via Infobip, featuring three main components: (1) Quick notify for validated transporters with predefined message, (2) Custom SMS sending with audience targeting (transporters/clients/both) and 160-character limit, (3) Full SMS history tracking with admin attribution, recipient count, and deletion capability.
- **Advanced Admin Request Filtering & Search System:** Comprehensive filtering and search capabilities in the admin Demandes view with: (1) Real-time search across reference ID, client phone number, departure city, and arrival city, (2) Status-based filtering dropdown (all/open/accepted/completed/cancelled), (3) Automatic descending date sorting (most recent first), (4) Date display with time in JJ/MM/AAAA - HH:mm format, (5) Results count and filter reset functionality.
- **Permanent User Account Deletion System:** Admins can permanently delete user accounts (clients and transporters) with complete cascade deletion of all related data (offers, messages, notifications, ratings, contracts, reports, empty returns, SMS history, credentials). The phone number is freed upon deletion and can be reused for new account registration. Deletion buttons are available in both the "Validation des transporteurs" and "Clients" admin views with native confirmation dialogs.
- **Empty Return Access Restriction:** The "Annoncer un retour" (+ Retour) button in the transporter dashboard header is restricted to validated transporters only. Non-validated transporters see a professional blocking dialog explaining that they must wait for account validation to access the empty return feature.
- **Admin Transporter Profile Editing System:** Comprehensive admin interface for editing validated transporter profiles with Edit icon in transporter list, popup dialog for modifying all profile fields (name, city, phone, truck photo), password/PIN reset capability (6-digit validation), truck photo upload functionality via multer (5MB limit, base64 storage), and success notifications. Backend route PATCH `/api/admin/transporters/:id` with FormData support and bcrypt password hashing.
- **UI Enhancements:** Responsive admin navigation, clear messaging buttons, role-based header navigation.

### System Design Choices
**Data Storage:** PostgreSQL with Neon serverless and Drizzle ORM for type-safe queries and migrations, with WebSocket support for Neon compatibility.
**Authentication & Authorization:** Phone number-based PIN verification, role, and status-based access control.
**Backend:** Express.js with TypeScript, ES Modules, `tsx`, and Multer (5MB limit).
**Routing:** Dedicated dashboard routes (`/admin-dashboard`, `/client-dashboard`, `/transporter-dashboard`). `/login` is an alias for `/`.
**Admin Account:** Default admin account: `+212664373534`, PIN `040189`.

## External Dependencies

### UI/Styling
- **Radix UI**: Accessible component primitives.
- **Shadcn/ui**: Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Infobip API**: For critical SMS notifications (primary SMS provider).
- **Neon Database**: Serverless PostgreSQL hosting.
- **Nodemailer**: For automated email notifications.

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

## Known Issues & Future Improvements

### Security
**CRITICAL - Admin Route Authorization:** All admin routes (including `/api/admin/users/:id`, `/api/admin/pending-drivers`, `/api/admin/validate-driver/:id`, `/api/admin/block-user/:id`, `/api/admin/transporters/:id`, etc.) currently lack authentication and authorization checks. This means any user who knows the API endpoints could potentially access admin functionality. **Future work required:** Implement middleware to authenticate requests and verify admin role before allowing access to admin routes.