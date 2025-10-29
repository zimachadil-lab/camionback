# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients needing transportation services with independent transporters, supporting Client, Transporter, Administrator, and Coordinator roles. The platform streamlines logistics through request creation, service offers, platform management, and operational oversight, aiming to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **2025-10-29**: Added request date/time display in admin validation tab with newest-first sorting. Modified getPendingDrivers() in both MemStorage and DbStorage to sort by createdAt desc. Added "Date de demande" column showing date (dd/MM/yyyy) and time (HH:mm) in French format using date-fns. Fixed transporter name display in coordinator returns tab by adding LEFT JOIN with users table in getActiveEmptyReturns(). Created ActiveEmptyReturnWithTransporter type for proper typing. Fixed client delete button with success/error toast notifications, removed 100-item limit on admin validation page, resolved admin messaging system with dual-recipient delivery (client + transporter), enhanced getAdminConversations() with 4-level fallback logic for transporter identification.

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