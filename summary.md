# Website Build Summary

## Overview
A modern, responsive corporate website built with a "Necromancer/Dark Magic" aesthetic, featuring pixel-art styling and robust backend integration.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Routing**: React Router

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Email/password auth
- **Storage**: Cloud file storage for uploads
- **Real-time**: Live database subscriptions

## Design & Theme

### Typography
- **Primary Font**: `'Press Start 2P', monospace` (Retro pixel style)
- **Heading/Accent Font**: `'Bungee Shade', cursive` (For impactful headers)

### Color Palette ("Necromancer Theme")
- **Primary Colors**:
  - `evil-green` (#0F0)
  - `toxic-green` (#7FFF00)
  - `dark-purple` (#4B0082)
- **Backgrounds**:
  - Dark Mode: Deep black (#0A0A0A)
  - Light Mode: Very light gray/white (#FAFAFA)
- **Accents**:
  - `poison-green` (#39FF14)
  - `bone-white` (#F5F5DC)

### Visual Style
- **Aesthetic**: Retro 16-bit pixel art meets modern web design.
- **Effects**:
  - `image-rendering: pixelated` globally applied.
  - Custom text strokes and shadows for "glitch" or "magic" effects.
  - Glassmorphism and gradient text overlays.

## Key Features

### 1. User Authentication
- Secure Sign Up, Sign In, and Sign Out functionality.
- Protected routes requiring authentication.
- Automatic profile creation upon registration.

### 2. Dynamic Content
- **Services Page**: Services are fetched dynamically from the database, allowing for real-time updates without code changes.
- **Database Schema**: Structured tables for `profiles`, `services`, and `contacts`.

### 3. Interactive Forms
- **Contact Form**: Integrated with the database to store inquiries.
- **File Uploads**: Secure cloud storage for user documents/files with public link generation.

### 4. Responsive Layout
- Fully responsive design adapting to mobile, tablet, and desktop screens.
- Mobile-first approach with a collapsible navigation menu.

### 5. Security
- **Row Level Security (RLS)**: Enforced on all database tables to ensure users only access authorized data.
- **Secure Storage**: User-specific storage buckets for file uploads.
