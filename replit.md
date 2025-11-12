# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application for the Moroccan market, connecting clients with independent transporters. It supports Client, Transporter, Administrator, and Coordinator roles, aiming to streamline logistics through request creation, service offers, and platform management. The platform's vision is to become a leading and efficient logistics solution in Morocco.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a mobile-first, dark teal design with full French/Arabic bilingual support, built with React 18, TypeScript, Vite, Wouter, TanStack Query, and Tailwind CSS. UI components leverage Shadcn/ui for aesthetics and Radix UI for accessibility, with React Hook Form and Zod for form management. Key UI elements include responsive role-based navigation, an animated truck header, Instagram-style stories, a modern role selection page, and an interactive calendar for transporters. The new request form features an interactive Google Maps visualization (InteractiveRouteMap component) showing departure/arrival cities with draggable markers (🚚 teal for departure, 📍 orange for arrival) and a route polyline with arrow, providing real-time geocoding and visual route preview. The map displays in a square format (aspect-square) and only appears after the user confirms both departure and arrival cities via autocomplete selection (not during typing), using confirmation flags tracked via GooglePlacesAutocomplete's placeDetails parameter. PWA enhancements provide offline support, advanced caching, and native-like push notifications. The platform implements comprehensive RTL support using CSS logical properties. Fully translated "How It Works" pages for both clients and transporters provide step-by-step guides and platform benefits in French and Arabic. Admin and Coordinator dashboards enforce French language and LTR layout regardless of user preference (via `useForceFrenchLayout` hook), with automatic restoration of user's chosen language when exiting these dashboards.

**Client Dashboard Simplified Workflow (Nov 2025):**
- Removed "À payer" tab - payment is now handled directly on request cards in the "Actives" tab
- Dynamic button display: "Offres reçues"/"Transporteurs intéressés" button shown before transporter selection, replaced by "Informations du transporteur" button (emerald gradient) after transporter is assigned or offer accepted (hasTransporter = true)
- Contact popup automatically displays transporter's phone number after selection, encouraging direct contact
- Two-tab layout: "Actives" and "Terminées" for streamlined navigation

**Coordinator Dashboard Complete Lifecycle (Nov 2025):**
- Full request lifecycle: Nouveau → Qualifiés → Intéressés → Production → **Pris en charge** → **Paiements** → Terminé
- **Archives tab removed**: Cancelled/archived requests no longer visible in coordinator views (admin-only)
- **New "Pris en charge" tab**: Tracks when transporters actually take charge of requests
  - Emerald-green gradient tab (from-emerald-600 via-green-600 to-teal-600) with Truck icon
  - Shows requests where `takenInChargeAt IS NOT NULL` AND `paymentStatus='a_facturer'`
  - Action buttons integrated into request cards (before Notes internes section): "Payer" (mark paid_by_client), "Requalifier" (send back to qualifiés), "Annuler" (cancel)
  - Hides "Transporteurs intéressés" section (via hideTransporterInterests option)
  - Backend: GET `/api/coordinator/coordination/pris-en-charge` filters unpaid requests only
  - Transition endpoint: PATCH `/api/coordinator/requests/:id/take-in-charge` records timestamp + coordinator ID
