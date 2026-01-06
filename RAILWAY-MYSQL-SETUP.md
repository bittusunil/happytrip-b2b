# Railway MySQL Setup for B2B Travel Portal

## Your Railway Connection Details

```
Host: shinkansen.proxy.rlwy.net
Port: 58878
User: root
Password: sKIISLxDAsXpSMARZCbYKHNFomGbtjxx
Database: railway
```

---

## Quick Assessment

### ✅ Pros of Using Railway MySQL

| Benefit | Description |
|---------|-------------|
| **Zero Setup** | Already working, just connect |
| **Free Tier** | Railway has generous free tier |
| **Managed Service** | Automated backups, updates |
| **Easy Scaling** | One-click upgrade |
| **Low Latency** | Edge deployment |
| **Good for MVP** | Perfect for development/staging |

### ⚠️ Cons to Consider

| Limitation | Impact |
|------------|--------|
| **MySQL vs PostgreSQL** | Loses PostgreSQL features (JSONB, full-text search, etc.) |
| **Connection Limits** | Free tier limited connections |
| **Resource Limits** | CPU/RAM constrained on free tier |
| **Vendor Lock-in** | Migration needed if scaling beyond Railway |
| **Compliance** | May not meet enterprise requirements |
| **Data Residency** | Data stored on Railway infrastructure |

---

## Migration to MySQL

### Database Schema Changes Required

#### 1. Data Type Conversions

| PostgreSQL | MySQL | Notes |
|------------|-------|-------|
| `VARCHAR(36)` (UUID) | `VARCHAR(36)` or `CHAR(36)` | Use CHAR(36) for fixed UUIDs |
| `TIMESTAMP` | `TIMESTAMP` or `DATETIME` | DATETIME has larger range |
| `ENUM(...)` | `ENUM(...)` | Same syntax |
| `DECIMAL(15,2)` | `DECIMAL(15,2)` | Same syntax |
| `JSON` or `JSONB` | `JSON` | MySQL 5.7+ supports JSON |
| `BOOLEAN` | `TINYINT(1)` | MySQL doesn't have native BOOLEAN |
| `INET` (IP addresses) | `VARCHAR(45)` | MySQL has no native IP type |
| `ARRAY` | `JSON` | Convert arrays to JSON |

---

### 2. Modified Database Schema for MySQL

I'll create MySQL-compatible versions of all tables. Let me start with the core tables:

