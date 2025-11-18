# PriceRight - High-Level Architecture

## Overview

PriceRight is a production-ready, multi-tenant SaaS application for e-commerce repricing across multiple marketplaces. Built with Next.js 14 (App Router), TypeScript, PostgreSQL, and Prisma ORM.

## Architecture Principles

### 1. Multi-Tenancy
- **Tenant Isolation**: All data is isolated by `tenantId` at the database level
- **Row-Level Security**: Every query is automatically scoped to the current tenant
- **Middleware Enforcement**: Authentication middleware extracts and validates tenant context
- **No Data Leakage**: Strict enforcement prevents cross-tenant access

### 2. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  (Next.js Pages, React Components, Tailwind UI)            │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Route Handlers)             │
│  /api/auth, /api/products, /api/repricing, etc.            │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                    │
│  Services: RepricingEngine, InventorySync, BrandApproval   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                        │
│  Marketplace Adapters (Amazon, Walmart, Facebook, etc.)    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  Prisma ORM + PostgreSQL                                   │
└─────────────────────────────────────────────────────────────┘
```

### 3. Marketplace Integration Pattern

All marketplace integrations follow the **Adapter Pattern**:

```typescript
interface MarketplaceAdapter {
  listProducts(): Promise<Product[]>
  updateProduct(product: Product): Promise<void>
  updateInventory(sku: string, quantity: number): Promise<void>
  fetchPricingData(sku: string): Promise<PricingSnapshot>
}
```

**Supported Marketplaces**:
- Amazon Marketplace
- Walmart Seller Marketplace
- Facebook Marketplace
- TikTok Seller Marketplace
- WhatsApp Business (Catalog API)
- Shopify (Store Integration)
- WooCommerce (REST API)

### 4. Data Flow

#### Product Listing Flow
```
User Creates Product → Save to DB → Background Job
  → Push to Connected Marketplaces → Update Listing Status
```

#### Inventory Sync Flow
```
Inventory Change → Trigger Sync Job → Update All Marketplaces
  → Poll Marketplaces (Periodic) → Reconcile Discrepancies
```

#### Repricing Flow
```
Scheduled Job → Fetch Competitor Prices → AI/ML Engine
  → Generate Recommendations → User Review → Apply Prices
  → Update Marketplaces → Log Price Changes
```

#### Brand Approval Flow
```
User Submits Request + Documents → Save to Storage
  → Track Status → Submit to Marketplaces → Update Status
```

## Core Components

### Authentication & Authorization
- **NextAuth.js** for authentication
- **Email/Password** + OAuth support
- **Role-Based Access Control (RBAC)**:
  - `owner`: Full tenant control
  - `admin`: Manage products, integrations, users
  - `member`: View and limited edit access

### Multi-Tenancy Middleware
```typescript
// Extracts tenantId from authenticated session
// Attaches to request context
// Validates access on every request
```

### Repricing Engine (AI/ML)
- **Input**: Current prices, competitor data, cost, margin rules
- **Processing**:
  - Statistical analysis (moving averages, trend detection)
  - Rule-based constraints (min margin, price floor/ceiling)
  - ML model interface (extensible for real models)
- **Output**: Recommended prices with confidence scores

### Background Job System
- **Queue**: BullMQ with Redis (or simple cron for MVP)
- **Job Types**:
  - `inventory-sync`: Sync inventory across marketplaces
  - `repricing-job`: Calculate and apply repricing recommendations
  - `marketplace-poll`: Poll for updates when webhooks unavailable
  - `brand-approval-submit`: Submit approval requests to marketplaces

### File Storage
- **Abstraction Layer**: Storage service interface
- **Implementation**: S3-compatible storage (AWS S3, Cloudflare R2, local for dev)
- **Security**: Signed URLs for document access, tenant-scoped paths

## Security & Privacy

### Tenant Isolation
- Every database query filtered by `tenantId`
- Middleware validates tenant access on every request
- Prisma middleware auto-injects tenant filter

### API Security
- All marketplace credentials encrypted at rest
- Environment variables for secrets
- No client-side exposure of API keys
- Parameterized queries (Prisma safeguards)

### File Access Control
- Uploaded documents only accessible to tenant users
- Signed URLs with expiration
- No public access without authentication

### RBAC Implementation
```typescript
// Enforced at API route level
// Checked before data operations
// Granular permissions per resource
```

## Database Schema Highlights

### Core Entities
- `Tenant`: Organization/merchant account
- `User`: Users belonging to tenants with roles
- `MarketplaceConnection`: Linked marketplace accounts
- `Product`: Master product catalog
- `ProductMarketplaceListing`: Product listings per marketplace
- `InventorySnapshot`: Historical inventory tracking
- `PriceSnapshot`: Historical pricing data
- `RepricingRule`: Per-product or global pricing rules
- `RepricingRecommendation`: AI-generated price recommendations
- `BrandApprovalRequest`: Brand approval submissions
- `BrandApprovalFile`: Uploaded documents (invoices, legal proof)

### Multi-Tenancy Pattern
```prisma
model Product {
  id        String   @id @default(cuid())
  tenantId  String   // Every tenant-owned table has this
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields

  @@index([tenantId]) // Performance optimization
}
```

## Deployment Architecture

### Serverless-Friendly Design
- Next.js API routes (edge-compatible where possible)
- Background jobs offloaded to queue workers
- Database connection pooling (Prisma Accelerate or PgBouncer)

### Recommended Stack
- **Hosting**: Vercel, AWS Amplify, or Railway
- **Database**: Managed PostgreSQL (Supabase, Neon, AWS RDS)
- **Queue/Jobs**: Upstash Redis + BullMQ, or Inngest
- **Storage**: AWS S3, Cloudflare R2, or Vercel Blob
- **Monitoring**: Sentry, LogRocket, or Vercel Analytics

## Scalability Considerations

### Database
- Indexed `tenantId` on all tenant tables
- Partitioning by tenant for very large deployments
- Read replicas for analytics queries

### API Layer
- Rate limiting per tenant
- Caching with Redis (marketplace data, pricing snapshots)
- CDN for static assets

### Background Jobs
- Horizontal scaling of worker processes
- Job prioritization (critical inventory syncs vs. periodic polls)
- Retry logic with exponential backoff

## Monitoring & Observability

### Metrics to Track
- API response times per endpoint
- Background job success/failure rates
- Marketplace integration health
- Tenant usage metrics (API calls, products, price updates)

### Logging
- Structured logging (JSON format)
- Per-tenant log filtering
- Error tracking with stack traces

### Alerting
- Failed marketplace syncs
- Repricing job failures
- Authentication anomalies
- High error rates

## Future Enhancements

1. **Real-Time Updates**: WebSocket support for live inventory/price updates
2. **Advanced ML**: Train custom models per tenant based on historical data
3. **Multi-Currency**: Support for international marketplaces
4. **Mobile App**: React Native companion app
5. **Advanced Analytics**: Revenue forecasting, profit optimization
6. **API for Integrations**: Public API for third-party integrations
7. **White-Label**: Custom branding per tenant

---

**Last Updated**: 2025-11-18
**Version**: 1.0.0
