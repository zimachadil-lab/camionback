# CamionBack - Logistics Marketplace Platform

## Overview
CamionBack is a full-stack logistics marketplace web application designed for the Moroccan market. It connects clients requiring transportation services (e.g., furniture, freight) with independent transporters. The platform supports three user roles: Clients, Transporters, and Administrators, enabling clients to create transportation requests, transporters to offer services, and administrators to manage and validate platform activities. Key features include a mobile-first design, a dark teal theme, a French language interface, and phone-based PIN authentication. The project aims to streamline logistics operations and create a robust, user-friendly platform for the Moroccan transport sector.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18, TypeScript, Vite, Wouter for routing, TanStack Query for server state management, and Tailwind CSS for styling. It utilizes Shadcn/ui for components, Radix UI for accessibility, and React Hook Form with Zod for form handling. The design is mobile-first, featuring a dark theme with a dark teal palette and a French language interface.

### Backend
The backend uses Express.js with TypeScript, ES Modules, and `tsx` for development. It provides RESTful API endpoints in JSON format, employs session-based authentication, and uses Multer for multipart form data handling (5MB limit). The architecture emphasizes separation of concerns with an abstraction layer for storage.

### Data Storage
PostgreSQL, configured for Neon serverless, is used as the primary database, with Drizzle ORM for type-safe queries and migrations. The schema supports multi-role users, detailed transport requests, offers, notifications, and chat messages.

### Authentication & Authorization
Authentication is phone number-based using 6-digit PIN verification with bcrypt hashing, supporting Moroccan phone formats. User registration allows selection of Client or Transporter roles, with Transporters requiring admin validation before full access. Session persistence is managed via localStorage with role and status-based access control. A user data refresh system ensures timely updates, especially for transporter validation status.

### Real-time Features
Real-time chat is implemented via WebSockets (`/ws-chat`) for direct communication between clients and transporters, including message filtering. An in-app notification system provides alerts for offer events, payment workflow updates, and new chat messages, with a badge counter and dedicated notification page.

### Request and Payment Workflow
**Client Request Workflow:** Requests progress through 'Open', 'Accepted', and 'Completed' statuses. Clients can accept offers, mark requests as complete, and republish requests, which resets their status and deletes previous offers.
**Payment Workflow:** A comprehensive payment flow includes statuses: 'pending' (initial), 'awaiting_payment' (transporter marks for billing), 'pending_admin_validation' (client uploads receipt), and 'paid' (admin validates payment). This involves interactions across Transporter, Client, and Admin dashboards, with receipt upload functionality (JPEG, PNG, WebP; max 5MB) and admin validation.

### Transporter Offers System
Transporters submit offers with three mandatory fields: amount (price), pickup date (when they can collect the load), and load type (either "Retour" for empty return trips or "Groupage / Partagé" for shared/grouped loads). The offer form uses a calendar date picker for pickup dates and radio buttons for load type selection. Client dashboards display offers with formatted pickup dates and load type badges. The admin dashboard includes a dedicated "Offres transporteurs" tab showing all offers system-wide with full details (order reference, client, transporter, dates, prices, load type, and status). Administrators can accept offers on behalf of clients, triggering the same workflow as client acceptance (commission calculation, status updates, notifications). The API endpoint GET /api/offers returns all offers when called without filters (for admin use) or filtered results when called with requestId or transporterId parameters.

### Transporter Rating System
Clients can rate transporters (1-5 stars) upon request completion. The system calculates and updates average ratings, total ratings, and total completed trips for transporters. Ratings are displayed on offer cards with decimal precision.

### Mobile Responsive Design
The platform features a mobile-first design with responsive adaptations using Tailwind CSS breakpoints (primarily `sm` at 640px). This includes dynamic sizing for popups and dialogs, adaptive button layouts and text, and optimized photo galleries for various screen sizes.

### File Upload
Base64 encoding is used for client-uploaded request photos, stored as text in the database and displayed via a PhotoGalleryDialog. Transporter truck photos are handled via Multer middleware with in-memory storage.

## External Dependencies

### UI/Styling
- **Radix UI**: Headless, accessible component primitives.
- **Shadcn/ui**: Pre-built, Tailwind-styled components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.

### Backend Services
- **Twilio API**: For SMS OTP delivery.
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