```sql
-- ============================================
-- 1. AUTHENTICATION & USER MANAGEMENT
-- ============================================

-- 1.1 AGENTS Table
CREATE TABLE agents (
    agent_id CHAR(36) PRIMARY KEY,
    agency_name VARCHAR(255) NOT NULL,
    agency_code VARCHAR(50) UNIQUE NOT NULL,
    business_type ENUM('OTA', 'Travel Agency', 'Corporate', 'Individual') NOT NULL,

    -- Contact Information
    contact_person_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,

    -- Business Details
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    pan_number VARCHAR(20),

    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    email_verified TINYINT(1) DEFAULT 0,
    phone_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,

    -- Status
    status ENUM('Pending', 'Active', 'Inactive', 'Suspended', 'Blocked') DEFAULT 'Pending',
    verification_status ENUM('Unverified', 'Submitted', 'Under Review', 'Verified', 'Rejected') DEFAULT 'Unverified',

    -- Wallet & Credit
    wallet_balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    available_credit DECIMAL(15,2) DEFAULT 0.00,

    -- Commission & Markup
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    use_custom_markup TINYINT(1) DEFAULT 0,

    -- Permissions (JSON in MySQL)
    permissions JSON,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    deleted_at DATETIME,

    -- Metadata
    created_by CHAR(36),
    updated_by CHAR(36),
    notes TEXT,

    INDEX idx_email (email),
    INDEX idx_agency_code (agency_code),
    INDEX idx_status (status),
    INDEX idx_verification_status (verification_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 AGENT_USERS Table
CREATE TABLE agent_users (
    user_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36) NOT NULL,

    -- User Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    username VARCHAR(100) UNIQUE NOT NULL,

    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(500),

    -- Role within Agent Account
    role ENUM('Owner', 'Admin', 'Manager', 'Staff') DEFAULT 'Staff',
    permissions JSON,

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    email_verified TINYINT(1) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    deleted_at DATETIME,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,

    UNIQUE KEY unique_agent_email (agent_id, email),
    INDEX idx_agent_id (agent_id),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.3 ADMIN_ROLES Table
CREATE TABLE admin_roles (
    role_id CHAR(36) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,

    -- Default Permissions (JSON)
    permissions JSON NOT NULL,

    -- Hierarchy Level
    hierarchy_level INT DEFAULT 99,

    -- Status
    status ENUM('Active', 'Inactive') DEFAULT 'Active',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.4 ADMIN_USERS Table
CREATE TABLE admin_users (
    admin_id CHAR(36) PRIMARY KEY,

    -- User Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    username VARCHAR(100) UNIQUE NOT NULL,

    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(500),

    -- Role & Permissions
    role_id CHAR(36) NOT NULL,
    permissions JSON,

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    email_verified TINYINT(1) DEFAULT 1,
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    deleted_at DATETIME,

    -- Metadata
    created_by CHAR(36),
    updated_by CHAR(36),

    FOREIGN KEY (role_id) REFERENCES admin_roles(role_id),

    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. BOOKING MANAGEMENT
-- ============================================

-- 2.1 BOOKINGS Table
CREATE TABLE bookings (
    booking_id CHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,

    -- Agent Information
    agent_id CHAR(36) NOT NULL,
    booked_by_user_id CHAR(36),

    -- Booking Type
    booking_type ENUM('Flight', 'Hotel', 'Flight+Hotel') NOT NULL,

    -- Supplier Information
    supplier_name VARCHAR(100),
    supplier_booking_reference VARCHAR(100),
    supplier_confirmation_code VARCHAR(100),

    -- Customer Information
    customer_title ENUM('Mr', 'Mrs', 'Ms', 'Dr') NOT NULL,
    customer_first_name VARCHAR(100) NOT NULL,
    customer_last_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,

    -- Pricing
    base_fare DECIMAL(15,2) NOT NULL,
    taxes_and_fees DECIMAL(15,2) NOT NULL,
    supplier_cost DECIMAL(15,2) NOT NULL,

    -- Markup & Commission
    markup_type ENUM('Percentage', 'Fixed') NOT NULL,
    markup_value DECIMAL(15,2) NOT NULL,
    markup_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_amount DECIMAL(15,2) DEFAULT 0.00,

    -- Final Pricing
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',

    -- Payment
    payment_status ENUM('Pending', 'Partial', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_method ENUM('Wallet', 'Credit', 'Payment Gateway', 'Mixed') NOT NULL,
    payment_gateway_transaction_id VARCHAR(100),

    -- Status
    booking_status ENUM('Pending', 'Confirmed', 'Processing', 'Failed', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    confirmation_sent TINYINT(1) DEFAULT 0,
    ticketed TINYINT(1) DEFAULT 0,
    ticket_number VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    cancelled_at DATETIME,
    completed_at DATETIME,

    -- Failure Information
    failure_reason TEXT,
    failure_code VARCHAR(50),

    -- Cancellation
    cancellation_reason TEXT,
    cancellation_charges DECIMAL(15,2) DEFAULT 0.00,
    refund_amount DECIMAL(15,2) DEFAULT 0.00,

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (booked_by_user_id) REFERENCES agent_users(user_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_booking_reference (booking_reference),
    INDEX idx_booking_status (booking_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at),
    INDEX idx_supplier_booking_ref (supplier_booking_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 FLIGHT_BOOKINGS Table
CREATE TABLE flight_bookings (
    flight_booking_id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,

    -- Flight Details
    airline_code VARCHAR(10) NOT NULL,
    airline_name VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,

    -- Route
    origin_airport_code VARCHAR(10) NOT NULL,
    origin_airport_name VARCHAR(255) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_country VARCHAR(100) NOT NULL,

    destination_airport_code VARCHAR(10) NOT NULL,
    destination_airport_name VARCHAR(255) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_country VARCHAR(100) NOT NULL,

    -- Schedule
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_date DATE NOT NULL,
    arrival_time TIME NOT NULL,

    -- Cabin & Class
    cabin_class ENUM('Economy', 'Premium Economy', 'Business', 'First') NOT NULL,
    meal_preference VARCHAR(50),
    seat_number VARCHAR(10),

    -- Pricing
    base_fare DECIMAL(15,2) NOT NULL,
    taxes DECIMAL(15,2) NOT NULL,
    fare_type VARCHAR(50),

    -- Supplier PNR
    pnr VARCHAR(20) NOT NULL,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,

    INDEX idx_booking_id (booking_id),
    INDEX idx_departure_date (departure_date),
    INDEX idx_flight_number (flight_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.3 FLIGHT_PASSENGERS Table
CREATE TABLE flight_passengers (
    passenger_id CHAR(36) PRIMARY KEY,
    flight_booking_id CHAR(36) NOT NULL,

    -- Passenger Information
    title ENUM('Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Inf') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    passport_number VARCHAR(50),
    passport_expiry DATE,
    national_id VARCHAR(50),

    -- Contact
    email VARCHAR(255),
    phone VARCHAR(20),

    -- Type
    passenger_type ENUM('Adult', 'Child', 'Infant') NOT NULL,

    -- Frequent Flyer
    frequent_flyer_airline VARCHAR(100),
    frequent_flyer_number VARCHAR(50),

    -- Special Requests
    meal_preference VARCHAR(50),
    special_requests TEXT,
    wheelchair_required TINYINT(1) DEFAULT 0,

    FOREIGN KEY (flight_booking_id) REFERENCES flight_bookings(flight_booking_id) ON DELETE CASCADE,

    INDEX idx_flight_booking_id (flight_booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.4 HOTEL_BOOKINGS Table
CREATE TABLE hotel_bookings (
    hotel_booking_id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,

    -- Hotel Information
    hotel_id VARCHAR(50) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_chain VARCHAR(100),
    star_rating INT NOT NULL,

    -- Location
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Booking Details
    room_type VARCHAR(100) NOT NULL,
    room_type_code VARCHAR(50),
    number_of_rooms INT NOT NULL,
    number_of_adults INT NOT NULL,
    number_of_children INT DEFAULT 0,
    child_ages JSON,

    -- Stay Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INT NOT NULL,

    -- Inclusions
    meal_plan ENUM('Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive') DEFAULT 'Room Only',
    amenities JSON,

    -- Pricing
    room_rate_per_night DECIMAL(15,2) NOT NULL,
    tax_and_service_charge DECIMAL(15,2) NOT NULL,

    -- Supplier Confirmation
    supplier_confirmation_number VARCHAR(100),
    checkin_instructions TEXT,

    -- Cancellation Policy
    free_cancellation_before DATE,
    cancellation_policy TEXT,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,

    INDEX idx_booking_id (booking_id),
    INDEX idx_check_in_date (check_in_date),
    INDEX idx_hotel_name (hotel_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. FINANCIAL MANAGEMENT
-- ============================================

-- 3.1 WALLETS Table
CREATE TABLE wallets (
    wallet_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36) NOT NULL UNIQUE,

    -- Balance Information
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    blocked_balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,

    -- Credit Line
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    used_credit DECIMAL(15,2) DEFAULT 0.00,
    available_credit DECIMAL(15,2) DEFAULT 0.00,

    -- Account Status
    status ENUM('Active', 'Frozen', 'Blocked') DEFAULT 'Active',
    is_credit_enabled TINYINT(1) DEFAULT 0,
    credit_approved TINYINT(1) DEFAULT 0,
    credit_approved_by CHAR(36),
    credit_approved_at DATETIME,

    -- Auto-Recharge Settings
    auto_recharge_enabled TINYINT(1) DEFAULT 0,
    auto_recharge_threshold DECIMAL(15,2) DEFAULT 5000.00,
    auto_recharge_amount DECIMAL(15,2) DEFAULT 10000.00,

    -- Overdraft Settings
    allow_overdraft TINYINT(1) DEFAULT 0,
    overdraft_limit DECIMAL(15,2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 WALLET_TRANSACTIONS Table
CREATE TABLE wallet_transactions (
    transaction_id CHAR(36) PRIMARY KEY,
    wallet_id CHAR(36) NOT NULL,
    agent_id CHAR(36) NOT NULL,
    booking_id CHAR(36),

    -- Transaction Reference
    transaction_reference VARCHAR(30) UNIQUE NOT NULL,
    transaction_type ENUM('Credit', 'Debit', 'Credit_Adjustment', 'Debit_Adjustment', 'Refund') NOT NULL,
    transaction_category ENUM('Recharge', 'Booking', 'Cancellation', 'Refund', 'Commission', 'Adjustment', 'Fee', 'Credit_Used', 'Credit_Repayment') NOT NULL,

    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,

    -- Payment Method
    payment_method ENUM('Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Payment Gateway', 'Cash', 'Cheque', 'Adjustment', 'Wallet'),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(100),

    -- Bank Transfer Details
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    transaction_ref_number VARCHAR(100),
    utr_number VARCHAR(50),

    -- Status
    status ENUM('Pending', 'Completed', 'Failed', 'Cancelled') DEFAULT 'Pending',

    -- Approval
    requires_approval TINYINT(1) DEFAULT 0,
    approved_by CHAR(36),
    approved_at DATETIME,
    rejection_reason TEXT,

    -- Receipt & Invoice
    receipt_url VARCHAR(500),
    invoice_number VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME,

    -- Metadata
    ip_address VARCHAR(45),
    notes TEXT,
    attachments JSON,

    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),

    INDEX idx_wallet_id (wallet_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_transaction_reference (transaction_reference),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 CREDIT_TRANSACTIONS Table
CREATE TABLE credit_transactions (
    credit_transaction_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36) NOT NULL,
    booking_id CHAR(36),

    -- Transaction Reference
    transaction_reference VARCHAR(30) UNIQUE NOT NULL,
    transaction_type ENUM('Credit_Used', 'Credit_Repayment', 'Credit_Limit_Change') NOT NULL,

    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    opening_credit DECIMAL(15,2) NOT NULL,
    closing_credit DECIMAL(15,2) NOT NULL,

    -- Credit Limit Change
    old_credit_limit DECIMAL(15,2),
    new_credit_limit DECIMAL(15,2),

    -- Status
    status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',

    -- Approval
    approved_by CHAR(36),
    approved_at DATETIME,
    valid_till DATE,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_transaction_reference (transaction_reference),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 PAYMENTS Table
CREATE TABLE payments (
    payment_id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36),
    wallet_transaction_id CHAR(36),
    agent_id CHAR(36) NOT NULL,

    -- Payment Reference
    payment_reference VARCHAR(30) UNIQUE NOT NULL,
    payment_type ENUM('Wallet_Recharge', 'Booking_Payment', 'Refund', 'Credit_Repayment', 'Partial_Payment') NOT NULL,

    -- Amount
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',

    -- Payment Method
    payment_method ENUM('Credit Card', 'Debit Card', 'Net Banking', 'UPI', 'Wallet', 'Bank Transfer') NOT NULL,
    payment_gateway ENUM('Razorpay', 'Stripe', 'Paytm', 'PhonePe', 'PayU', 'CCAvenue') NOT NULL,

    -- Gateway Details
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_transaction_id VARCHAR(100),

    -- Card Details
    card_last_4_digits VARCHAR(4),
    card_holder_name VARCHAR(100),
    card_type VARCHAR(50),

    -- Bank Details
    bank_name VARCHAR(100),
    bank_transaction_id VARCHAR(100),

    -- Status
    status ENUM('Initiated', 'Pending', 'Completed', 'Failed', 'Refunded', 'Partially_Refunded') DEFAULT 'Initiated',

    -- Response
    gateway_response JSON,
    failure_reason TEXT,

    -- Refund Details
    refund_amount DECIMAL(15,2) DEFAULT 0.00,
    refund_reference VARCHAR(100),
    refund_status ENUM('None', 'Initiated', 'Pending', 'Completed', 'Failed') DEFAULT 'None',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME,
    failed_at DATETIME,

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (wallet_transaction_id) REFERENCES wallet_transactions(transaction_id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    INDEX idx_booking_id (booking_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_payment_reference (payment_reference),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. MARKUP & PRICING
-- ============================================

-- 4.1 GLOBAL_MARKUPS Table
CREATE TABLE global_markups (
    markup_id CHAR(36) PRIMARY KEY,

    -- Markup Configuration
    markup_name VARCHAR(255) NOT NULL,
    markup_type ENUM('Flight', 'Hotel') NOT NULL,
    rule_type ENUM('Default', 'Route', 'Airline', 'Hotel_Criteria') NOT NULL,

    -- Applicability
    market_type ENUM('B2C', 'B2B_Default') NOT NULL DEFAULT 'B2C',
    status ENUM('Active', 'Inactive') DEFAULT 'Active',

    -- Priority
    priority INT DEFAULT 0,

    -- Markup Value
    markup_mode ENUM('Percentage', 'Fixed') NOT NULL,
    markup_value DECIMAL(15,2) NOT NULL,

    -- Flight Specific Rules
    flight_origin_airport_code VARCHAR(10),
    flight_destination_airport_code VARCHAR(10),
    flight_airline_code VARCHAR(10),
    flight_cabin_class ENUM('All', 'Economy', 'Premium Economy', 'Business', 'First'),

    -- Hotel Specific Rules
    hotel_star_rating INT,
    hotel_city VARCHAR(100),
    hotel_property_type ENUM('All', 'Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel'),

    -- Booking Value Range
    min_booking_value DECIMAL(15,2),
    max_booking_value DECIMAL(15,2),

    -- Date Range
    valid_from DATE,
    valid_to DATE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Metadata
    created_by CHAR(36),
    updated_by CHAR(36),

    INDEX idx_markup_type (markup_type),
    INDEX idx_rule_type (rule_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 AGENT_MARKUPS Table
CREATE TABLE agent_markups (
    agent_markup_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36) NOT NULL,

    -- Markup Configuration
    markup_name VARCHAR(255) NOT NULL,
    markup_type ENUM('Flight', 'Hotel') NOT NULL,
    rule_type ENUM('Default', 'Route', 'Airline', 'Hotel_Criteria') NOT NULL,

    -- Applicability
    status ENUM('Active', 'Inactive') DEFAULT 'Active',

    -- Priority
    priority INT DEFAULT 0,

    -- Markup Value
    markup_mode ENUM('Percentage', 'Fixed') NOT NULL,
    markup_value DECIMAL(15,2) NOT NULL,

    -- Flight Specific Rules
    flight_origin_airport_code VARCHAR(10),
    flight_destination_airport_code VARCHAR(10),
    flight_airline_code VARCHAR(10),
    flight_cabin_class ENUM('All', 'Economy', 'Premium Economy', 'Business', 'First'),

    -- Hotel Specific Rules
    hotel_star_rating INT,
    hotel_city VARCHAR(100),
    hotel_property_type ENUM('All', 'Hotel', 'Resort', 'Apartment', 'Villa', 'Hostel'),

    -- Date Range
    valid_from DATE,
    valid_to DATE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Metadata
    is_admin_override TINYINT(1) DEFAULT 0,
    created_by CHAR(36),
    updated_by CHAR(36),

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_markup_type (markup_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. REPORTS & ANALYTICS
-- ============================================

-- 5.1 BOOKING_REPORTS Table
CREATE TABLE booking_reports (
    report_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36),

    -- Report Period
    report_date DATE NOT NULL,
    report_type ENUM('Daily', 'Weekly', 'Monthly', 'Custom') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Booking Statistics
    total_bookings INT DEFAULT 0,
    flight_bookings INT DEFAULT 0,
    hotel_bookings INT DEFAULT 0,

    -- Status Breakdown
    confirmed_bookings INT DEFAULT 0,
    pending_bookings INT DEFAULT 0,
    cancelled_bookings INT DEFAULT 0,
    failed_bookings INT DEFAULT 0,

    -- Financial Summary
    total_revenue DECIMAL(15,2) DEFAULT 0.00,
    total_markup DECIMAL(15,2) DEFAULT 0.00,
    total_commission DECIMAL(15,2) DEFAULT 0.00,

    -- Average Values
    average_booking_value DECIMAL(15,2) DEFAULT 0.00,
    average_markup_per_booking DECIMAL(15,2) DEFAULT 0.00,

    -- Payment Method Breakdown
    wallet_payments INT DEFAULT 0,
    credit_payments INT DEFAULT 0,
    gateway_payments INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_agent_period (agent_id, report_date, report_type),
    INDEX idx_agent_id (agent_id),
    INDEX idx_report_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5.2 FINANCIAL_STATEMENTS Table
CREATE TABLE financial_statements (
    statement_id CHAR(36) PRIMARY KEY,
    agent_id CHAR(36) NOT NULL,

    -- Statement Period
    statement_period VARCHAR(7) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Opening Balance
    opening_balance DECIMAL(15,2) NOT NULL,

    -- Credits
    total_recharges DECIMAL(15,2) DEFAULT 0.00,
    total_refunds DECIMAL(15,2) DEFAULT 0.00,
    total_credits DECIMAL(15,2) DEFAULT 0.00,

    -- Debits
    total_bookings DECIMAL(15,2) DEFAULT 0.00,
    total_cancellations DECIMAL(15,2) DEFAULT 0.00,
    total_debits DECIMAL(15,2) DEFAULT 0.00,

    -- Other
    total_commission_earned DECIMAL(15,2) DEFAULT 0.00,
    total_markup_earned DECIMAL(15,2) DEFAULT 0.00,
    adjustments DECIMAL(15,2) DEFAULT 0.00,

    -- Closing Balance
    closing_balance DECIMAL(15,2) NOT NULL,

    -- Credit Usage
    opening_credit DECIMAL(15,2) DEFAULT 0.00,
    credit_used DECIMAL(15,2) DEFAULT 0.00,
    credit_repaid DECIMAL(15,2) DEFAULT 0.00,
    closing_credit DECIMAL(15,2) DEFAULT 0.00,

    -- Status
    status ENUM('Generated', 'Sent', 'Viewed', 'Accepted', 'Disputed') DEFAULT 'Generated',

    -- Document
    statement_url VARCHAR(500),

    -- Timestamps
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME,
    viewed_at DATETIME,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    UNIQUE KEY unique_agent_period (agent_id, statement_period),
    INDEX idx_agent_id (agent_id),
    INDEX idx_statement_period (statement_period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. AUDIT & SYSTEM LOGS
-- ============================================

-- 6.1 AUDIT_LOGS Table
CREATE TABLE audit_logs (
    audit_id CHAR(36) PRIMARY KEY,

    -- Actor
    actor_id CHAR(36) NOT NULL,
    actor_type ENUM('Admin', 'Agent', 'Agent_User', 'System') NOT NULL,
    actor_email VARCHAR(255),

    -- Action
    action VARCHAR(100) NOT NULL,
    action_category ENUM('Authentication', 'Booking', 'Financial', 'Configuration', 'User_Management', 'System') NOT NULL,

    -- Target
    target_entity VARCHAR(50) NOT NULL,
    target_id CHAR(36),

    -- Details
    action_description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,

    -- Request Details
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,

    -- Result
    status ENUM('Success', 'Failure') NOT NULL,
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_actor_id (actor_id),
    INDEX idx_action_category (action_category),
    INDEX idx_target (target_entity, target_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.2 SYSTEM_LOGS Table
CREATE TABLE system_logs (
    log_id CHAR(36) PRIMARY KEY,

    -- Log Level
    log_level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,

    -- Log Details
    log_category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    details JSON,

    -- Context
    request_id VARCHAR(50),
    user_id CHAR(36),
    user_type VARCHAR(50),

    -- Exception Details
    exception_class VARCHAR(255),
    exception_message TEXT,
    stack_trace TEXT,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_log_level (log_level),
    INDEX idx_log_category (log_category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. NOTIFICATIONS & SETTINGS
-- ============================================

-- 7.1 NOTIFICATIONS Table
CREATE TABLE notifications (
    notification_id CHAR(36) PRIMARY KEY,

    -- Recipient
    recipient_id CHAR(36) NOT NULL,
    recipient_type ENUM('Admin', 'Agent', 'Agent_User') NOT NULL,

    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('Booking', 'Payment', 'System', 'Promotion', 'Alert') NOT NULL,

    -- Reference
    reference_type VARCHAR(50),
    reference_id CHAR(36),

    -- Status
    is_read TINYINT(1) DEFAULT 0,
    read_at DATETIME,

    -- Delivery
    sent_via_email TINYINT(1) DEFAULT 0,
    sent_via_sms TINYINT(1) DEFAULT 0,
    sent_via_push TINYINT(1) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,

    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.2 SYSTEM_SETTINGS Table
CREATE TABLE system_settings (
    setting_id CHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('String', 'Number', 'Boolean', 'JSON') NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_editable TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default system settings
INSERT INTO system_settings (setting_id, setting_key, setting_value, setting_type, category, description) VALUES
(UUID(), 'default_currency', 'INR', 'String', 'General', 'Default currency for bookings'),
(UUID(), 'min_booking_amount', '100', 'Number', 'Booking', 'Minimum booking amount'),
(UUID(), 'max_login_attempts', '5', 'Number', 'Security', 'Maximum failed login attempts'),
(UUID(), 'session_timeout', '1800', 'Number', 'Security', 'Session timeout in seconds'),
(UUID(), 'maintenance_mode', 'false', 'Boolean', 'General', 'Maintenance mode status');

-- Insert default admin role
INSERT INTO admin_roles (role_id, role_name, role_code, description, permissions, hierarchy_level) VALUES
(UUID(), 'Super Admin', 'SUPER_ADMIN', 'Full system access',
'{"dashboard":{"view":true},"agents":{"view":true,"create":true,"edit":true,"delete":true},"bookings":{"view":true,"edit":true,"delete":true},"pricing":{"view":true,"edit":true,"delete":true},"users":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":true,"export":true},"financial":{"view":true,"manage":true,"approve":true}}',
1);
```

