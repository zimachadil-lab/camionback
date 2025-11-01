# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients needing transportation services with independent transporters, supporting Client, Transporter, Administrator, and Coordinator roles. The platform aims to streamline logistics through request creation, service offers, platform management, and operational oversight, ultimately becoming a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

### November 2025 - Dashboard Transporteur Bug Fixes
**Issue**: Transporters experiencing blank dashboard page and 404 errors after login.

**Root Causes Identified**:
1. **23 TypeScript Errors**: "user is possibly null" errors throughout transporter-dashboard.tsx causing runtime failures
2. **Role Mismatch**: Database stores role as "transporteur" (French) but frontend code checked for "transporter" (English)

**Corrections Applied**:
1. **TypeScript Null Safety** (transporter-dashboard.tsx, transporter-payments.tsx):
   - Added `enabled: !!user` to all useQuery hooks to prevent queries when user is null
   - Added early return after all hooks with loading screen for null/loading states
   - Used `user!` assertion after early return where user is guaranteed non-null
   - Follows React Hooks rules: all hooks called before conditional returns

2. **Role Normalization** (8 files updated):
   - `client/src/lib/auth-context.tsx`: Updated User interface type to use "transporteur"
   - `client/src/pages/home.tsx`: Changed role check from "transporter" to "transporteur"
   - `client/src/pages/transporter-dashboard.tsx`: Updated reference query role check
   - `client/src/pages/public-request-view.tsx`: Fixed public offer redirect role check
   - `client/src/components/auth/phone-auth.tsx`: Updated profile completion redirect
   - `client/src/pages/transporter-payments.tsx`: Fixed payments page role check
   - `client/src/components/layout/header.tsx`: Updated menu and button role checks (2 locations)
   - `client/src/pages/client-dashboard.tsx`: Fixed transporter search in payment requests

**Result**: 
- ✅ Transporter dashboard loads successfully without blank page
- ✅ No more 404 errors after transporter login
- ✅ All navigation (tabs, menu, payments page) working correctly
- ✅ Zero "user is possibly null" console errors
- ✅ API endpoints returning 200 successfully

**Test Account**: +212600111222 / PIN: 123456 (validated transporter)

## System Architecture

### UI/UX Decisions
The platform uses a mobile-first, dark teal design with a French language interface. It leverages React 18, TypeScript, Vite, Wouter for routing, TanStack Query for state management, and Tailwind CSS for styling. Shadcn/ui provides components, Radix UI ensures accessibility, and React Hook Form with Zod handles form management. Key UI elements include responsive admin navigation, role-based header navigation, animated truck header on the login page, Instagram-style stories, a modern role selection page, and an interactive calendar for transporters. PWA enhancements include offline support, advanced caching, and native-like push notifications.

### Technical Implementations
The backend is built with Express.js and TypeScript, providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) are managed with role and status-based access control. Real-time chat is implemented via WebSockets, and an in-app notification system provides alerts. The application uses PostgreSQL (via Neon Serverless) with Drizzle ORM.

**Key Features:**
- **Request and Offer Workflow:** Multi-status client request progression, transporter offer submission, and client/admin acceptance.
- **User Management:** Transporter rating, contract management, account blocking/deletion, and automated client ID generation.
- **Messaging & Notifications:** Centralized admin messaging, voice messaging, SMS notifications, email notifications, and PWA with native push notifications.
- **Admin & Coordinator Tools:** Dynamic admin dashboard statistics, request management (hide/delete/expire), reporting and dispute system, comprehensive filtering/search, full CRUD for cities, and advanced coordination status tracking with automated coordinator assignment and expiration for archived requests.
- **Public Order Sharing:** Coordinators can share transport requests via unique, secure public links. Features include: shareToken-based URLs (`/public/request/:shareToken`), public view with complete order details (route map, photos, client info), WhatsApp sharing integration, copy-to-clipboard functionality, and "Make Offer" button with authentication redirect for non-logged users.
- **CamioMatch:** Intelligent, Tinder-style transporter matching for clients based on various criteria.
- **File Management:** Base64 for client photos, Multer for transporter truck photos, and multimedia messaging.
- **Security:** Comprehensive backend security with 72 protected and sanitized endpoints, session-based authentication using PostgreSQL, HttpOnly/Secure/SameSite cookies, and role-based access control. No password hashes are exposed, and phone numbers are masked. Public sharing links use unique tokens and expose only sanitized data.
- **PWA Installation:** Dedicated `/app` route for direct PWA installation with platform detection and instructions, and a contextual PWA installation toast.

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