- **New "Paiements" tab**: Read-only view for coordinators (admin validates final payment)
  - Orange gradient tab (from-[#f59e0b] via-[#d97706] to-[#b45309]) with CreditCard icon
  - Shows requests where `paymentStatus='paid_by_client'` (client/coordinator already paid)
  - **Read-only cards** - no action buttons (financial security: admin-only CamionBack payment validation)
  - Backend: GET `/api/coordinator/payment-requests` retrieves client-paid requests with enriched data
  - **2-Step Payment Workflow**: ① Coordinator pays → disappears from "Pris en charge" → appears in "Paiements" (read-only) → ② Admin marks "Payé par CamionBack" → moves to admin "Contrats" view
- **Production tab updated**: Button changed from "Prise en charge / Payer" to just "Prise en charge" (moves request to next stage)
- **Coordinator Menu Simplified**: Removed "Tableau de bord" and "Gestions des Utilisateurs" - keeping only "Contact" option in header navigation
- Intelligent Sheet-based filter system that adapts to each tab (nouveau, qualifiés, intéressés, production, paiements, pris_en_charge)
- Filter state normalized per tab with persistent filters across tab switches
- Tab-specific filters: nouveau (Search, City, Date, Coordinator), qualifiés (Search, City, Date), intéressés (Search, City, Min Interested), production (Search, City, Payment Status, Date), paiements (Search, City, Date), pris_en_charge (Search, City, Payment Status, Date)
- Visual filter badge displays count of active (non-default) filters for immediate feedback
- Clean UI with single filter button (SlidersHorizontal icon) replacing old unified search bar
- Apply/Reset buttons for explicit filter management
- All coordinator queries exclude `status='cancelled'` and `coordinationStatus='archived'` requests

**Coordinator Request Cards - Unified Design (Nov 2025):**
- Redesigned to match transporter card layout for visual consistency across roles
- Card header now displays order number with Hash icon (gradient background) + animated green availability date capsule
- Description section features category icon with colored background from categoryConfig
- Expandable "Plus de détails" (More details) section with ChevronDown/ChevronUp icons
- Expanded details reveal quartiers (departure/arrival addresses) and handling/manutention information
- Expansion state managed via parent component's expandedDescriptions Record<string, boolean> to comply with React Hooks rules

**Header Logo Enhancements (Nov 2025):**
- Enhanced click feedback with hover:scale-105 and active:scale-95 transitions
- Shadow animations on hover for all user roles
- Improved visual responsiveness to user interactions

**Shared StatusIndicator Component (Nov 2025):**
- Centralized status badge component (`client/src/components/shared/status-indicator.tsx`) used across client and coordinator dashboards
- Displays status with Lucide icon, text, and processing state animations
- Processing states (`isProcessing: true`) feature emerald gradient (from-emerald-400 to-green-400) with spinning icon and pulse animation
- Completed/static states use teal gradient (from-[#1abc9c] to-[#16a085]) without animations
- Eliminates code duplication and ensures consistent status display styling
- Coordinator getClientStatus updated with `isProcessing` flags for workflow states: qualification, finalization, publication, offers received, transporter selection
- All emojis removed from status text per architecture rules, replaced with Lucide icon components

**AI-Powered Price Estimation with CamionBack Model (Nov 2025):**
- **Core Concept**: CamionBack uses empty returns (-60% vs traditional pricing) and groupage for small volumes
- Intelligent price estimation system using GPT-5 via Replit AI Integrations for coordinator dashboard
- Ultra-modern purple-pink-blue gradient "Estimer Prix" button with Sparkles icon
- Backend service (`server/price-estimation.ts`) with CamionBack-aware pricing prompt teaching GPT-5 about:
  - Empty returns advantage (retours à vide) = -60% discount
  - Groupage for small volumes (<5m³) = even lower costs
  - Traditional price calculation + automatic CamionBack discount application
  - **Conditional handling fees**: Manutention charges ONLY added if client explicitly requested (handlingRequired = true)
  - Handling details (floors, elevators) passed to GPT-5 for accurate pricing when applicable
- **Financial Split (server-enforced)**: 
  - Transporteur: 60% of total price
  - Cotisation plateforme: 40% of total price (minimum 200 MAD enforced via 500 MAD minimum total)
  - Helper function `computeCamionBackSplit()` ensures proper 60/40 split with platform fee ≥200 MAD
- 12-hour in-memory cache system to prevent duplicate AI calls (key: fromCity|toCity|distance|goodsType|description)
- Rate limiting: 10 estimations per minute per coordinator
- Heuristic fallback: traditional price ×0.4 with 60/40 split if GPT-5 fails (also respects handlingRequired flag)
- Response structure: {totalClientMAD, transporterFeeMAD, platformFeeMAD, confidence, reasoning, modeledInputs}
- Price clamping: min 500 MAD (enforced by split function), max 9000 MAD
- Premium dialog displaying: single CamionBack price, financial breakdown table (Total client, Frais transporteur 60%, Cotisation 40% min 200 MAD), confidence score, modeled inputs, reasoning explicitly mentioning empty returns + groupage concepts, and disclaimer
- GPT-5 reasoning model: Uses max_completion_tokens=8192 to accommodate internal reasoning tokens
- API endpoint: POST /api/coordinator/estimate-price (coordinator auth required)

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