# PriceRight - Project Structure

Complete folder tree and file organization for the PriceRight multi-tenant SaaS application.

```
priceright/
│
├── prisma/                             # Database schema and migrations
│   ├── schema.prisma                   # Prisma schema with all models
│   └── seed.ts                         # Database seeding script
│
├── src/                                # Source code
│   │
│   ├── app/                            # Next.js App Router
│   │   │
│   │   ├── api/                        # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/
│   │   │   │   │   └── route.ts        # NextAuth handler
│   │   │   │   └── signup/
│   │   │   │       └── route.ts        # User registration
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── route.ts            # List/create products
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts        # Get/update/delete product
│   │   │   │
│   │   │   ├── repricing/
│   │   │   │   └── recommendations/
│   │   │   │       └── route.ts        # Repricing recommendations
│   │   │   │
│   │   │   ├── brand-approval/
│   │   │   │   └── route.ts            # Brand approval requests
│   │   │   │
│   │   │   └── integrations/
│   │   │       └── route.ts            # Marketplace connections
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Dashboard page
│   │   │
│   │   ├── products/
│   │   │   └── page.tsx                # Products catalog page
│   │   │
│   │   ├── inventory/
│   │   │   └── page.tsx                # Inventory management page
│   │   │
│   │   ├── repricing/
│   │   │   └── page.tsx                # Repricing dashboard page
│   │   │
│   │   ├── brand-approval/
│   │   │   └── page.tsx                # Brand approval center page
│   │   │
│   │   ├── integrations/
│   │   │   └── page.tsx                # Marketplace integrations page
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx                # Settings page
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                # Login page
│   │   │
│   │   ├── signup/
│   │   │   └── page.tsx                # Signup page
│   │   │
│   │   ├── page.tsx                    # Root page (redirect)
│   │   ├── layout.tsx                  # Root layout
│   │   └── globals.css                 # Global styles (Tailwind)
│   │
│   ├── components/                     # React components
│   │   └── layout/
│   │       └── DashboardLayout.tsx     # Dashboard layout with sidebar
│   │
│   ├── lib/                            # Core libraries and utilities
│   │   │
│   │   ├── auth.ts                     # NextAuth configuration
│   │   ├── prisma.ts                   # Prisma client instance
│   │   ├── tenant.ts                   # Multi-tenancy utilities
│   │   │
│   │   ├── marketplaces/               # Marketplace integration layer
│   │   │   ├── types.ts                # Common types and interfaces
│   │   │   ├── base-adapter.ts         # Abstract base adapter class
│   │   │   ├── adapter-factory.ts      # Factory for creating adapters
│   │   │   ├── amazon-adapter.ts       # Amazon SP-API adapter
│   │   │   ├── walmart-adapter.ts      # Walmart Marketplace adapter
│   │   │   ├── shopify-adapter.ts      # Shopify Admin API adapter
│   │   │   ├── woocommerce-adapter.ts  # WooCommerce REST API adapter
│   │   │   ├── facebook-adapter.ts     # Facebook Commerce adapter
│   │   │   ├── tiktok-adapter.ts       # TikTok Shop adapter
│   │   │   ├── whatsapp-adapter.ts     # WhatsApp Business adapter
│   │   │   └── index.ts                # Export all adapters
│   │   │
│   │   └── services/                   # Business logic services
│   │       └── repricing-engine.ts     # AI/ML repricing engine
│   │
│   ├── jobs/                           # Background job system
│   │   ├── queue.ts                    # BullMQ queue configuration
│   │   └── worker.ts                   # Job workers (inventory, repricing, etc.)
│   │
│   ├── types/                          # TypeScript type definitions
│   │   └── next-auth.d.ts              # NextAuth type extensions
│   │
│   └── middleware.ts                   # Next.js middleware (auth, tenancy)
│
├── public/                             # Static assets
│   └── (images, fonts, etc.)
│
├── .env.example                        # Environment variables template
├── .env                                # Environment variables (gitignored)
├── .gitignore                          # Git ignore rules
├── .eslintrc.json                      # ESLint configuration
│
├── package.json                        # NPM dependencies and scripts
├── package-lock.json                   # Locked dependencies
│
├── tsconfig.json                       # TypeScript configuration
├── next.config.js                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── postcss.config.js                   # PostCSS configuration
│
├── ARCHITECTURE.md                     # System architecture documentation
├── README.md                           # Main documentation
├── PROJECT_STRUCTURE.md                # This file
│
└── (build artifacts - gitignored)
    ├── .next/                          # Next.js build output
    ├── node_modules/                   # NPM packages
    └── dist/                           # Compiled TypeScript
```

## Key Directories Explained

### `/prisma`
Contains database schema definition and migration files. The `schema.prisma` file defines all models with multi-tenancy support.

### `/src/app`
Next.js 14 App Router structure. All routes are file-system based:
- API routes in `/api/*`
- Pages in root or named directories
- `layout.tsx` for shared layouts

### `/src/components`
Reusable React components. Organized by feature:
- `/layout` - Layout components (sidebar, navbar, etc.)
- Future: `/ui`, `/forms`, `/tables` for UI primitives

### `/src/lib`
Core application libraries:
- **auth.ts**: NextAuth setup and configuration
- **prisma.ts**: Database client singleton
- **tenant.ts**: Multi-tenancy helpers (requireTenantId, etc.)
- **/marketplaces**: Marketplace integration layer with adapter pattern
- **/services**: Business logic (repricing, inventory, etc.)

### `/src/jobs`
Background job processing with BullMQ:
- **queue.ts**: Job queue setup and enqueue functions
- **worker.ts**: Worker processes that execute jobs

### `/src/types`
TypeScript type definitions and module augmentations

## File Naming Conventions

- **React Components**: PascalCase (e.g., `DashboardLayout.tsx`)
- **Utility Files**: camelCase (e.g., `auth.ts`, `prisma.ts`)
- **API Routes**: `route.ts` (Next.js App Router convention)
- **Pages**: `page.tsx` (Next.js App Router convention)
- **Type Definitions**: `.d.ts` extension (e.g., `next-auth.d.ts`)

## Import Aliases

The project uses `@/*` alias for cleaner imports:

```typescript
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/layout/DashboardLayout'
```

Configured in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

## Environment Files

- `.env.example` - Template with all required variables (committed)
- `.env` - Actual environment variables (gitignored, never commit)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production variables (gitignored)

## Generated Files (Not Committed)

- `node_modules/` - NPM packages
- `.next/` - Next.js build output
- `dist/` - Compiled TypeScript
- `.env` - Environment variables
- `*.tsbuildinfo` - TypeScript build cache

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
