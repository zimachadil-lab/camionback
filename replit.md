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
**Client Request Workflow:** Requests progress through 'Open', 'Accepted', and 'Completed' statuses. Clients can accept offers, mark requests as complete, and republish requests, which resets their status and deletes previous offers. When a client accepts an offer, a confirmation dialog displays the transporter's contact information and the total amount to pay (commission is included but not displayed separately to the client).
**Payment Workflow:** A comprehensive payment flow includes statuses: 'pending' (initial), 'awaiting_payment' (transporter marks for billing), 'pending_admin_validation' (client uploads receipt), and 'paid' (admin validates payment). This involves interactions across Transporter, Client, and Admin dashboards, with receipt upload functionality (JPEG, PNG, WebP; max 5MB) and admin validation.

### Transporter Offers System
Transporters submit offers with three mandatory fields: amount (price), pickup date (when they can collect the load), and load type (either "Retour" for empty return trips or "Groupage / Partagé" for shared/grouped loads). The offer form uses a calendar date picker for pickup dates and radio buttons for load type selection. Client dashboards display offers with formatted pickup dates and load type badges. Clients can accept or decline offers: accepting triggers commission calculation and notifications, while declining marks the offer as "rejected" and notifies the transporter. The decline button uses a destructive red variant for clear visual distinction. The admin dashboard includes a dedicated "Offres transporteurs" tab showing all offers system-wide with full details (order reference, client, transporter, dates, prices, load type, and status). Administrators can accept offers on behalf of clients, triggering the same workflow as client acceptance (commission calculation, status updates, notifications). The API endpoint GET /api/offers returns all offers when called without filters (for admin use) or filtered results when called with requestId or transporterId parameters. The POST /api/offers/:id/decline endpoint handles offer rejection, updating the offer status to "rejected" and creating a notification for the transporter.

### Transporter Rating System
Clients can rate transporters (1-5 stars) upon request completion. The system calculates and updates average ratings, total ratings, and total completed trips for transporters. Ratings are displayed on offer cards with decimal precision.

### Contract Management System
An automated contract generation and tracking system creates contracts when offers are accepted (by client or admin). Each contract stores requestId, offerId, clientId, transporterId, referenceId, amount, and status. Contract statuses include: 'in_progress' (initial), 'marked_paid_transporter' (transporter billing), 'marked_paid_client' (client receipt uploaded), and 'completed' (admin validated). The admin dashboard features a dedicated "Contrats" tab with comprehensive contract listing (reference, parties, dates, amounts, statuses), a detailed contract view dialog with full information display and manual status update capability, and KPI cards showing total contracts with breakdowns of active and completed contracts. Contract statuses automatically update based on payment workflow actions: transporter marking for billing updates to 'marked_paid_transporter', client uploading receipt updates to 'marked_paid_client', and admin validating payment updates to 'completed'. The system includes error handling to prevent payment workflow disruptions if contract updates fail.

### Centralized Admin Messaging System
A comprehensive messaging monitoring and intervention system allows administrators to oversee and participate in all client-transporter conversations. The chat messages schema includes a `senderType` field (client/transporter/admin) to distinguish message origins. The admin dashboard features a dedicated "Messages" tab displaying all conversations grouped by request with detailed metadata (reference, client name, transporter name, last message date, total message count, and message preview). Administrators can view complete conversation threads in a dialog with color-coded message bubbles (blue for clients, green for transporters, orange for admin messages). The system supports direct admin intervention, allowing admins to send messages as "Admin CamionBack" within any conversation. Conversations can be deleted with confirmation, removing all associated messages. Backend API routes include GET /api/admin/conversations for retrieving all grouped conversations and DELETE /api/chat/conversation/:requestId for conversation deletion. The storage layer implements `getAdminConversations` and `deleteMessagesByRequestId` methods to support these operations. All interactive elements include `data-testid` attributes for comprehensive testing coverage.

### Dynamic Admin Dashboard Statistics
A comprehensive real-time statistics system provides administrators with complete platform oversight. The backend API `/api/admin/stats` calculates 15+ metrics including active users (clients and transporters) with monthly percentage trends, conversion rates, average transporter ratings, order processing times, republished orders, and pending payments. The dashboard displays four main KPI cards at the top (active clients, active transporters, total requests, total commissions), each showing current values and monthly evolution indicators (up/down arrows with percentages). A dedicated "Statistiques" tab presents detailed insights: conversion rate (accepted offers / total offers), completion rate, average transporter satisfaction rating, average processing time in days, average order amount, and pending payments total. The "Transporteurs" tab via the `/api/admin/transporters` endpoint displays all validated transporters with comprehensive statistics: name, city, phone number, average rating with total ratings count, total completed trips, total earned commissions, and last activity date. All data is dynamically calculated on-demand from the database, ensuring real-time accuracy without mocked or static values.

### Automatic Client Identification System
An automatic unique client identification system assigns each client a sequential ID in the format C-XXXX (e.g., C-0001, C-0002) upon role selection during registration. The `clientId` field is stored in the users table with a UNIQUE constraint and auto-generated via the `getNextClientId()` storage method, which finds the highest existing client number and increments it. Client IDs are displayed in the client interface header/burger menu instead of the generic "Utilisateur" label, providing personalized identification. The admin dashboard features a dedicated "Clients" tab accessible via the `/api/admin/clients` endpoint, displaying comprehensive client statistics including: client ID, name (or "Non renseigné"), phone number, total orders count, completed orders count, average satisfaction rating (calculated from ratings given by the client), and registration date. The Clients view includes search functionality by client ID, name, or phone number, with real-time filtering and responsive table display. All interactive elements maintain `data-testid` attributes for testing coverage.

### User Account Management System
A comprehensive account management system allows administrators to control user access through blocking/unblocking functionality. The users table includes an `accountStatus` field (active/blocked) with "active" as the default. Admin dashboard views for both Transporters and Clients display Status columns with color-coded badges (green for Active, red for Blocked) and action buttons to Block or Unblock users. Blocked users receive automatic notifications and are prevented from logging in, with login attempts returning clear error messages. The blocking API endpoint (POST /api/admin/block-user/:userId) creates notifications and updates user status, while the unblocking endpoint (POST /api/admin/unblock-user/:userId) restores access. The system includes comprehensive error handling and cache invalidation for real-time updates across the admin interface.

### Reporting and Dispute System
A complete signalement (reporting) system enables clients and transporters to report issues on completed orders. The reports table stores comprehensive information including requestId, reporterId, reporterRole, reportedUserId, type, description, status (pending/resolved/rejected), resolution, and timestamps. Only users involved in completed transactions (status="completed" or paymentStatus="paid") can create reports. Client dashboards display a "Signaler un problème" button on completed orders, opening a dialog with type selection (no-show, payment issues, communication problems, incorrect information, damaged goods, other) and detailed description field. Transporter dashboards feature a "Signaler un client" button with the same functionality. The admin dashboard includes a dedicated "Signalements" tab displaying all reports with full details: creation date, order reference, report type with badges, reporter information with role badges, reported user details with phone numbers, description, and current status. Administrators can Resolve reports (marking them as handled), Reject reports (dismissing them), or directly Block the reported user from the reports interface. Report status updates trigger automatic notifications and cache invalidation. The API includes POST /api/reports for creating reports and PATCH /api/reports/:id for status updates with resolution notes. All interactive elements include comprehensive data-testid attributes for testing coverage.

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