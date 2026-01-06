# NestJS B2B Travel Portal Setup Guide

## Tech Stack

- **Framework**: NestJS (Node.js TypeScript framework)
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma (Type-safe ORM)
- **Validation**: class-validator
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI

---

## Project Structure

```
happytrip-b2b/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── agents/
│   │   │   ├── agents.module.ts
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   └── dto/
│   │   ├── bookings/
│   │   │   ├── bookings.module.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   └── dto/
│   │   ├── wallets/
│   │   │   ├── wallets.module.ts
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.service.ts
│   │   │   └── dto/
│   │   ├── admin/
│   │   │   ├── admin.module.ts
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   └── common/
│   │       ├── decorators/
│   │       ├── filters/
│   │       ├── interceptors/
│   │       └── pipes/
│   ├── config/
│   │   ├── configuration.ts
│   │   └── validation.schema.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/
├── .env
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── package.json
└── README.md
```

---

## Step 1: Initialize NestJS Project

```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new project
nest new happytrip-b2b

# Select package manager: npm
# Choose description: B2B Travel Portal

cd happytrip-b2b

# Install additional dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install class-validator class-transformer
npm install bcrypt
npm install prisma @prisma/client

# Install dev dependencies
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local
```

---

## Step 2: Configure Prisma

### 2.1 Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file
```

### 2.2 Update .env File

```bash
# .env