---

## Connecting from Application

### Node.js (Sequelize)

```javascript
// config/database.js
module.exports = {
  development: {
    username: 'root',
    password: 'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx',
    database: 'railway',
    host: 'shinkansen.proxy.rlwy.net',
    port: 58878,
    dialect: 'mysql',
    logging: true,
    timezone: '+00:00',
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: 'root',
    password: 'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx',
    database: 'railway',
    host: 'shinkansen.proxy.rlwy.net',
    port: 58878,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    }
  }
};
```

### Node.js (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// .env file
DATABASE_URL="mysql://root:sKIISLxDAsXpSMARZCbYKHNFomGbtjxx@shinkansen.proxy.rlwy.net:58878/railway"
```

### Node.js (Knex.js)

```javascript
// knexfile.js
module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: 'shinkansen.proxy.rlwy.net',
      port: 58878,
      user: 'root',
      password: 'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx',
      database: 'railway'
    },
    pool: { min: 0, max: 10 }
  },
  production: {
    client: 'mysql2',
    connection: {
      host: 'shinkansen.proxy.rlwy.net',
      port: 58878,
      user: 'root',
      password: 'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx',
      database: 'railway',
      ssl: { rejectUnauthorized: false }
    },
    pool: { min: 5, max: 20 }
  }
};
```

### Python (SQLAlchemy)

```python
# config.py
DATABASE_CONFIG = {
    'development': {
        'sqlalchemy.url': 'mysql+pymysql://root:sKIISLxDAsXpSMARZCbYKHNFomGbtjxx@shinkansen.proxy.rlwy.net:58878/railway',
        'echo': True,
        'pool_size': 5,
        'max_overflow': 10
    },
    'production': {
        'sqlalchemy.url': 'mysql+pymysql://root:sKIISLxDAsXpSMARZCbYKHNFomGbtjxx@shinkansen.proxy.rlwy.net:58878/railway',
        'echo': False,
        'pool_size': 20,
        'max_overflow': 40,
        'pool_pre_ping': True
    }
}
```

---

## Running Migration Scripts

### Option 1: Using MySQL CLI

```bash
# Install MySQL client
# Ubuntu/Debian
sudo apt-get install mysql-client

