# 🌍 B2B Travel Portal API

A comprehensive B2B travel booking platform built with NestJS, PostgreSQL, and Prisma.

## ✨ Features

- 🔐 **JWT Authentication** - Secure agent authentication with role-based access
- 👥 **Agent Management** - Multi-agent system with sub-users and permissions
- 💰 **Wallet System** - Virtual wallet with credit management
- ✈️🏨 **Booking System** - Flight and hotel booking management
- 🛡️ **Admin Panel** - Comprehensive admin dashboard
- 📊 **Reports** - Detailed financial and booking reports
- 🏷️ **Markup Configuration** - Flexible pricing rules
- 🔔 **Notifications** - In-app notification system
- 📝 **Audit Logging** - Complete audit trail
- 📘 **Swagger Documentation** - Interactive API docs at `/api/docs`

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: class-validator & class-transformer
- **API Docs**: Swagger/OpenAPI
- **Auth**: JWT + Passport

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL database (Railway recommended)
- npm or yarn

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/bittusunil/happytrip-b2b.git
cd happytrip-b2b

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your DATABASE_URL to .env

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run start:dev
```

Visit **http://localhost:3000/api/docs** for interactive API documentation.

## 📁 Project Structure

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication
│   ├── agents/          # Agent management
│   ├── bookings/        # Booking management
│   ├── wallets/         # Wallet system
│   ├── admin/           # Admin panel
│   ├── reports/         # Reports
│   ├── markups/         # Pricing
│   ├── notifications/   # Notifications
│   └── audit/           # Audit logs
├── common/              # Shared utilities
├── config/              # Configuration
└── prisma/              # Prisma service
```

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="*"
```

## 📚 API Documentation

Once the server is running, visit:
- **API Docs**: http://localhost:3000/api/docs
- **API**: http://localhost:3000/api

See [SWAGGER-API-DOCS.md](SWAGGER-API-DOCS.md) for detailed usage guide.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Run production server
npm run start:prod
```

### Railway Deployment

1. Push code to GitHub
2. Go to [Railway.app](https://railway.app)
3. Deploy from GitHub repo
4. Add PostgreSQL plugin
5. Add environment variables
6. Deploy!

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new agent
- `POST /api/auth/login` - Agent login
- `GET /api/auth/profile` - Get current profile
- `PATCH /api/auth/change-password` - Change password

### Agents
- `GET /api/agents/dashboard` - Get agent dashboard
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id/status` - Update agent status
- `PATCH /api/agents/:id/credit` - Update credit limit

### Wallets
- `GET /api/wallets` - Get wallet details
- `GET /api/wallets/transactions` - Get transaction history
- `POST /api/wallets/add-funds` - Add funds to wallet

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/activity` - Recent activity

## 📝 License

MIT

---

Built with ❤️ using [NestJS](https://nestjs.com/)