# Railway PostgreSQL Connection
# Replace with your Railway PostgreSQL URL
DATABASE_URL="postgresql://postgres:password@your-host.railway.app:5432/railway?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Application Config
PORT=3000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3001"
```

### 2.3 Create Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum AgentStatus {
  Pending
  Active
  Inactive
  Suspended
  Blocked
}

enum VerificationStatus {
  Unverified
  Submitted
  UnderReview
  Verified
  Rejected
}

enum BusinessType {
  OTA
  TravelAgency
  Corporate
  Individual
}

enum BookingStatus {
  Pending
  Confirmed
  Processing
  Failed
  Cancelled
  Refunded
}

enum PaymentStatus {
  Pending
  Partial
  Completed
  Failed
  Refunded
}

enum BookingType {
  Flight
  Hotel
  FlightPlusHotel
}

enum TransactionType {
  Credit
  Debit
  CreditAdjustment
  DebitAdjustment
  Refund
}

enum TransactionCategory {
  Recharge
  Booking
  Cancellation
  Refund
  Commission
  Adjustment
  Fee
  CreditUsed
  CreditRepayment
}

enum WalletStatus {
  Active
  Frozen
  Blocked
}

// ============================================
// MODELS
// ============================================

model Agent {
  id                 String             @id @default(uuid()) @db.Uuid
  agencyName         String
  agencyCode         String             @unique
  businessType       BusinessType
  contactPersonName  String
  email              String             @unique
  phone              String
  alternatePhone     String?
  website            String?
  addressLine1       String
  addressLine2       String?
  city               String
  state              String?
  country            String
  postalCode         String
  businessRegNumber  String?
  taxId              String?
  panNumber          String?
  passwordHash       String
  emailVerified      Boolean            @default(false)
  phoneVerified      Boolean            @default(false)
  verificationToken  String?
  resetPasswordToken String?
  resetPasswordExpires DateTime?
  status             AgentStatus        @default(Pending)
  verificationStatus VerificationStatus @default(Unverified)
  walletBalance      Decimal            @default(0) @db.Decimal(15, 2)
  creditLimit        Decimal            @default(0) @db.Decimal(15, 2)
  availableCredit    Decimal            @default(0) @db.Decimal(15, 2)
  commissionRate     Decimal            @default(0) @db.Decimal(5, 2)
  useCustomMarkup    Boolean            @default(false)
  permissions        Json?
  lastLoginAt        DateTime?
  deletedAt          DateTime?
  createdBy          String?
  updatedBy          String?
  notes              String?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  // Relations
  users              AgentUser[]
  bookings           Booking[]
  wallet             Wallet?
  agentMarkups       AgentMarkup[]
  walletTransactions WalletTransaction[]
  creditTransactions CreditTransaction[]
  payments           Payment[]
  bookingReports     BookingReport[]
  financialStatements FinancialStatement[]

  @@index([email])
  @@index([agencyCode])
  @@index([status])
  @@index([verificationStatus])
  @@index([createdAt])
  @@map("agents")
}

model AgentUser {
  id             String    @id @default(uuid()) @db.Uuid
  agentId        String    @db.Uuid
  firstName      String
  lastName       String
  email          String
  username       String    @unique
  passwordHash   String
  profileImage   String?
  role           UserRole  @default(Staff)
  permissions    Json?
  status         UserStatus @default(Active)
  emailVerified  Boolean   @default(false)
  lastLoginAt    DateTime?
  deletedAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  agent          Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  bookings       Booking[]

  @@unique([agentId, email])
  @@index([agentId])
  @@index([email])
  @@index([status])
  @@map("agent_users")
}

enum UserRole {
  Owner
  Admin
  Manager
  Staff
}

enum UserStatus {
  Active
  Inactive
  Suspended
}

model AdminRole {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  code        String   @unique
  description String?
  permissions Json
  level       Int      @default(99)
  status      Status   @default(Active)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  adminUsers  AdminUser[]

  @@index([status])
  @@map("admin_roles")
}

enum Status {
  Active
  Inactive
}

model AdminUser {
  id                String    @id @default(uuid()) @db.Uuid
  firstName         String
  lastName          String
  email             String    @unique
  phone             String?
  username          String    @unique
  passwordHash      String
  profileImage      String?
  roleId            String    @db.Uuid
  permissions       Json?
  status            UserStatus @default(Active)
  emailVerified     Boolean   @default(true)
  resetPasswordToken String?
  resetPasswordExpires DateTime?
  lastLoginAt       DateTime?
  deletedAt         DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  role              AdminRole @relation(fields: [roleId], references: [id])

  @@index([email])
  @@index([roleId])
  @@index([status])
  @@map("admin_users")
}

model Booking {
  id                        String        @id @default(uuid()) @db.Uuid
  bookingReference          String        @unique
  agentId                   String        @db.Uuid
  bookedByUserId            String?       @db.Uuid
  bookingType               BookingType
  supplierName              String?
  supplierBookingReference  String?
  supplierConfirmationCode  String?
  customerTitle             CustomerTitle
  customerFirstName         String
  customerLastName          String
  customerEmail             String
  customerPhone             String
  baseFare                  Decimal       @db.Decimal(15, 2)
  taxesAndFees              Decimal       @db.Decimal(15, 2)
  supplierCost              Decimal       @db.Decimal(15, 2)
  markupType                MarkupType
  markupValue               Decimal       @db.Decimal(15, 2)
  markupAmount              Decimal       @db.Decimal(15, 2)
  commissionRate            Decimal       @default(0) @db.Decimal(5, 2)
  commissionAmount          Decimal       @default(0) @db.Decimal(15, 2)
  totalAmount               Decimal       @db.Decimal(15, 2)
  currency                  String        @default("INR")
  paymentStatus             PaymentStatus @default(Pending)
  paymentMethod             PaymentMethod
  paymentGatewayTxnId       String?
  bookingStatus             BookingStatus @default(Pending)
  confirmationSent          Boolean       @default(false)
  ticketed                  Boolean       @default(false)
  ticketNumber              String?
  confirmedAt               DateTime?
  cancelledAt               DateTime?
  completedAt               DateTime?
  failureReason             String?
  failureCode               String?
  cancellationReason        String?
  cancellationCharges       Decimal       @default(0) @db.Decimal(15, 2)
  refundAmount              Decimal       @default(0) @db.Decimal(15, 2)
  ipAddress                 String?
  userAgent                 String?
  notes                     String?
  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt

  // Relations
  agent              Agent            @relation(fields: [agentId], references: [id])
  bookedByUser       AgentUser?       @relation(fields: [bookedByUserId], references: [id])
  flightBookings     FlightBooking[]
  hotelBookings      HotelBooking[]
  walletTransactions WalletTransaction[]
  creditTransactions CreditTransaction[]
  payments           Payment[]

  @@index([agentId])
  @@index([bookingReference])
  @@index([bookingStatus])
  @@index([paymentStatus])
  @@index([createdAt])
  @@map("bookings")
}

enum CustomerTitle {
  Mr
  Mrs
  Ms
  Dr
}

enum MarkupType {
  Percentage
  Fixed
}

enum PaymentMethod {
  Wallet
  Credit
  PaymentGateway
  Mixed
}

model FlightBooking {
  id                  String       @id @default(uuid()) @db.Uuid
  bookingId           String       @db.Uuid
  airlineCode         String
  airlineName         String
  flightNumber        String
  originAirportCode   String
  originAirportName   String
  originCity          String
  originCountry       String
  destAirportCode     String
  destAirportName     String
  destCity            String
  destCountry         String
  departureDate       DateTime
  departureTime       DateTime
  arrivalDate         DateTime
  arrivalTime         DateTime
  cabinClass          CabinClass
  mealPreference      String?
  seatNumber          String?
  baseFare            Decimal      @db.Decimal(15, 2)
  taxes               Decimal      @db.Decimal(15, 2)
  fareType            String?
  pnr                 String
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  booking             Booking      @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  passengers          FlightPassenger[]

  @@index([bookingId])
  @@index([departureDate])
  @@index([flightNumber])
  @@map("flight_bookings")
}

enum CabinClass {
  Economy
  PremiumEconomy
  Business
  First
}

model FlightPassenger {
  id                    String             @id @default(uuid()) @db.Uuid
  flightBookingId       String             @db.Uuid
  title                 PassengerTitle
  firstName             String
  lastName              String
  dateOfBirth           DateTime
  gender                Gender
  passportNumber        String?
  passportExpiry        DateTime?
  nationalId            String?
  email                 String?
  phone                 String?
  passengerType         PassengerType
  frequentFlyerAirline  String?
  frequentFlyerNumber   String?
  mealPreference        String?
  specialRequests       String?
  wheelchairRequired    Boolean            @default(false)
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  flightBooking         FlightBooking      @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)

  @@index([flightBookingId])
  @@map("flight_passengers")
}

enum PassengerTitle {
  Mr
  Mrs
  Ms
  Dr
  Mstr
  Inf
}

enum Gender {
  Male
  Female
  Other
}

enum PassengerType {
  Adult
  Child
  Infant
}

model HotelBooking {
  id                        String           @id @default(uuid()) @db.Uuid
  bookingId                 String           @db.Uuid
  hotelId                   String
  hotelName                 String
  hotelChain                String?
  starRating                Int
  addressLine1              String
  addressLine2              String?
  city                      String
  state                     String?
  country                   String
  postalCode                String?
  latitude                  Decimal?         @db.Decimal(10, 8)
  longitude                 Decimal?         @db.Decimal(11, 8)
  roomType                  String
  roomTypeCode              String?
  numberOfRooms             Int
  numberOfAdults            Int
  numberOfChildren          Int              @default(0)
  childAges                 Json?
  checkInDate               DateTime
  checkOutDate              DateTime
  numberOfNights            Int
  mealPlan                  MealPlan         @default(RoomOnly)
  amenities                 Json?
  roomRatePerNight          Decimal          @db.Decimal(15, 2)
  taxAndServiceCharge       Decimal          @db.Decimal(15, 2)
  supplierConfirmationNumber String?
  checkinInstructions       String?
  freeCancellationBefore    DateTime?
  cancellationPolicy        String?
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt

  // Relations
  booking                   Booking          @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([checkInDate])
  @@index([hotelName])
  @@map("hotel_bookings")
}

enum MealPlan {
  RoomOnly
  Breakfast
  HalfBoard
  FullBoard
  AllInclusive
}

model Wallet {
  id                     String        @id @default(uuid()) @db.Uuid
  agentId                String        @unique @db.Uuid
  currentBalance         Decimal       @default(0) @db.Decimal(15, 2)
  blockedBalance         Decimal       @default(0) @db.Decimal(15, 2)
  availableBalance       Decimal       @default(0) @db.Decimal(15, 2)
  creditLimit            Decimal       @default(0) @db.Decimal(15, 2)
  usedCredit             Decimal       @default(0) @db.Decimal(15, 2)
  availableCredit        Decimal       @default(0) @db.Decimal(15, 2)
  status                 WalletStatus  @default(Active)
  isCreditEnabled        Boolean       @default(false)
  creditApproved         Boolean       @default(false)
  creditApprovedBy       String?       @db.Uuid
  creditApprovedAt       DateTime?
  autoRechargeEnabled    Boolean       @default(false)
  autoRechargeThreshold  Decimal       @default(5000) @db.Decimal(15, 2)
  autoRechargeAmount     Decimal       @default(10000) @db.Decimal(15, 2)
  allowOverdraft         Boolean       @default(false)
  overdraftLimit         Decimal       @default(0) @db.Decimal(15, 2)
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  // Relations
  agent                  Agent         @relation(fields: [agentId], references: [id])
  transactions           WalletTransaction[]

  @@index([agentId])
  @@index([status])
  @@map("wallets")
}

model WalletTransaction {
  id                    String             @id @default(uuid()) @db.Uuid
  walletId              String             @db.Uuid
  agentId               String             @db.Uuid
  bookingId             String?            @db.Uuid
  transactionReference  String             @unique
  transactionType       TransactionType
  transactionCategory   TransactionCategory
  amount                Decimal            @db.Decimal(15, 2)
  openingBalance        Decimal            @db.Decimal(15, 2)
  closingBalance        Decimal            @db.Decimal(15, 2)
  paymentMethod         String?
  paymentGateway        String?
  gatewayTransactionId  String?
  bankName              String?
  accountNumber         String?
  transactionRefNumber  String?
  utrNumber             String?
  status                TransactionStatus  @default(Pending)
  requiresApproval      Boolean            @default(false)
  approvedBy            String?            @db.Uuid
  approvedAt            DateTime?
  rejectionReason       String?
  receiptUrl            String?
  invoiceNumber         String?
  ipAddress             String?
  notes                 String?
  attachments           Json?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  completedAt           DateTime?

  // Relations
  wallet                Wallet             @relation(fields: [walletId], references: [id])
  agent                 Agent              @relation(fields: [agentId], references: [id])
  booking               Booking?           @relation(fields: [bookingId], references: [id])
  payments              Payment[]

  @@index([walletId])
  @@index([agentId])
  @@index([transactionReference])
  @@index([transactionType])
  @@index([status])
  @@index([createdAt])
  @@map("wallet_transactions")
}

enum TransactionStatus {
  Pending
  Completed
  Failed
  Cancelled
}

model CreditTransaction {
  id                    String             @id @default(uuid()) @db.Uuid
  agentId               String             @db.Uuid
  bookingId             String?            @db.Uuid
  transactionReference  String             @unique
  transactionType       CreditTransactionType
  amount                Decimal            @db.Decimal(15, 2)
  openingCredit         Decimal            @db.Decimal(15, 2)
  closingCredit         Decimal            @db.Decimal(15, 2)
  oldCreditLimit        Decimal?           @db.Decimal(15, 2)
  newCreditLimit        Decimal?           @db.Decimal(15, 2)
  status                TransactionStatus  @default(Pending)
  approvedBy            String?            @db.Uuid
  approvedAt            DateTime?
  validTill             DateTime?
  notes                 String?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  agent                 Agent              @relation(fields: [agentId], references: [id])
  booking               Booking?           @relation(fields: [bookingId], references: [id])

  @@index([agentId])
  @@index([transactionReference])
  @@index([status])
  @@index([createdAt])
  @@map("credit_transactions")
}

enum CreditTransactionType {
  CreditUsed
  CreditRepayment
  CreditLimitChange
}

model Payment {
  id                    String              @id @default(uuid()) @db.Uuid
  bookingId             String?             @db.Uuid
  walletTransactionId   String?             @db.Uuid
  agentId               String              @db.Uuid
  paymentReference      String              @unique
  paymentType           PaymentType
  amount                Decimal             @db.Decimal(15, 2)
  currency              String              @default("INR")
  paymentMethod         String              @db.VarChar(50)
  paymentGateway        PaymentGateway
  gatewayOrderId        String?
  gatewayPaymentId      String?
  gatewayTransactionId  String?
  cardLast4Digits       String?
  cardHolderName        String?
  cardType              String?
  bankName              String?
  bankTransactionId     String?
  status                PaymentGatewayStatus @default(Initiated)
  gatewayResponse       Json?
  failureReason         String?
  refundAmount          Decimal             @default(0) @db.Decimal(15, 2)
  refundReference       String?
  refundStatus          RefundStatus        @default(None)
  ipAddress             String?
  userAgent             String?
  deviceInfo            Json?
  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt
  completedAt           DateTime?
  failedAt              DateTime?

  // Relations
  booking               Booking?            @relation(fields: [bookingId], references: [id])
  walletTransaction     WalletTransaction?  @relation(fields: [walletTransactionId], references: [id])
  agent                 Agent               @relation(fields: [agentId], references: [id])

  @@index([bookingId])
  @@index([agentId])
  @@index([paymentReference])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

enum PaymentType {
  WalletRecharge
  BookingPayment
  Refund
  CreditRepayment
  PartialPayment
}

enum PaymentGateway {
  Razorpay
  Stripe
  Paytm
  PhonePe
  PayU
  CCAvenue
}

enum PaymentGatewayStatus {
  Initiated
  Pending
  Completed
  Failed
  Refunded
  PartiallyRefunded
}

enum RefundStatus {
  None
  Initiated
  Pending
  Completed
  Failed
}

model AgentMarkup {
  id                      String        @id @default(uuid()) @db.Uuid
  agentId                 String        @db.Uuid
  name                    String
  type                    MarkupTypeDB
  ruleType                MarkupRuleType
  status                  Status        @default(Active)
  priority                Int           @default(0)
  mode                    MarkupType
  value                   Decimal       @db.Decimal(15, 2)
  flightOriginAirport     String?
  flightDestAirport       String?
  flightAirlineCode       String?
  flightCabinClass        String?
  hotelStarRating         Int?
  hotelCity               String?
  hotelPropertyType       String?
  validFrom               DateTime?
  validTo                 DateTime?
  isAdminOverride         Boolean       @default(false)
  createdBy               String?       @db.Uuid
  updatedBy               String?       @db.Uuid
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  // Relations
  agent                   Agent         @relation(fields: [agentId], references: [id])

  @@index([agentId])
  @@index([type])
  @@index([status])
  @@map("agent_markups")
}

enum MarkupTypeDB {
  Flight
  Hotel
}

enum MarkupRuleType {
  Default
  Route
  Airline
  HotelCriteria
}

model GlobalMarkup {
  id                      String        @id @default(uuid()) @db.Uuid
  name                    String
  type                    MarkupTypeDB
  ruleType                MarkupRuleType
  marketType              MarketType    @default(B2C)
  status                  Status        @default(Active)
  priority                Int           @default(0)
  mode                    MarkupType
  value                   Decimal       @db.Decimal(15, 2)
  flightOriginAirport     String?
  flightDestAirport       String?
  flightAirlineCode       String?
  flightCabinClass        String?
  hotelStarRating         Int?
  hotelCity               String?
  hotelPropertyType       String?
  minBookingValue         Decimal?      @db.Decimal(15, 2)
  maxBookingValue         Decimal?      @db.Decimal(15, 2)
  validFrom               DateTime?
  validTo                 DateTime?
  createdBy               String?       @db.Uuid
  updatedBy               String?       @db.Uuid
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  @@index([type])
  @@index([ruleType])
  @@index([status])
  @@map("global_markups")
}

enum MarketType {
  B2C
  B2BDefault
}

model BookingReport {
  id                      String    @id @default(uuid()) @db.Uuid
  agentId                 String?   @db.Uuid
  reportDate              DateTime
  reportType              ReportType
  periodStart             DateTime
  periodEnd               DateTime
  totalBookings           Int       @default(0)
  flightBookings          Int       @default(0)
  hotelBookings           Int       @default(0)
  confirmedBookings       Int       @default(0)
  pendingBookings         Int       @default(0)
  cancelledBookings       Int       @default(0)
  failedBookings          Int       @default(0)
  totalRevenue            Decimal   @default(0) @db.Decimal(15, 2)
  totalMarkup             Decimal   @default(0) @db.Decimal(15, 2)
  totalCommission         Decimal   @default(0) @db.Decimal(15, 2)
  averageBookingValue     Decimal   @default(0) @db.Decimal(15, 2)
  averageMarkupPerBooking Decimal   @default(0) @db.Decimal(15, 2)
  walletPayments          Int       @default(0)
  creditPayments          Int       @default(0)
  gatewayPayments         Int       @default(0)
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  // Relations
  agent                   Agent?    @relation(fields: [agentId], references: [id])

  @@unique([agentId, reportDate, reportType])
  @@index([agentId])
  @@index([reportDate])
  @@map("booking_reports")
}

enum ReportType {
  Daily
  Weekly
  Monthly
  Custom
}

model FinancialStatement {
  id                      String              @id @default(uuid()) @db.Uuid
  agentId                 String              @db.Uuid
  statementPeriod         String              @unique
  periodStart             DateTime
  periodEnd               DateTime
  openingBalance          Decimal             @db.Decimal(15, 2)
  totalRecharges          Decimal             @default(0) @db.Decimal(15, 2)
  totalRefunds            Decimal             @default(0) @db.Decimal(15, 2)
  totalCredits            Decimal             @default(0) @db.Decimal(15, 2)
  totalBookings           Decimal             @default(0) @db.Decimal(15, 2)
  totalCancellations      Decimal             @default(0) @db.Decimal(15, 2)
  totalDebits             Decimal             @default(0) @db.Decimal(15, 2)
  totalCommissionEarned   Decimal             @default(0) @db.Decimal(15, 2)
  totalMarkupEarned       Decimal             @default(0) @db.Decimal(15, 2)
  adjustments             Decimal             @default(0) @db.Decimal(15, 2)
  closingBalance          Decimal             @db.Decimal(15, 2)
  openingCredit           Decimal             @default(0) @db.Decimal(15, 2)
  creditUsed              Decimal             @default(0) @db.Decimal(15, 2)
  creditRepaid            Decimal             @default(0) @db.Decimal(15, 2)
  closingCredit           Decimal             @default(0) @db.Decimal(15, 2)
  status                  StatementStatus     @default(Generated)
  statementUrl            String?
  generatedAt             DateTime            @default(now())
  sentAt                  DateTime?
  viewedAt                DateTime?

  // Relations
  agent                   Agent               @relation(fields: [agentId], references: [id])

  @@unique([agentId, statementPeriod])
  @@index([agentId])
  @@index([statementPeriod])
  @@index([status])
  @@map("financial_statements")
}

enum StatementStatus {
  Generated
  Sent
  Viewed
  Accepted
  Disputed
}

model AuditLog {
  id                    String              @id @default(uuid()) @db.Uuid
  actorId               String              @db.Uuid
  actorType             ActorType
  actorEmail            String?
  action                String
  actionCategory        ActionCategory
  targetEntity          String
  targetId              String?             @db.Uuid
  actionDescription     String              @db.Text
  oldValues             Json?
  newValues             Json?
  ipAddress             String?
  userAgent             String?             @db.Text
  requestMethod         String?
  requestUrl            String?             @db.Text
  status                AuditStatus
  errorMessage          String?             @db.Text
  createdAt             DateTime            @default(now())

  @@index([actorId])
  @@index([actionCategory])
  @@index([targetEntity, targetId])
  @@index([createdAt])
  @@map("audit_logs")
}

enum ActorType {
  Admin
  Agent
  AgentUser
  System
}

enum ActionCategory {
  Authentication
  Booking
  Financial
  Configuration
  UserManagement
  System
}

enum AuditStatus {
  Success
  Failure
}

model SystemLog {
  id                 String          @id @default(uuid()) @db.Uuid
  level              LogLevel
  category           String
  message            String          @db.Text
  details            Json?
  requestId          String?
  userId             String?         @db.Uuid
  userType           String?
  exceptionClass     String?
  exceptionMessage   String?         @db.Text
  stackTrace         String?         @db.Text
  createdAt          DateTime        @default(now())

  @@index([level])
  @@index([category])
  @@index([createdAt])
  @@map("system_logs")
}

enum LogLevel {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}

model Notification {
  id                String           @id @default(uuid()) @db.Uuid
  recipientId       String           @db.Uuid
  recipientType     RecipientType
  title             String
  message           String           @db.Text
  type              NotificationType
  referenceType     String?
  referenceId       String?          @db.Uuid
  isRead            Boolean          @default(false)
  readAt            DateTime?
  sentViaEmail      Boolean          @default(false)
  sentViaSms        Boolean          @default(false)
  sentViaPush       Boolean          @default(false)
  createdAt         DateTime         @default(now())
  expiresAt         DateTime?

  @@index([recipientId, recipientType])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

enum RecipientType {
  Admin
  Agent
  AgentUser
}

enum NotificationType {
  Booking
  Payment
  System
  Promotion
  Alert
}

model SystemSetting {
  id          String              @id @default(uuid()) @db.Uuid
  key         String              @unique
  value       String              @db.Text
  type        SettingType
  category    String?
  description String?             @db.Text
  isEditable  Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([category])
  @@map("system_settings")
}

enum SettingType {
  String
  Number
  Boolean
  Json
}
```

