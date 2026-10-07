# Tovo TV-OS

A modern TV operating system platform with a private streaming proxy pipeline. Built with React, TypeScript, Express, and PostgreSQL.

## Features

- **Streaming Proxy Pipeline**: Route streaming requests through configurable providers
- **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui components
- **Type-Safe API**: Express server with TypeScript, Zod validation, and OpenAPI specifications
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Developer Experience**: Full monorepo with pnpm workspaces, comprehensive tooling, and type safety

## Project Structure

This is a pnpm monorepo with the following packages:

```
.
├── artifacts/
│   ├── api-server/        # Express API backend
│   ├── tovo-tv-os/        # React frontend app
│   └── mockup-sandbox/    # UI component sandbox
├── lib/
│   ├── api-spec/          # OpenAPI specification & Orval codegen
│   ├── api-client-react/  # Generated React API client
│   ├── api-zod/           # Generated Zod schemas
│   └── db/                # Drizzle ORM database schema
└── scripts/               # Build and utility scripts
```

## Prerequisites

- **Node.js**: 20.x or later
- **pnpm**: 9.x or later
- **PostgreSQL**: 14+ (for database)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Tovo-TV-OS.git
cd Tovo-TV-OS
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Create .env file in root
DATABASE_URL="postgresql://user:password@localhost:5432/tovo_db"
NODE_ENV="development"
PORT=5000
```

## Running the Project

### Development

Start the API server:
```bash
pnpm --filter @workspace/api-server run dev
```

In another terminal, start the frontend:
```bash
pnpm --filter @workspace/tovo-tv-os run dev
```

### Production Build

```bash
pnpm run build
```

## Scripts

- `pnpm run build` - Full typecheck and build all packages
- `pnpm run typecheck` - Type-check all packages
- `pnpm --filter @workspace/api-server run dev` - Run API server in development
- `pnpm --filter @workspace/tovo-tv-os run dev` - Run frontend in development
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API types from OpenAPI spec
- `pnpm --filter @workspace/db run push` - Push database schema changes (dev only)

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching and caching
- **Zod** - Runtime validation
- **Lucide React** - Icons

### Backend
- **Express 5** - Web server framework
- **TypeScript 5.9** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Object-relational mapping
- **Zod** - Schema validation
- **Pino** - Logging

### Developer Tools
- **pnpm** - Package manager
- **TypeScript** - Language and type checker
- **Prettier** - Code formatter
- **esbuild** - JavaScript bundler
- **Orval** - OpenAPI code generator

## Known Issues & Workarounds

### Port Configuration
- Frontend connects to API at `http://localhost:3000/api/route-stream`
- API server should run on port 3000 (for production) or 5000 (for development)
- Adjust `PORT` environment variable accordingly

### Database Setup
- Ensure PostgreSQL is running and accessible
- Set `DATABASE_URL` environment variable before running database migrations
- Run `pnpm --filter @workspace/db run push` to apply schema changes

## API Endpoints

### Health Check
```
GET /api/healthz
```

### Stream Routing
```
GET /api/route-stream?provider=vidsrc&id=272
```

Supported providers:
- `vidsrc` - VidSrc provider
- `embedcc` - Embed.cc provider
- `embedsu` - Embed.su provider

## Architecture Decisions

1. **Monorepo Structure**: Using pnpm workspaces for better code organization and dependency management
2. **API Specification First**: OpenAPI spec drives the API client and schema generation via Orval
3. **Type Safety**: TypeScript throughout with Zod runtime validation for API contracts
4. **Database Migrations**: Drizzle ORM with SQL-first approach for schema management
5. **Component Isolation**: Mockup sandbox for UI component development separate from main app

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Testing

Run type checks before committing:
```bash
pnpm run typecheck
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- 📋 Open an issue on GitHub
- 💬 Discussions section for feature requests
- 📧 Email: support@example.com

## Troubleshooting

### Build Errors
```bash
# Clear all caches and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### API Connection Issues
- Verify API server is running on the correct port
- Check `DATABASE_URL` is properly set
- Ensure CORS is enabled in development

### TypeScript Errors
```bash
# Rebuild TypeScript cache
pnpm run typecheck
```

## Roadmap

- [ ] User authentication system
- [ ] Advanced provider configuration
- [ ] Stream history and favorites
- [ ] Multi-language support
- [ ] Mobile-responsive design improvements
- [ ] Dark/light theme toggle
- [ ] Search and discovery features

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

---

Made with ❤️ by the Tovo team
