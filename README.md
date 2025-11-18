# PriceRight - Multi-Tenant E-Commerce Repricer

> AI-powered repricing platform for multi-channel e-commerce sellers

PriceRight is a production-ready, multi-tenant SaaS application that helps e-commerce sellers automatically optimize pricing across Amazon, Walmart, Shopify, WooCommerce, Facebook, TikTok, and WhatsApp marketplaces using AI/ML-driven recommendations.

## Features

### Core Functionality

- **Multi-Marketplace Integration**: Connect to 7+ marketplaces with a unified API
  - Amazon Marketplace (SP-API)
  - Walmart Seller Marketplace
  - Shopify Stores
  - WooCommerce Stores
  - Facebook Marketplace
  - TikTok Shop
  - WhatsApp Business Catalog

- **AI-Powered Repricing Engine**
  - Statistical analysis and trend detection
  - Competitive price tracking
  - Margin protection and constraints
  - Confidence scoring for recommendations
  - Extensible for ML model integration

- **Real-Time Inventory Sync**
  - Automatic inventory synchronization across all marketplaces
  - Background job processing with retry logic
  - Inventory snapshots and audit trail

- **One-Spot Brand Approval**
  - Centralized brand approval request submission
  - Document upload (invoices, trademarks, licenses)
  - Multi-marketplace application in single form
  - Status tracking and history

- **Multi-Tenancy & Security**
  - Complete tenant data isolation
  - Row-level security with tenantId filtering
  - Role-based access control (Owner, Admin, Member)
  - Secure credential storage

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Job Queue**: BullMQ with Redis
- **UI**: React, Tailwind CSS
- **Background Jobs**: Worker processes for async tasks

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design, data flow, and scalability considerations.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 6.x or higher (for job queue)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd priceright
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the following required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/priceright"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-a-random-secret>"  # Run: openssl rand -base64 32

# Redis (for job queue)
REDIS_URL="redis://localhost:6379"

# Add marketplace API credentials as needed
```

### 4. Database Setup

Run Prisma migrations to create the database schema:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Run migrations for production
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 6. Start Background Job Worker (in a separate terminal)

```bash
npm run jobs:dev
```

## Project Structure

```
priceright/
├── prisma/
│   └── schema.prisma              # Database schema with multi-tenancy
├── src/
│   ├── app/                       # Next.js app router pages
│   │   ├── api/                   # API route handlers
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── products/          # Product CRUD
│   │   │   ├── repricing/         # Repricing recommendations
│   │   │   ├── brand-approval/    # Brand approval requests
│   │   │   └── integrations/      # Marketplace connections
│   │   ├── dashboard/             # Dashboard page
│   │   ├── products/              # Products page
│   │   ├── repricing/             # Repricing dashboard
│   │   ├── brand-approval/        # Brand approval center
│   │   ├── integrations/          # Marketplace integrations
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Signup page
│   │   └── layout.tsx             # Root layout
│   ├── components/                # React components
│   │   └── layout/                # Layout components
│   ├── lib/                       # Core libraries
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── prisma.ts              # Prisma client
│   │   ├── tenant.ts              # Multi-tenancy utilities
│   │   ├── marketplaces/          # Marketplace adapters
│   │   │   ├── types.ts           # Common types
│   │   │   ├── base-adapter.ts    # Base adapter class
│   │   │   ├── adapter-factory.ts # Factory pattern
│   │   │   ├── amazon-adapter.ts
│   │   │   ├── walmart-adapter.ts
│   │   │   ├── shopify-adapter.ts
│   │   │   ├── woocommerce-adapter.ts
│   │   │   ├── facebook-adapter.ts
│   │   │   ├── tiktok-adapter.ts
│   │   │   └── whatsapp-adapter.ts
│   │   └── services/              # Business logic services
│   │       └── repricing-engine.ts
│   ├── jobs/                      # Background job system
│   │   ├── queue.ts               # Job queue configuration
│   │   └── worker.ts              # Job workers
│   └── types/                     # TypeScript types
│       └── next-auth.d.ts         # NextAuth type extensions
├── .env.example                   # Environment variables template
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── next.config.js                 # Next.js configuration
├── ARCHITECTURE.md                # Architecture documentation
└── README.md                      # This file
```

## Usage Guide

### Creating Your First Tenant

1. Navigate to http://localhost:3000/signup
2. Fill in company name, your name, email, and password
3. Click "Create account"
4. Sign in with your credentials

### Connecting a Marketplace

1. Go to **Integrations** from the sidebar
2. Click "Connect Marketplace"
3. Select the marketplace type (Amazon, Walmart, Shopify, etc.)
4. Enter API credentials/keys
5. Test connection and save

### Adding Products

1. Navigate to **Products**
2. Click "+ Add Product"
3. Fill in SKU, title, cost price, and other details
4. Save product
5. Product will sync to connected marketplaces via background jobs

### Managing Repricing

1. Go to **Repricing Dashboard**
2. Review AI-generated pricing recommendations
3. Each recommendation shows:
   - Current vs recommended price
   - Confidence score
   - Competitor analysis
   - Projected margin
4. Click "Accept" to apply recommendation or "Edit" to modify
5. Approved prices will be updated across marketplaces via job queue

### Brand Approval Requests

1. Navigate to **Brand Approval Center**
2. Enter brand name
3. Select target marketplaces
4. Upload supporting documents (invoices, trademarks, etc.)
5. Add notes and submit
6. Track status in the requests table

## Multi-Tenancy

PriceRight implements strict multi-tenancy:

- Every tenant has isolated data (products, connections, users)
- `tenantId` is automatically added to all queries via utilities
- Middleware validates tenant context on every request
- No data leakage between tenants

### User Roles

- **Owner**: Full control over tenant, users, and all resources
- **Admin**: Manage products, integrations, pricing rules
- **Member**: View-only access with limited editing

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new tenant and user
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Products
- `GET /api/products` - List products (tenant-scoped)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Repricing
- `GET /api/repricing/recommendations` - Get recommendations
- `POST /api/repricing/recommendations` - Accept recommendation

### Brand Approval
- `GET /api/brand-approval` - List requests
- `POST /api/brand-approval` - Create request

### Integrations
- `GET /api/integrations` - List marketplace connections
- `POST /api/integrations` - Create connection

## Background Jobs

The system uses BullMQ for background processing:

### Job Types

- **Inventory Sync**: Syncs product inventory across marketplaces
- **Repricing Calculation**: Generates AI pricing recommendations
- **Price Update**: Updates prices on marketplaces
- **Marketplace Poll**: Fetches updates from marketplaces
- **Product Sync**: Syncs product data to marketplaces

### Running Workers

```bash
npm run jobs:dev
```

Workers automatically process jobs with retry logic and exponential backoff.

## Development

### Database Migrations

```bash
# Create a migration
npx prisma migrate dev --name description_of_change

