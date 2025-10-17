# CamionBack Design Guidelines

## Design Approach
**Reference-Based Approach**: Modern logistics/marketplace platforms with focus on mobile-first design, optimized for Moroccan market with French language interface.

## Core Design Principles
- **Mobile-First**: Prioritize mobile experience, then scale to desktop
- **Clarity & Speed**: Simple, fast interface for quick decision-making
- **Trust & Transparency**: Visual elements that build confidence (ratings, photos, clear pricing)
- **Moroccan Market Optimization**: French language, local user patterns, phone-first approach

## Color Palette

### Primary Colors
**Dark Teal Theme:**
- Primary Background: `#0a2540` (deep teal, almost navy)
- Secondary Background: `#163049` (lighter teal for cards/sections)
- Card Backgrounds: Slightly lighter variation or white/light gray for contrast

**Supporting Colors:**
- Text Primary: White or very light gray on dark backgrounds
- Text Secondary: Muted gray for less important info
- Success/Accepted: Green tones for confirmed offers
- Warning/Pending: Amber/yellow for pending actions
- Error/Rejected: Red tones for rejected states
- Accent: Bright teal or turquoise for CTAs and interactive elements

### Dark Mode Implementation
Consistent dark theme throughout with dark teal as foundation. Light text on dark backgrounds with sufficient contrast for readability.

## Typography

### Font Selection
- Primary: Modern sans-serif (Inter, Poppins, or similar)
- Large readable fonts as specified
- Clear hierarchy between headings and body text

### Font Sizes & Weights
- **Headings**: Bold (600-700 weight), larger sizes (2xl-4xl)
- **Body Text**: Regular (400 weight), comfortable reading size (base-lg)
- **Labels**: Medium (500 weight), slightly smaller
- **Button Text**: Semi-bold (600 weight), medium size

## Layout System

### Spacing
Use consistent Tailwind spacing: primarily p-4, p-6, p-8 for padding; gap-4, gap-6 for grids. Generous whitespace for mobile readability.

### Grid & Structure
- **Mobile**: Single column, full-width cards with margin
- **Tablet**: 2-column grids where appropriate
- **Desktop**: Maximum 3-column grids for offers/requests listings

## Component Library

### Cards
- **Rounded corners**: Always use rounded-lg or rounded-xl
- **Minimal style**: Clean cards with subtle shadows
- **Background**: Light cards on dark teal background for contrast
- **Padding**: Generous internal padding (p-4 to p-6)

### Navigation
- **Mobile**: Bottom tab navigation or hamburger menu
- **Dashboard**: Side navigation on desktop, collapsible
- **Top Bar**: Logo, user profile, notifications

### Buttons
**Primary Buttons** (French labels):
- "Nouvelle demande" - Create new request
- "Choisir cette offre" - Accept offer
- "Envoyer un message" - Send message
- **Style**: Bright accent color, rounded, medium-large size
- **States**: Clear hover/active states

**Secondary Buttons**: Outline style with accent border

### Forms
- **Input Fields**: Light backgrounds, rounded corners
- **Labels**: Clear, above inputs
- **Phone Input**: Special formatting for Moroccan numbers (+212)
- **OTP Input**: Large, clear digit boxes
- **File Upload**: Drag-drop area with preview for truck photos

### Data Display
- **Request Cards**: Show origin → destination, date, goods type, budget
- **Offer Cards**: Driver photo/truck photo, price, ranking stars, CTA
- **Order IDs**: Prominent display in format "CMD-2025-00145"
- **Rankings**: Star icons (⭐) with count/rating number

### Chat Interface
- **Bubble Design**: Different colors for client/driver messages
- **Timestamp**: Small, subtle
- **Filtered Content**: Show [Filtered] for removed phone numbers/links
- **Real-time Updates**: Smooth message appearance

### Photo Display
- **Truck Photos**: Prominent, rounded corners, 16:9 or 4:3 ratio
- **Goods Photos**: Grid or carousel for multiple images
- **Profile Pictures**: Circular, medium size
- **Preview Thumbnails**: Clickable to expand

### Admin Dashboard
- **KPI Cards**: Large numbers, colored backgrounds, icons
- **Tables**: Sortable, filterable, clear row separation
- **Action Buttons**: Validate/Reject with distinct colors
- **Stats Charts**: Simple bar/line charts for trends

## Animations
**Minimal & Purposeful:**
- Smooth transitions on navigation
- Subtle hover effects on cards/buttons
- Loading states for async operations
- **No**: Excessive animations that slow down the interface

## Images
**No large hero images** - this is a functional marketplace app, not a marketing site. Images used strategically:
- Truck/vehicle photos in offer cards
- Goods photos in request cards
- Small profile/avatar images
- Icons for actions and categories
- **Placement**: Within cards, never as full-screen heroes

## Accessibility
- High contrast text on dark backgrounds
- Touch-friendly button sizes (min 44px height)
- Clear focus states for keyboard navigation
- Alt text for all images
- Error messages in French, clear and actionable

## French Language UI Elements
- "Nouvelle demande" (New request)
- "Mes offres" (My offers)
- "Choisir cette offre" (Choose this offer)
- "Envoyer un message" (Send message)
- "En attente" (Pending)
- "Acceptée" (Accepted)
- "Complétée" (Completed)
- "Transporteur" (Transporter)
- "Client" (Client)

## Responsive Breakpoints
- **Mobile**: < 768px (primary design target)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px