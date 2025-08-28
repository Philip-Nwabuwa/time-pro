# TimePro - Professional Event Management Platform

A modern, responsive web application built with Next.js 15, TypeScript, and Tailwind CSS for professional event management.

## 🚀 Features

### Authentication System

- **Sign In/Sign Up**: Unified authentication forms with tab switching
- **Email Verification**: OTP-based email verification using Supabase
- **Protected Routes**: Dashboard access for authenticated users
- **Form Validation**: Required fields and terms agreement validation
- **Password Management**: Secure password handling with visibility toggle

### User Experience

- **Responsive Design**: Mobile-friendly layout with Tailwind CSS
- **Modern UI**: Clean, professional interface with TimePro branding
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Auto-focus**: Smart input navigation in OTP verification

### Technical Features

- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Supabase Integration**: Backend-as-a-Service for authentication
- **Component Library**: Custom UI components with shadcn/ui patterns
- **State Management**: React Context for authentication state

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React
- **Development**: Biome (linting & formatting)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Protected user dashboard
│   ├── signin/           # Sign in page
│   ├── signup/           # Sign up page
│   ├── verify-otp/       # OTP verification page
│   ├── demo-otp/         # Demo OTP verification (for testing)
│   └── layout.tsx        # Root layout with AuthProvider
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   │   ├── AuthForm.tsx  # Sign in/up form
│   │   └── OTPVerification.tsx # OTP verification screen
│   └── ui/               # Base UI components
│       ├── button.tsx    # Button component
│       ├── card.tsx      # Card components
│       └── input-otp.tsx # OTP input (shadcn/ui style)
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication state management
└── lib/                   # Utility functions
    ├── supabase.ts       # Supabase client configuration
    └── utils.ts          # Utility functions for components
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Run the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Authentication Setup

### 1. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Add them to your `.env.local` file

### 2. Enable Email Confirmation

1. Go to Authentication > Settings in Supabase dashboard
2. Enable "Email confirmations"
3. Add redirect URLs for your domain

### 3. Test the Flow

1. Visit `/signup` to create an account
2. Check your email for verification code
3. Enter the code at `/verify-otp`
4. Access your dashboard at `/dashboard`

## 🧪 Demo Mode

For testing without Supabase setup, use the demo OTP verification:

- **URL**: `/demo-otp`
- **Demo Code**: `123456`
- **Features**: All OTP functionality without backend

## 🎨 Customization

### Colors

The app uses a green color scheme (`#28A745`) that can be customized in:

- `src/components/ui/button.tsx`
- `src/components/ui/input-otp.tsx`
- Tailwind CSS classes throughout components

### Styling

- Modify component styles in the respective UI component files
- Update global styles in `src/app/globals.css`
- Customize Tailwind configuration in `tailwind.config.js`

## 📱 Pages

- **Homepage** (`/`): Landing page with authentication navigation
- **Sign In** (`/signin`): User authentication
- **Sign Up** (`/signup`): User registration
- **OTP Verification** (`/verify-otp`): Email verification
- **Dashboard** (`/dashboard`): Protected user area
- **Demo OTP** (`/demo-otp`): Testing OTP functionality

## 🔒 Security Features

- Password hashing via Supabase
- Email verification required for account activation
- Protected routes with authentication checks
- Secure token management
- HTTPS enforcement in production

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Other Platforms

1. Build the application: `pnpm build`
2. Start production server: `pnpm start`
3. Set environment variables in your hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the [AUTH_SETUP.md](AUTH_SETUP.md) for detailed setup instructions
2. Review Supabase documentation for authentication configuration
3. Open an issue in the GitHub repository

---

**TimePro** - Professional event management made simple! 🎉