### 2.4 Generate Prisma Client

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Railway PostgreSQL
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

---

## Step 3: Create Core Services

### 3.1 Prisma Service

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 3.2 Configuration Service

```typescript
// src/config/configuration.ts
export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
```

```typescript
// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
```

---

## Step 4: Authentication Module

### 4.1 DTOs

```typescript
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { BusinessType } from '@prisma/client';

export class RegisterAgentDto {
  @IsString()
  agencyName: string;

  @IsString()
  agencyCode: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  contactPersonName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  addressLine1: string;

  @IsString()
  city: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}
```

```typescript
// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

```typescript
// src/modules/auth/dto/auth-response.dto.ts
import { Agent } from '@prisma/client';

export class AuthResponseDto {
  user: Agent;
  accessToken: string;
  refreshToken: string;
}
```

### 4.2 Auth Service

```typescript
// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterAgentDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerAgent(dto: RegisterAgentDto) {
    // Check if agency code exists
    const existingCode = await this.prisma.agent.findUnique({
      where: { agencyCode: dto.agencyCode },
    });

    if (existingCode) {
      throw new ConflictException('Agency code already exists');
    }

    // Check if email exists
    const existingEmail = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create agent
    const agent = await this.prisma.agent.create({
      data: {
        ...dto,
        passwordHash: hashedPassword,
        status: 'Pending',
        verificationStatus: 'Unverified',
      },
    });

    // Create wallet
    await this.prisma.wallet.create({
      data: {
        agentId: agent.id,
        currentBalance: 0,
        availableBalance: 0,
        creditLimit: 0,
        availableCredit: 0,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(agent.id, agent.email);

    return {
      user: this.sanitizeAgent(agent),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const agent = await this.prisma.agent.findUnique({
      where: { email: dto.email },
    });

    if (!agent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, agent.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (agent.status !== 'Active') {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(agent.id, agent.email);

    return {
      user: this.sanitizeAgent(agent),
      ...tokens,
    };
  }

  async validateAgent(userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: userId },
    });

    if (!agent || agent.status !== 'Active') {
      throw new UnauthorizedException('Agent not found or inactive');
    }

    return this.sanitizeAgent(agent);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }

  private sanitizeAgent(agent: any) {
    const { passwordHash, ...sanitized } = agent;
    return sanitized;
  }
}
```

### 4.3 JWT Strategy

```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: payload.sub },
    });

    if (!agent || agent.status !== 'Active') {
      throw new UnauthorizedException();
    }

    const { passwordHash, ...result } = agent;
    return result;
  }
}
```

### 4.4 JWT Guard

```typescript
// src/modules/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 4.5 Current User Decorator

