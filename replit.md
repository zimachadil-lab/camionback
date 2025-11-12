# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients with independent transporters, streamlining logistics through request creation, service offers, and platform management. The platform supports Client, Transporter, Administrator, and Coordinator roles, aiming to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with full French/Arabic bilingual support, built with React 18, TypeScript, Vite, Wouter, TanStack Query, and Tailwind CSS. It leverages Shadcn/ui for aesthetics and Radix UI for accessibility. Key UI elements include responsive role-based navigation, an animated truck header, Instagram-style stories, a modern role selection page, an interactive calendar, and an interactive Google Maps visualization for route planning with real-time geocoding. PWA enhancements provide offline support, caching, and native-like push notifications. The platform implements comprehensive RTL support and provides translated "How It Works" pages. Admin and Coordinator dashboards are forced to French language and LTR layout.

**Client Dashboard:** Features a simplified two-tab layout ("Actives" and "Terminées"), with payment handled directly on request cards and dynamic button displays based on request status.

**Coordinator Dashboard:** Implements a complete request lifecycle (Nouveau → Qualifiés → Intéressés → Production → Pris en charge → Terminé) with a new "Pris en charge" tab for tracking requests taken by transporters. It includes an intelligent Google Places-powered filter system for various tabs and unified request card designs. A shared `StatusIndicator` component ensures consistent status display across dashboards.

**AI-Powered Price Estimation:** Integrates an AI-powered price estimation system using GPT-5 for the coordinator dashboard. This system considers empty returns (-60% discount) and groupage for small volumes, with conditional handling fees. It enforces a financial split (60% Transporter, 40% Platform with a minimum fee), includes an in-memory cache, rate limiting, and a heuristic fallback. The estimation provides a total client price, financial breakdown, confidence score, and reasoning.

### Technical Implementations
The backend is an Express.js and TypeScript application providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification. User roles define access control. Real-time chat uses WebSockets, and an in-app notification system provides alerts. PostgreSQL (Neon Serverless) with Drizzle ORM is used for data storage. Key features include a multi-status client request progression, transporter offer workflow, advanced user management, multi-channel notifications, dynamic dashboards for Admin and Coordinators, public order sharing (WhatsApp integration), CamioMatch for intelligent transporter matching, and robust file management. Performance is optimized with pre-calculated offer counts, lazy loading, and optimized SQL queries, including universal pagination for the Admin Dashboard and N+1 query elimination for critical coordinator endpoints. Google Maps integration consistently displays Western Sahara as part of Morocco.

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
- **Google Maps API**: Geocoding, routing, and location services.
- **Replit AI Integrations**: GPT-5 for price estimation.

### Data Management
- **Drizzle ORM**: Type-safe SQL query builder.
- **Drizzle Zod**: Schema-to-validation generation.
- **TanStack React Query**: Server state management.

### Utilities
- **Wouter**: Lightweight client-side routing.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.
- **date-fns**: Date manipulation.