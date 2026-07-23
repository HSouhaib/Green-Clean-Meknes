# Green Clean Meknes

A full-stack web platform for the **Green Clean Meknes** community environmental campaign in Meknes, Morocco. It connects volunteers, showcases cleanup campaigns, and gives admins the tools to manage content, attendance, and volunteer recognition.

## Live Demo

Deployment URL: *coming soon*

Repository: `https://github.com/HSouhaib/Green-Clean-Meknes`

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing:** React Router v7 (code-split pages)
- **Backend:** Hono 4 + tRPC 11 + better-sqlite3 (SQLite)
- **ORM:** Drizzle ORM
- **Auth:** Google OAuth 2.0 (PKCE) with JWT session cookies; dev-login bypass for local development
- **State / Data:** TanStack Query + tRPC React Query
- **Maps:** Leaflet + React-Leaflet
- **QR Scanning:** html5-qrcode
- **2FA:** otpauth
- **Testing:** Vitest
- **Tooling:** ESLint 9, Prettier, TypeScript

## Features

### Public site

- Multilingual support (English, French, Arabic) with full RTL layout
- Animated hero section with day/night ambience
- Dynamic leaderboard with configurable points (registration, attendance, waste per kg) and period filters
- Campaign listings with interactive map, countdown timer, and multi-image galleries
- Campaign detail modal with registration / unregister, share buttons, and image carousel
- Guest volunteer registration portal
- Before & after photo gallery
- Community voices: testimonials, polls, FAQ, sponsors, partners, and social feed
- Air quality data integration (Open-Meteo)
- Skeleton loading state for the landing page
- Responsive mobile-first design with navigation, language switcher, and theme toggle

### Admin dashboard

- Role-based access control (`super_admin`, `admin`, custom roles with granular permissions)
- Admin tabs: Dashboard, Landing Page, Campaigns, Presence, Photos, Sponsors, Social Feed, Users, Volunteers, Leaderboard, Polls, Testimonials, FAQs, Contacts, Neighborhoods, Plans, Site Settings, Sections
- Campaign CRUD including multi-image gallery and impact stats
- Presence check with QR badge scanning and manual mark present/absent
- Dynamic leaderboard points system (points per registration, attendance, and waste kg)
- Manual points awarding to volunteers
- Section visibility and ordering controls
- Site settings and stat overrides
- Activity audit log

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_SECRET` | Production | JWT signing secret (random 32+ character string) |
| `DATABASE_URL` | Yes | SQLite database file path, e.g. `local.db` |
| `GOOGLE_CLIENT_ID` | For OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For OAuth | Google OAuth client secret |
| `OWNER_UNION_ID` | No | Google `sub` ID auto-promoted to `super_admin` on login |
| `CORS_ORIGIN` | No | Comma-separated allowed CORS origins for production |

In development, you can use `auth.devLogin` / `auth.devLoginUser` tRPC mutations to bypass Google OAuth.

### Development

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:3000` and mounts the Hono API automatically.

### Build & Start

```bash
npm run build
npm run start
```

### Database

```bash
npm run db:migrate
npm run db:seed
```

### Tests

```bash
npm run test
```

### Lint, Format & Type Check

```bash
npm run lint
npm run check
npm run format
```

## Project Structure

```
├── api/            # Backend Hono + tRPC routers and helpers
├── contracts/      # Shared types, constants, and errors
├── db/             # Drizzle schema, SQL migrations, and seed data
├── src/            # React frontend (pages, sections, components, hooks)
├── public/         # Static assets and uploaded images
└── dist/           # Production build output
```

## Key Conventions

- Frontend never imports from `api/`; backend never imports from `src/`. Shared code lives in `contracts/`.
- Use path aliases: `@/` for `src/`, `@contracts/` for `contracts/`, `@db/` for `db/`.
- User-facing strings are translated via `useLanguage()` with keys for EN, FR, and AR.
- Mutations show toast notifications and invalidate related React Query caches.
- New backend routes include Vitest tests and use Zod + sanitizers for input validation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is built for the Green Clean Meknes community initiative.

---

Built with 💚 for a cleaner, greener Meknes.