```typescript
// src/modules/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 4.6 Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAgentDto, LoginDto, AuthResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new B2B agent' })
  async register(@Body() dto: RegisterAgentDto): Promise<AuthResponseDto> {
    return this.authService.registerAgent(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Agent login' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }
}
```

### 4.7 Auth Module

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## Step 5: Agents Module

### 5.1 Agents Service

```typescript
// src/modules/agents/agents.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentStatus, VerificationStatus } from '@prisma/client';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: AgentStatus, page = 1, limit = 10) {
    const where = status ? { status } : {};

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        select: {
          id: true,
          agencyName: true,
          agencyCode: true,
          email: true,
          phone: true,
          status: true,
          verificationStatus: true,
          walletBalance: true,
          creditLimit: true,
          availableCredit: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data: agents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        wallet: true,
        _count: {
          select: {
            bookings: true,
            users: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const { passwordHash, ...result } = agent;
    return result;
  }

  async updateStatus(id: string, status: AgentStatus) {
    return this.prisma.agent.update({
      where: { id },
      data: { status },
    });
  }

  async updateVerificationStatus(id: string, status: VerificationStatus) {
    return this.prisma.agent.update({
      where: { id },
      data: { verificationStatus: status },
    });
  }

  async updateCreditLimit(id: string, creditLimit: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!agent || !agent.wallet) {
      throw new NotFoundException('Agent or wallet not found');
    }

    const usedCredit = agent.wallet.usedCredit || 0;
    const availableCredit = creditLimit - usedCredit;

    await this.prisma.agent.update({
      where: { id },
      data: { creditLimit: creditLimit },
    });

    return this.prisma.wallet.update({
      where: { agentId: id },
      data: {
        creditLimit,
        availableCredit,
        creditApproved: true,
        creditApprovedAt: new Date(),
      },
    });
  }

  async getDashboard(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        wallet: true,
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get booking statistics
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { agentId } }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Confirmed' },
      }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Pending' },
      }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Cancelled' },
      }),
    ]);

    return {
      agent: {
        id: agent.id,
        agencyName: agent.agencyName,
        agencyCode: agent.agencyCode,
        email: agent.email,
        status: agent.status,
      },
      wallet: agent.wallet,
      statistics: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
      },
      recentBookings: agent.bookings,
    };
  }
}
```