# macOS
brew install mysql-client

# Connect to Railway MySQL
mysql -h shinkansen.proxy.rlwy.net -P 58878 -u root -p
# Enter password: sKIISLxDAsXpSMARZCbYKHNFomGbtjxx

# Run migration script
source /path/to/schema.sql
# Or
mysql -h shinkansen.proxy.rlwy.net -P 58878 -u root -p'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx' railway < schema.sql
```

### Option 2: Using Node.js Migration Tool

```bash
# Install db-migrate
npm install db-migrate db-migrate-mysql

# Create database.json config
cat > database.json << EOF
{
  "dev": {
    "driver": "mysql",
    "user": "root",
    "password": "sKIISLxDAsXpSMARZCbYKHNFomGbtjxx",
    "host": "shinkansen.proxy.rlwy.net",
    "port": 58878,
    "database": "railway"
  }
}
EOF

# Run migration
db-migrate up
```

### Option 3: Using Prisma Migrate

```bash
# Initialize Prisma
npx prisma init

# Push schema to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name init
```

---

## Railway Dashboard Management

### View Database Metrics

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Click on MySQL service
4. View metrics:
   - CPU usage
   - Memory usage
   - Disk usage
   - Connection count
   - Query performance

### Backup Your Database

Railway provides automatic backups. To create manual backup:

```bash
# Using mysqldump
mysqldump -h shinkansen.proxy.rlwy.net -P 58878 -u root -p'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx' railway > backup_$(date +%Y%m%d).sql

