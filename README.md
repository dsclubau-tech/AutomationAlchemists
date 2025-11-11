# Company Website - Full Stack Application

A modern, responsive company website built with React, TypeScript, Tailwind CSS, and powered by Lovable Cloud for backend functionality.

## Project Info

**URL**: https://lovable.dev/projects/55292bab-4282-4276-8bad-a85660b799a0

## Features

- 🎨 Modern, elegant design with dark/light mode
- 🔐 User authentication (sign up, sign in, sign out)
- 📊 Dynamic services page powered by database
- 📝 Contact form with database storage
- 📁 File upload functionality with cloud storage
- 🎭 Smooth animations with Framer Motion
- 📱 Fully responsive design
- ♿ Accessibility-focused with semantic HTML

## Tech Stack

### Frontend
- **React 18** - UI library with functional components and hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Framer Motion** - Animation library
- **React Router** - Client-side routing

### Backend (Lovable Cloud)
- **Authentication** - Email/password authentication
- **Database** - PostgreSQL with Row Level Security (RLS)
- **Storage** - Cloud file storage for uploads
- **Real-time** - Real-time database subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Lovable account (for backend features)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm i
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Variables

The following environment variables are automatically configured when using Lovable Cloud:

- `VITE_SUPABASE_URL` - Your backend project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Backend anonymous/public key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

**Note:** These variables are managed automatically by Lovable Cloud. You don't need to create or edit a `.env` file manually.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # Main navigation with auth
│   ├── Hero.tsx        # Hero section
│   ├── About.tsx       # About section
│   ├── Contact.tsx     # Contact info display
│   ├── ContactForm.tsx # Contact form with DB
│   ├── FileUpload.tsx  # File upload component
│   ├── Footer.tsx      # Footer component
│   └── ThemeToggle.tsx # Dark/light mode toggle
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Services.tsx    # Services page (full)
│   ├── Auth.tsx        # Authentication page
│   └── NotFound.tsx    # 404 page
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   ├── use-toast.ts    # Toast notifications
│   └── use-mobile.tsx  # Mobile detection
├── integrations/       # Backend integrations
│   └── supabase/       # Backend client (auto-generated)
├── lib/                # Utility functions
└── App.tsx            # Root component with routing
```

## Database Schema

### Tables

#### profiles
- `id` (uuid) - Primary key, references auth.users
- `full_name` (text) - User's full name
- `avatar_url` (text) - Profile picture URL
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### services
- `id` (uuid) - Primary key
- `title` (text) - Service name
- `description` (text) - Service description
- `icon` (text) - Icon identifier
- `features` (text[]) - Array of features
- `color_gradient` (text) - Tailwind gradient classes
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### contacts
- `id` (uuid) - Primary key
- `name` (text) - Contact name
- `email` (text) - Contact email
- `message` (text) - Contact message
- `user_id` (uuid) - Optional reference to auth.users
- `created_at` (timestamp)

### Storage Buckets

- **uploads** - Public bucket for user file uploads

## Features Documentation

### Authentication

The app includes a complete authentication system:
- Sign up with email and password
- Sign in for existing users
- Automatic profile creation on signup
- Sign out functionality
- Protected routes and conditional UI

**Usage:**
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, session, loading, signUp, signIn, signOut } = useAuth();
```

### Dynamic Services

Services are fetched from the database and displayed dynamically:
- Admin can manage services via database
- Real-time updates when services change
- Fallback to loading state

### Contact Form

Submit contact inquiries that are stored in the database:
- Form validation
- Automatic user association (if logged in)
- Success/error toast notifications

### File Upload

Upload files to cloud storage:
- Requires authentication
- Files organized by user ID
- Public access to uploaded files
- Returns public URL for sharing

## Deployment

### Deploy with Lovable

1. Click the **Publish** button in the Lovable editor (top right on desktop, bottom-right in Preview mode on mobile)
2. Your frontend changes will require clicking "Update" in the publish dialog
3. Backend changes (database, functions) deploy automatically

### Custom Domain

To connect a custom domain:
1. Go to Project > Settings > Domains in Lovable
2. Follow the instructions to configure your DNS
3. Note: Custom domains require a paid Lovable plan

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Development Guidelines

### Adding New Features

1. **Database Changes:** Use the migration tool in Lovable
2. **New Pages:** Add to `src/pages/` and update `src/App.tsx` routes
3. **UI Components:** Use shadcn/ui components from `src/components/ui/`
4. **Styling:** Use Tailwind CSS with semantic tokens from `index.css`

### Best Practices

- ✅ Use TypeScript for type safety
- ✅ Follow semantic HTML for accessibility
- ✅ Implement proper RLS policies for data security
- ✅ Use environment variables for sensitive data
- ✅ Test authentication flows thoroughly
- ✅ Validate user inputs both client and server-side

## Editing Your Code

There are several ways to edit your application:

### Use Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/55292bab-4282-4276-8bad-a85660b799a0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

### Use Your Preferred IDE

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Edit Files Directly in GitHub

- Navigate to the desired file(s)
- Click the "Edit" button (pencil icon) at the top right of the file view
- Make your changes and commit the changes

### Use GitHub Codespaces

- Navigate to the main page of your repository
- Click on the "Code" button (green button) near the top right
- Select the "Codespaces" tab
- Click on "New codespace" to launch a new Codespace environment
- Edit files directly within the Codespace and commit and push your changes once you're done

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for sensitive operations
- Input validation on all forms
- Secure file upload with user-specific folders
- HTTPS enforced in production

## Troubleshooting

### Can't see uploaded files
- Ensure the storage bucket is public (configured by default)
- Check RLS policies on storage.objects

### Authentication not working
- Verify email confirmation is disabled for development (auto-configured)
- Check that auth URLs are configured correctly in backend settings

### Services not loading
- Check browser console for errors
- Verify database connection
- Ensure RLS policies allow public read access to services table

## Support

For issues or questions:
- 📚 [Lovable Documentation](https://docs.lovable.dev/)
- 💬 [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- 📺 [YouTube Tutorials](https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO)

## License

This project is built with Lovable and is available for use under your chosen license.