### 5.2 Agents Controller

```typescript
// src/modules/agents/agents.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AgentStatus, VerificationStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get agent dashboard' })
  async getDashboard(@CurrentUser() user: any) {
    return this.agentsService.getDashboard(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: AgentStatus })
  async findAll(
    @Query('status') status?: AgentStatus,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.agentsService.findAll(status, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update agent status (Admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
  ) {
    return this.agentsService.updateStatus(id, status);
  }

  @Patch(':id/verification')
  @ApiOperation({ summary: 'Update verification status (Admin only)' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body('status') status: VerificationStatus,
  ) {
    return this.agentsService.updateVerificationStatus(id, status);
  }

  @Patch(':id/credit')
  @ApiOperation({ summary: 'Update credit limit (Admin only)' })
  async updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
  ) {
    return this.agentsService.updateCreditLimit(id, creditLimit);
  }
}
```

### 5.3 Agents Module

```typescript
// src/modules/agents/agents.module.ts
import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
```

---

## Step 6: Main App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgentsModule } from './modules/agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AppConfigModule,
    AuthModule,
    AgentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

## Step 7: Main Entry Point

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('B2B Travel Portal API')
    .setDescription('API documentation for B2B Travel Portal')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
```

---

## Step 8: Run the Application

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run start:dev

# Or build and run
npm run build
npm run start:prod
```

