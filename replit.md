# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market. It connects clients with independent transporters, streamlining logistics through request creation, service offers, and platform management. The platform supports Client, Transporter, Administrator, and Coordinator roles, aiming to become a leading and efficient logistics solution in Morocco, fostering efficiency and transparency in the logistics sector.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with full French/Arabic bilingual support, built with React 18, TypeScript, Vite, Wouter, TanStack Query, and Tailwind CSS. It leverages Shadcn/ui for aesthetics and Radix UI for accessibility. Key UI elements include responsive role-based navigation, an animated truck header, Instagram-style stories, a modern role selection page, an interactive calendar, and an interactive Google Maps visualization for route planning with real-time geocoding. PWA enhancements provide offline support, caching, and native-like push notifications. The platform implements comprehensive RTL support and provides translated "How It Works" pages. Admin and Coordinator dashboards are forced to French language and LTR layout.

**Client Dashboard:** Features a simplified two-tab layout ("Actives" and "Terminées"), with payment handled directly on request cards and dynamic button displays based on request status.

**Transporter Dashboard:** Features interest-based workflow with confirmation dialog system. Before marking interest in a request, transporters must confirm their commitment through a bilingual (FR/AR) dialog that clearly explains: (1) the client receives immediate notification, (2) the coordinator will contact within 24h, and (3) they must be 100% available. This reduces non-serious interest markings that waste coordinator time. The dialog uses simple, accessible design with visual hierarchy (warning icons, colored info boxes) suitable for non-technical users. After confirmation, transporters select their availability date through a date picker before interest is marked.

**Coordinator Dashboard:** Implements a complete request lifecycle (Nouveau → Qualifiés → Intéressés → Production → Pris en charge → Terminé) with a "Pris en charge" tab for tracking requests taken by transporters. **Automatic Publishing Workflow:** When coordinators qualify a request (set prices), it is automatically published to all active transporters with immediate multi-channel notifications (in-app, push, SMS), eliminating manual publish step and ensuring transporters see new opportunities instantly. City filtering uses a transporter-style dropdown sheet displaying only cities with active requests and includes request counters. Unified request card designs ensure a cohesive interface, with a shared `StatusIndicator` component for consistent status display. The dashboard includes an "Empty Returns" dialog accessible via a header button with a badge counter, displaying available return trips with truck photos, routes, dates, and transporter contact information. Professional invoice generation is integrated for "Production" and "Pris en charge" tabs, providing client-side PDF export with comprehensive details. The coordinator filter is available across all coordinator tabs (Nouveau, Qualifiés, Intéressés, Production, Pris en charge), maintaining independent filter states for each tab. Each tab supports city, coordinator, date range (période), and search filters; payment status filtering was removed from Production and Pris en charge tabs to simplify the interface. Intelligent requalification preserves pricing for qualified requests and demotes unpriced requests for estimation. **Transporter Portfolio:** A Tinder-style swipeable card interface enables coordinators to discover and match with validated transporters. Accessible via a Users icon button in the coordinator header, the portfolio displays transporter cards with truck photos (lazy-loaded for optimal performance), verification badges, ratings, trip statistics, and prominent contact information with a direct "Appeler" button. The phone number is displayed in a dedicated section with clear typography separated by a border, ensuring immediate visibility for coordinator contact. The system uses a two-endpoint architecture (/api/coordinator/transporters-portfolio for metadata + /api/coordinator/transporters/:id/photo for on-demand photos) with frontend caching and prefetching, reducing initial load time from 75+ seconds to <1 second. The card layout uses a mobile-first flex column design with natural viewport adaptation: fixed-height photo (h-40 on mobile, h-48 on desktop), a scrollable info section (flex-1 with overflow-y-auto), and integrated action buttons (Pass/Save) that remain visible across all screen sizes, including landscape and split-screen modes. This eliminates viewport calculation brittleness and ensures all critical information (name, city, rating, trips, phone, call button) remains accessible without content clipping. Coordinators can swipe right (save) or left (pass) on transporters, with city filtering to narrow searches. At the end of the stack, a comprehensive review list displays all saved transporters with actionable "Call" buttons (tel: links) for direct contact. The system queries only VALIDATED, ACTIVE, NON-BLOCKED transporters via GET /api/coordinator/transporters-portfolio?city=XXX endpoint.

**AI-Powered Price Estimation:** Integrates an AI-powered price estimation system using GPT-5 for the coordinator dashboard. This system considers empty returns (-60% discount) and groupage for small volumes, with conditional handling fees. It enforces a financial split (60% Transporter, 40% Platform with a minimum fee), includes an in-memory cache, rate limiting, and a heuristic fallback. The estimation provides a total client price, financial breakdown, confidence score, and reasoning.

### Technical Implementations
The backend is an Express.js and TypeScript application providing RESTful JSON APIs. Authentication is phone number-based with 6-digit PIN verification. User roles define access control. Real-time chat uses WebSockets, and an in-app notification system provides alerts. PostgreSQL (Neon Serverless) with Drizzle ORM is used for data storage. Key features include a multi-status client request progression, transporter offer workflow, advanced user management, multi-channel notifications, dynamic dashboards for Admin and Coordinators, public order sharing (WhatsApp integration), CamioMatch for intelligent transporter matching, and robust file management. Performance is optimized with pre-calculated offer counts, lazy loading, and optimized SQL queries, including universal pagination for the Admin Dashboard and N+1 query elimination for critical coordinator endpoints. Google Maps integration consistently displays Western Sahara as part of Morocco.

**Contract Generation & Payment Validation:** Contracts are automatically created during payment validation for both standard offer-based workflows and manual coordinator assignments. The system supports two workflows: (1) Standard: Request → Offers → Accepted Offer → Payment → Contract; (2) Manual Assignment: Request → Direct Coordinator Assignment → Payment → Contract. The `contracts.offerId` field is nullable to support manual assignments without offers, using `request.clientTotal` as the contract amount. An admin backfill endpoint (`/api/admin/backfill-contracts`) retroactively generates missing contracts for paid requests.

**Error Handling Improvements:** The frontend error handler properly extracts and displays JSON error messages from API responses, including detailed error messages (e.g., duplicate city names trigger "Cette ville existe déjà" instead of generic 500 errors). City creation includes name trimming and Postgres unique constraint detection (error code 23505).

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
- **@react-pdf/renderer**: Client-side PDF generation.