# Apply migrations
npm run db:migrate

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

View and edit database data with Prisma Studio:

```bash
npm run db:studio
```

### Linting

```bash
npm run lint
```

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
DATABASE_URL="postgresql://..."      # Production PostgreSQL
REDIS_URL="redis://..."              # Production Redis
NEXTAUTH_SECRET="<strong-secret>"    # Strong random secret
NEXTAUTH_URL="https://yourdomain.com"

# Marketplace API credentials
AMAZON_CLIENT_ID="..."
WALMART_CLIENT_ID="..."
# ... etc
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Recommended Hosting

- **Application**: Vercel, AWS Amplify, Railway
- **Database**: Supabase, Neon, AWS RDS (PostgreSQL)
- **Redis**: Upstash, Redis Cloud, AWS ElastiCache
- **Storage**: AWS S3, Cloudflare R2, Vercel Blob

## Security Considerations

### Production Checklist

- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS
- [ ] Rotate NEXTAUTH_SECRET regularly
- [ ] Encrypt marketplace credentials at rest
- [ ] Implement rate limiting
- [ ] Enable CORS restrictions
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Database connection pooling
- [ ] Backup strategy for database

### Marketplace Credentials

- Never commit `.env` files
- Use encrypted storage for API keys (consider AWS Secrets Manager or HashiCorp Vault)
- Implement credential rotation policies
- Use least-privilege API permissions

## Testing

### Manual Testing

1. Create a test tenant account
2. Connect marketplace in sandbox/test mode
3. Add test products
4. Verify repricing recommendations
5. Test inventory sync

### Future: Automated Tests

(To be implemented)
```bash
npm test
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Expected: PONG
```

### Marketplace API Errors

- Verify API credentials are correct
- Check rate limits and quotas
- Review marketplace API documentation
- Check adapter logs for detailed errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: support@priceright.com
- Documentation: [docs-url]

---

**Built with ❤️ for e-commerce sellers worldwide**