---

## Step 9: Testing

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "agencyName": "Test Travels",
    "agencyCode": "TEST001",
    "businessType": "TravelAgency",
    "contactPersonName": "John Doe",
    "email": "john@testtravels.com",
    "phone": "+919876543210",
    "password": "SecurePass123",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "country": "India",
    "postalCode": "400001"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@testtravels.com",
    "password": "SecurePass123"
  }'
```

### Test Protected Route

```bash
# Replace YOUR_TOKEN with the access token from login
curl -X GET http://localhost:3000/api/agents/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Package.json Scripts

```json
{
  "name": "happytrip-b2b",
  "version": "1.0.0",
  "description": "B2B Travel Portal",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.9",
    "@types/passport-local": "^1.0.35",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "prisma": "^5.0.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  }
}
```

---

## Next Steps

1. ✅ Run `npx prisma db push` to create tables in Railway PostgreSQL
2. ✅ Test the authentication endpoints
3. ✅ Create remaining modules (Wallets, Bookings, Admin)
4. ✅ Add comprehensive error handling
5. ✅ Implement logging with Winston
6. ✅ Add unit and integration tests
7. ✅ Set up CI/CD pipeline

---

## Useful Commands

```bash
# Prisma Studio (GUI for database)
npx prisma studio

# Reset database (BE CAREFUL!)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Seed database
npx prisma db seed
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
