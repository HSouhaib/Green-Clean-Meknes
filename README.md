# Green Clean Meknes

A full-stack web platform for the **Green Clean Meknes** community environmental campaign in Meknes, Morocco. The app connects volunteers, showcases cleanup campaigns, and provides an admin dashboard for managing content across the site.

## Live Demo

Visit the deployed application at: `https://github.com/HSouhaib/Green-Clean-Meknes`

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Hono + tRPC + better-sqlite3 (SQLite)
- **Auth:** Google OAuth 2.0 (PKCE) with JWT session cookies
- **ORM:** Drizzle ORM
- **Testing:** Vitest
- **Tooling:** ESLint, Prettier, TypeScript

## Features

- Multilingual support (English, French, Arabic) with RTL layout
- Animated hero section with day/night ambience and interactive squirrel mascot
- Campaign listings with map integration and registration
- Community voices section (gallery, partners, social feed, testimonials, polls, FAQ)
- Admin dashboard with role-based access control
- Volunteer self-registration
- Air quality data integration (Open-Meteo)
- Responsive mobile-first design with polished navigation and mobile menu

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables for production:

- `APP_SECRET`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Development

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:3000` and mounts the Hono API automatically.

### Build

```bash
npm run build
npm run start
```

### Database

```bash
npm run db:migrate
npx tsx db/seed.ts
```

### Tests

```bash
npm run test
```

### Lint & Type Check

```bash
npm run lint
npm run check
```

## Project Structure

```
├── api/            # Backend Hono + tRPC routers
├── contracts/      # Shared types and constants
├── db/             # Drizzle schema, migrations, and seed
├── src/            # React frontend
└── public/         # Static assets
```

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