# Compress backup
gzip backup_$(date +%Y%m%d).sql
```

---

## Limitations & Considerations

### Railway MySQL Limitations

| Feature | Limitation | Workaround |
|---------|------------|------------|
| **Connection Pool** | Limited connections | Use connection pooling in app |
| **Storage** | Limited disk space | Archive old data regularly |
| **Compute** | Shared CPU | Optimize queries, add indexes |
| **Network** | Possible latency | Use Redis for caching |
| **JSON Queries** | Slower than PostgreSQL | Index JSON fields |

### Missing PostgreSQL Features

1. **No Full-Text Search** → Use LIKE or external search service
2. **No JSONB** → JSON is slower, but works
3. **No Array Types** → Use JSON or comma-separated strings
4. **No Native UUID** → Use CHAR(36) or VARCHAR(36)
5. **No CTE (before 8.0)** → Use subqueries
6. **No Window Functions (before 8.0)** → Use self-joins

---

## When to Migrate Away from Railway

Consider migrating when:
- ❌ Exceeding connection limits
- ❌ Slow query performance
- ❌ Need for advanced PostgreSQL features
- ❌ Reaching storage limits
- ❌ Production deployment with high traffic
- ❌ Compliance requirements

---

## Migration Path to AWS RDS

When ready to migrate:

```bash
# Export from Railway
mysqldump -h shinkansen.proxy.rlwy.net -P 58878 -u root -p'sKIISLxDAsXpSMARZCbYKHNFomGbtjxx' \
  --single-transaction --routines --triggers \
  railway > railway_export.sql

