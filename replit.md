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
- **Request Management (Admin):** Admins can hide/unhide and delete transport requests.
- **Reporting and Dispute System:** Users can report issues with admin resolution tools.
- **SMS Notification System (Infobip):** Fire-and-forget SMS for key events, admin bulk messaging, and individual SMS to specific phone numbers.
- **Automated Email Notification System (Nodemailer):** Fire-and-forget emails for critical platform events.
- **LoadingTruck Animation Component:** Reusable truck driving animation for consistent loading states across dashboards (replaces generic spinners).
- **Admin Dashboard Refresh Control:** Dedicated button to refresh all dashboard data on-demand via TanStack Query cache invalidation.
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
- **PWA with Push Notifications:** Full PWA implementation with offline support, advanced caching, Web Push API integration for notifications, and floating install button ("📲 Installer CamionBack") that appears on HTTPS sites when beforeinstallprompt fires. Manifest includes scope and id fields. Complete testing guide available in PWA_TESTING_GUIDE.md.

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