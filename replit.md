# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients with independent transporters. It supports Client, Transporter, Administrator, and Coordinator roles, aiming to streamline logistics through request creation, service offers, and platform management. The platform's vision is to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with full French/Arabic bilingual support, built with React 18, TypeScript, Vite, Wouter, TanStack Query, and Tailwind CSS. UI components leverage Shadcn/ui for aesthetics and Radix UI for accessibility, with React Hook Form and Zod for form management. Key UI elements include responsive role-based navigation, an animated truck header, Instagram-style stories, a modern role selection page, and an interactive calendar for transporters. The new request form features an interactive Google Maps visualization (InteractiveRouteMap component) showing departure/arrival cities with draggable markers (🚚 teal for departure, 📍 orange for arrival) and a route polyline with arrow, providing real-time geocoding and visual route preview. PWA enhancements provide offline support, advanced caching, and native-like push notifications. The platform implements comprehensive RTL support using CSS logical properties. Fully translated "How It Works" pages for both clients and transporters provide step-by-step guides and platform benefits in French and Arabic. Admin and Coordinator dashboards enforce French language and LTR layout regardless of user preference (via `useForceFrenchLayout` hook), with automatic restoration of user's chosen language when exiting these dashboards.

### Technical Implementations
The backend is an Express.js and TypeScript application providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification and bcrypt hashing. User roles (Client, Transporter, Admin, Coordinator) define access control. Real-time chat uses WebSockets, and an in-app notification system provides alerts. PostgreSQL (Neon Serverless) with Drizzle ORM is used for data storage. Key features include a multi-status client request progression and transporter offer workflow, advanced user management (transporter rating, contract management, account blocking/deletion), multi-channel notification system (in-app, SMS, email, PWA push), dynamic dashboards for Admin and Coordinators (request management, reporting, dispute resolution, payment status management), public order sharing with WhatsApp integration, CamioMatch for intelligent transporter matching, and robust file management for photos. Performance is optimized with pre-calculated offer counts, lazy loading, and optimized SQL queries. Coordinators can manage and requalify production orders. Google Maps integration uses a shared loader (`google-maps-loader.ts`) with `region=MA` parameter to display Western Sahara as part of Morocco across all map components (InteractiveRouteMap, GooglePlacesAutocomplete), ensuring territorial consistency with Morocco's perspective.

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