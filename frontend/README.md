# Sodak-Tech: Competitive Programming Platform

A modern, dark-themed competitive programming platform built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui.

## ✨ Features

### Core Functionality
- **Problem Browsing**: Browse and filter problems by difficulty, tags, and search
- **Code Editor**: CodeMirror 6 editor with syntax highlighting for multiple languages
- **Test Execution**: Run code against test cases with detailed result visualization
- **Solution Submission**: Submit solutions and track submission history
- **Contests**: Participate in timed programming contests
- **Leaderboard**: Global ranking system based on problems solved and rating

### User Features
- **User Profiles**: Detailed user statistics and achievement tracking
- **Submission History**: Track all past submissions with verdicts and runtime stats
- **Streak System**: Maintain coding streaks and track personal bests
- **Responsive Design**: Fully responsive on desktop and mobile devices

### Design
- **Dark Theme Only**: Professional dark interface optimized for extended coding sessions
- **Sodak Design System**: Custom color tokens and typography
- **Split Pane Editor**: Problem description and code editor side-by-side layout
- **Loading States**: Skeleton loaders for smooth perceived performance

## 🏗 Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui + custom components
- **Code Editor**: CodeMirror 6
- **Font**: Geist (display), Inter (body), JetBrains Mono (code)
- **Icons**: Lucide React

### Project Structure
```
app/
├── layout.tsx              # Root layout with fonts and metadata
├── page.tsx               # Redirect to dashboard
├── globals.css            # Design tokens and base styles
├── dashboard/             # Dashboard page
├── problems/              # Problems list and detail pages
├── contests/              # Contests listing
├── leaderboard/           # Global leaderboard
├── profile/               # User profile
└── settings/              # User settings

components/
├── layout/
│   ├── sidebar.tsx        # Navigation sidebar (collapsible)
│   ├── top-bar.tsx        # Search and user menu
│   ├── app-layout.tsx     # Main app wrapper
│   └── split-pane.tsx     # Draggable split layout
├── problem/
│   ├── problem-description.tsx
│   ├── problem-editorial.tsx
│   └── problem-submissions.tsx
├── editor/
│   ├── code-editor.tsx    # CodeMirror integration
│   └── results-panel.tsx  # Test results viewer
└── ui/
    ├── difficulty-badge.tsx
    ├── verdict-badge.tsx
    └── skeleton-loader.tsx

lib/
└── api/
    ├── types.ts           # TypeScript interfaces
    ├── client.ts          # Django API client
    ├── mock.ts            # Mock data layer
    └── index.ts           # API entry point
```

### Data Access Pattern
The app uses a unified API module (`lib/api/index.ts`) that switches between:
- **Mock API** (`lib/api/mock.ts`): For development - includes realistic sample data
- **Real API** (`lib/api/client.ts`): For production - calls Django backend

No component directly calls `fetch()`. All data access goes through the centralized API module.

## 🚀 Getting Started

### Development
```bash
# Install dependencies
pnpm install

# Start development server (uses mock data)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables
Create a `.env.local` file:

```env
# Enable mock data (development)
NEXT_PUBLIC_USE_MOCKS=true

