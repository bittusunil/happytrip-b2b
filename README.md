# 🌍 B2B Travel Portal API

A comprehensive B2B travel booking platform built with NestJS, PostgreSQL, and Prisma.

## 🚀 Features

- **Authentication & Authorization** - JWT-based authentication with role-based access control
- **Agent Management** - Multi-agent system with sub-users and permissions
- **Wallet System** - Virtual wallet with credit management and transaction tracking
- **Booking System** - Flight and hotel booking management
- **Admin Panel** - Comprehensive admin dashboard with analytics
- **Reporting** - Detailed financial and booking reports
- **Markup Configuration** - Flexible pricing and markup rules
- **Notifications** - In-app notification system
- **Audit Logging** - Complete audit trail for all actions

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **ORM**: [Prisma](https://www.prisma.io/) - Type-safe ORM
- **Database**: PostgreSQL - Can be self-hosted or use Railway
- **Validation**: class-validator & class-transformer
- **API Docs**: Swagger/OpenAPI
- **Authentication**: JWT + Passport

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL database
- npm or yarn

## 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/your-org/happytrip-b2b.git
cd happytrip-b2b

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/happytrip_b2b?schema=public"

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run start:dev
```

## 🌐 API Documentation

Once the server is running, visit:

- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api

## 📁 Project Structure

```
src/
├── modules/              # Feature modules
│   ├── auth/            # Authentication & authorization
│   ├── agents/          # Agent management
│   ├── bookings/        # Booking management
│   ├── wallets/         # Wallet & transactions
│   ├── admin/           # Admin panel
│   ├── reports/         # Reports & analytics
│   ├── markups/         # Pricing & markups
│   ├── notifications/   # Notifications
│   └── audit/           # Audit logging
├── common/              # Shared utilities
│   ├── decorators/      # Custom decorators
│   ├── guards/          # Auth guards
│   ├── filters/         # Exception filters
│   └── dto/             # Shared DTOs
├── config/              # Configuration
├── prisma/              # Prisma service
├── app.module.ts        # Root module
└── main.ts              # Entry point
prisma/
└── schema.prisma        # Database schema
```

## 🔐 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Application
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="*"
```

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

## 📚 API Endpoints

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

### Wallets
- `GET /api/wallets` - Get wallet details
- `GET /api/wallets/transactions` - Get transaction history
- `POST /api/wallets/add-funds` - Add funds to wallet

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/activity` - Recent activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- HappyTrip B2B Team

---

Built with ❤️ using NestJS
