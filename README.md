# AgroIntel - Full-Stack TypeScript Project

A full-stack TypeScript application with React + Vite frontend and Express + Prisma backend.

## Project Structure

```
AgroIntel/
├── frontend/          # React + TypeScript + Vite + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── lib/
│   │       └── utils.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
└── backend/           # Node.js + Express + TypeScript + Prisma + SQLite
    ├── src/
    │   └── index.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── prisma.config.ts
    ├── tsconfig.json
    ├── .env
    └── package.json
```

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite plugin)
- **UI Components**: shadcn/ui
- **Port**: 5173 (default Vite port)

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: Prisma v7
- **Database**: SQLite
- **Port**: 3000

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. The database is already initialized with Prisma migrations. If you need to reset:
   ```bash
   npx prisma migrate reset
   npx prisma generate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at: `http://localhost:3000`

## Available Scripts

### Frontend (`/frontend`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend (`/backend`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run compiled JavaScript (production)

## API Endpoints

The backend currently has the following endpoints:

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Database

The project uses SQLite with Prisma ORM. The database file is located at `backend/dev.db`.

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Environment Variables

### Backend (`/backend/.env`)
```
DATABASE_URL="file:./dev.db"
PORT=3000
```

## Database Schema

The current schema includes a sample `User` model:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

You can modify this schema in `backend/prisma/schema.prisma` to fit your needs.

## Development Workflow

1. **Start both servers** (in separate terminals):
   ```bash
   # Terminal 1 - Frontend
   cd frontend && npm run dev
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

2. **Make changes** to your code - both servers support hot reload

3. **Add shadcn/ui components** (frontend):
   ```bash
   cd frontend
   npx shadcn@latest add button
   ```

4. **Update database schema** (backend):
   - Edit `backend/prisma/schema.prisma`
   - Run `npx prisma migrate dev --name your_migration_name`
   - Run `npx prisma generate`

## Next Steps

- Add authentication (JWT, OAuth, etc.)
- Create API routes for CRUD operations
- Build frontend components with shadcn/ui
- Connect frontend to backend API
- Add form validation (React Hook Form + Zod)
- Implement state management (Zustand, Redux, etc.)
- Add testing (Vitest, Jest, React Testing Library)

## Notes

- The `@tailwind` warnings in `frontend/src/index.css` are expected - they're PostCSS directives processed by Tailwind
- Both servers are configured for development with hot reload
- The SQLite database is stored locally in `backend/dev.db`
- Prisma Client is automatically generated in `node_modules/@prisma/client`

## License

ISC