# For production, set the Django API URL:
# NEXT_PUBLIC_DJANGO_API_URL=https://your-api.example.com/api
```

## 📋 API Integration

### Mock Data
During development, the app uses mock data stored in `lib/api/mock.ts`:
- 5 sample problems (easy, medium, hard)
- 2 sample contests
- Simulated user profile and leaderboard

The mock API includes realistic delays (200-1500ms) to simulate network latency.

### Backend Integration
To connect to a real Django backend:

1. Set `NEXT_PUBLIC_USE_MOCKS=false`
2. Set `NEXT_PUBLIC_DJANGO_API_URL` to your API endpoint
3. Ensure Django API implements the endpoints defined in `lib/api/client.ts`

Required API endpoints:
```
GET    /api/problems
GET    /api/problems/:id
POST   /api/problems/:id/run
GET    /api/problems/:id/editorial
POST   /api/submissions
GET    /api/submissions
GET    /api/submissions/:id
GET    /api/contests
GET    /api/contests/:id
GET    /api/users/:id
GET    /api/users/me
PATCH  /api/users/:id
GET    /api/leaderboard
```

## 🎨 Design System

### Colors (Sodak Tokens)
- **Primary Blue**: #2D5FFF (main CTA buttons)
- **Accent Orange**: #DF7412 (highlights, secondary actions)
- **Neutral Gray**: #131B2E - #EEF0FF (grays)
- **Surfaces**:
  - Base: #0B1326
  - Card: #171F33
  - Raised: #222A3D

### Typography
- **Headings**: Geist (600 weight)
- **Body**: Inter (400 weight)
- **Code**: JetBrains Mono (400 weight)

### Components
- **DifficultyBadge**: Color-coded by difficulty (easy=green, medium=orange, hard=red)
- **VerdictBadge**: Status badges with animated pulse for pending/running
- **Skeleton Loaders**: Animated pulse effect for loading states
- **Split Pane**: Draggable divider for editor/description layout

## ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Submit solution (in problem editor)
- **Tab**: Editor indentation (CodeMirror standard)
- **Ctrl/Cmd + /**: Toggle comment (CodeMirror standard)

## 📱 Responsive Design
- **Desktop**: Full layout with sidebar + content
- **Tablet**: Collapsible sidebar
- **Mobile**: Stacked layout with mobile-optimized navigation

## ✅ Key Features Implemented

### Phase 1: Design System ✓
- Tailwind v4 config with Sodak tokens
- Custom color system integrated
- Font imports (Geist, Inter, JetBrains Mono)
- CSS variables for semantic theming

### Phase 2: Data Layer ✓
- TypeScript types for all entities
- API client for Django backend
- Mock data layer with realistic data
- Unified API entry point

### Phase 3: App Shell ✓
- Collapsible sidebar with navigation
- Top bar with search and user menu
- App layout wrapper
- No horizontal scroll (responsive fix)

### Phase 4-5: Components ✓
- DifficultyBadge and VerdictBadge
- Skeleton loaders
- Split pane with draggable divider

### Phase 6: Problem Detail ✓
- Split layout (description + editor)
- Problem description with examples
- Editorial tab
- Submissions history table
- CodeMirror 6 editor
- Results panel with test case details
- Language selector

### Phase 7: Pages ✓
- Dashboard with stats and quick links
- Problems list with filters
- Contests page with status badges
- Leaderboard with rankings
- User profile with submission history
- Settings page

### Phase 8: Polish ✓
- Responsive design (mobile, tablet, desktop)
- Empty states and error handling
- Keyboard accessibility
- Focus rings on interactive elements
- Smooth transitions

## 🔧 Development Notes

### No TypeScript Errors
The entire project is configured with strict TypeScript mode enabled.

### No Horizontal Scroll
The layout uses flexbox and CSS grid - no content overflows the viewport width.

### Bundle Size Optimization
- CodeMirror 6 instead of Monaco Editor (smaller bundle)
- Lazy loading of heavy components
- CSS-in-JS minimized (Tailwind)

### Dark Mode Only
Light mode is intentionally removed. The app forces dark color scheme across all browsers.

## 🚢 Deployment

### Vercel (Recommended)
```bash
git push  # Automatically deploys from your connected repo
```

### Manual Deployment
```bash
pnpm build
pnpm start
```

Set environment variables in your hosting platform:
- `NEXT_PUBLIC_USE_MOCKS=false`
- `NEXT_PUBLIC_DJANGO_API_URL=<your-api-url>`

## 📝 Future Enhancements

- [ ] User authentication with Better Auth
- [ ] Real-time collaboration (WebSocket)
- [ ] Problem recommendations (ML)
- [ ] Advanced filtering and search
- [ ] Syntax error highlighting
- [ ] Code templates
- [ ] Language-specific optimizations
- [ ] Performance analytics

## 📄 License

MIT