# Import to AWS RDS
mysql -h YOUR-RDS-ENDPOINT -u admin -p \
  happytrip_b2b < railway_export.sql
```

---

## Final Recommendation

```
┌──────────────────────────────────────────────────────┐
│                   YES, USE RAILWAY!                  │
│                                                       │
│  ✅ Development/Testing                               │
│  ✅ Staging Environment                               │
│  ✅ MVP/Pilot                                         │
│  ✅ Small user base (< 100 concurrent users)          │
│                                                       │
│  ❌ Large-scale production                            │
│  ❌ High transaction volume                           │
│  ❌ When you need PostgreSQL features                 │
└──────────────────────────────────────────────────────┘
```

**Recommended Path:**
1. Start with Railway MySQL (you already have it!)
2. Build MVP and test features
3. Migrate to AWS RDS PostgreSQL when:
   - Approaching production launch
   - Need better performance
   - Want PostgreSQL features
   - Require enterprise compliance

---

## Next Steps

1. ✅ Run the MySQL schema migration script above
2. ✅ Configure your application ORM
3. ✅ Test database connection
4. ✅ Start building the B2B Portal API
5. ✅ Plan migration to PostgreSQL/RDS when ready

---

**Connection String (for reference):**
```
mysql://root:sKIISLxDAsXpSMARZCbYKHNFomGbtjxx@shinkansen.proxy.rlwy.net:58878/railway
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
