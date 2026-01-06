# B2B Travel Portal - Database Design

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        B2B TRAVEL PORTAL DATABASE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │    AGENTS    │──────│AGENT_USERS   │      │   ADMINS     │              │
│  │              │ 1:N  │              │      │              │              │
│  └──────────────┘      └──────────────┘      └──────┬───────┘              │
│         │                                            │                      │
│         │                                            │                      │
│         v                                            v                      │
│  ┌──────────────┐                           ┌──────────────┐              │
│  │   WALLETS    │                      1:N  │ ADMIN_ROLES  │              │
│  │              │                           │              │              │
│  └──────────────┘                           └──────────────┘              │
│         │                                                                 │
│         v                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │ TRANSACTIONS │      │   BOOKINGS   │      │   MARKUPS    │              │
│  │              │      │              │      │              │              │
│  └──────────────┘      └──────────────┘      └──────────────┘              │
│                                     │                                      │
│                                     v                                      │
│                           ┌──────────────┐                                │
│                           │   PAYMENTS   │                                │
│                           │              │                                │
│                           └──────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 AGENTS Table
**Purpose:** Store B2B agent agency information

```sql
CREATE TABLE agents (
    agent_id VARCHAR(36) PRIMARY KEY,
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
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,

    -- Status
    status ENUM('Pending', 'Active', 'Inactive', 'Suspended', 'Blocked') DEFAULT 'Pending',
    verification_status ENUM('Unverified', 'Submitted', 'Under Review', 'Verified', 'Rejected') DEFAULT 'Unverified',

    -- Wallet & Credit
    wallet_balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    available_credit DECIMAL(15,2) DEFAULT 0.00,

    -- Commission & Markup
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    use_custom_markup BOOLEAN DEFAULT FALSE,

    -- Permissions
    permissions JSON, -- {"can_create_subuser": true, "can_configure_markup": false, ...}

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Metadata
    created_by VARCHAR(36), -- admin_id or system
    updated_by VARCHAR(36),
    notes TEXT,

    INDEX idx_email (email),
    INDEX idx_agency_code (agency_code),
    INDEX idx_status (status),
    INDEX idx_verification_status (verification_status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 1.2 AGENT_USERS Table
**Purpose:** Sub-users under agent account

```sql
CREATE TABLE agent_users (
    user_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,

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
    permissions JSON, -- {"can_book": true, "can_view_reports": false, ...}

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    email_verified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,

    UNIQUE KEY unique_agent_email (agent_id, email),
    INDEX idx_agent_id (agent_id),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 1.3 ADMIN_USERS Table
**Purpose:** Admin panel users

```sql
CREATE TABLE admin_users (
    admin_id VARCHAR(36) PRIMARY KEY,

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
    role_id VARCHAR(36) NOT NULL,
    permissions JSON, -- Individual permission overrides

    -- Status
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    email_verified BOOLEAN DEFAULT TRUE,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Metadata
    created_by VARCHAR(36),
    updated_by VARCHAR(36),

    FOREIGN KEY (role_id) REFERENCES admin_roles(role_id),

    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 1.4 ADMIN_ROLES Table
**Purpose:** Define roles and permissions for RBAC

```sql
CREATE TABLE admin_roles (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- SUPER_ADMIN, ADMIN, MANAGER, SUPPORT, ACCOUNTANT
    description TEXT,

    -- Default Permissions for this Role
    permissions JSON NOT NULL,
    -- {
    --   "dashboard": {"view": true},
    --   "agents": {"view": true, "create": true, "edit": true, "delete": false},
    --   "bookings": {"view": true, "edit": true},
    --   "pricing": {"view": true, "edit": false},
    --   "users": {"view": true, "create": true, "edit": true},
    --   "reports": {"view": true, "export": true},
    --   "financial": {"view": true, "manage": false}
    -- }

    -- Hierarchy Level (lower = higher priority)
    hierarchy_level INT DEFAULT 99,

    -- Status
    status ENUM('Active', 'Inactive') DEFAULT 'Active',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 2. BOOKING MANAGEMENT

### 2.1 BOOKINGS Table
**Purpose:** All booking records (flights, hotels)

```sql
CREATE TABLE bookings (
    booking_id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- HTB202401150001

    -- Agent Information
    agent_id VARCHAR(36) NOT NULL,
    booked_by_user_id VARCHAR(36), -- agent_user_id or null if booked by agent

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

    -- Pricing (Before Markup)
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
    confirmation_sent BOOLEAN DEFAULT FALSE,
    ticketed BOOLEAN DEFAULT FALSE,
    ticket_number VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Failure Information (if failed)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 2.2 FLIGHT_BOOKINGS Table
**Purpose:** Flight-specific booking details

```sql
CREATE TABLE flight_bookings (
    flight_booking_id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,

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

    -- Pricing Breakdown
    base_fare DECIMAL(15,2) NOT NULL,
    taxes DECIMAL(15,2) NOT NULL,
    fare_type VARCHAR(50), -- Refundable, Non-refundable, Semi-refundable

    -- Supplier PNR
    pnr VARCHAR(20) NOT NULL,

    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,

    INDEX idx_booking_id (booking_id),
    INDEX idx_departure_date (departure_date),
    INDEX idx_flight_number (flight_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 2.3 FLIGHT_PASSENGERS Table
**Purpose:** Passenger details for flight bookings

```sql
CREATE TABLE flight_passengers (
    passenger_id VARCHAR(36) PRIMARY KEY,
    flight_booking_id VARCHAR(36) NOT NULL,

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
    wheelchair_required BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (flight_booking_id) REFERENCES flight_bookings(flight_booking_id) ON DELETE CASCADE,

    INDEX idx_flight_booking_id (flight_booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 2.4 HOTEL_BOOKINGS Table
**Purpose:** Hotel-specific booking details

```sql
CREATE TABLE hotel_bookings (
    hotel_booking_id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,

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
    child_ages JSON, -- [5, 8, 12]

    -- Stay Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_nights INT NOT NULL,

    -- Inclusions
    meal_plan ENUM('Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive') DEFAULT 'Room Only',
    amenities JSON, -- ["WiFi", "Pool", "Gym", "Spa"]

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 3. FINANCIAL MANAGEMENT

### 3.1 WALLETS Table
**Purpose:** Agent wallet balances

```sql
CREATE TABLE wallets (
    wallet_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL UNIQUE,

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
    is_credit_enabled BOOLEAN DEFAULT FALSE,
    credit_approved BOOLEAN DEFAULT FALSE,
    credit_approved_by VARCHAR(36), -- admin_id
    credit_approved_at TIMESTAMP,

    -- Auto-Recharge Settings
    auto_recharge_enabled BOOLEAN DEFAULT FALSE,
    auto_recharge_threshold DECIMAL(15,2) DEFAULT 5000.00,
    auto_recharge_amount DECIMAL(15,2) DEFAULT 10000.00,

    -- Overdraft Settings
    allow_overdraft BOOLEAN DEFAULT FALSE,
    overdraft_limit DECIMAL(15,2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.2 WALLET_TRANSACTIONS Table
**Purpose:** All wallet transactions

```sql
CREATE TABLE wallet_transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),

    -- Transaction Reference
    transaction_reference VARCHAR(30) UNIQUE NOT NULL, -- WTX2024011500001
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

    -- Approval (for manual credits)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(36), -- admin_id
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Receipt & Invoice
    receipt_url VARCHAR(500),
    invoice_number VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Metadata
    ip_address VARCHAR(45),
    notes TEXT,
    attachments JSON, -- ["receipt1.jpg", "bank_statement.pdf"]

    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),

    INDEX idx_wallet_id (wallet_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_transaction_reference (transaction_reference),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.3 CREDIT_TRANSACTIONS Table
**Purpose:** Credit usage and repayment tracking

```sql
CREATE TABLE credit_transactions (
    credit_transaction_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    booking_id VARCHAR(36),

    -- Transaction Reference
    transaction_reference VARCHAR(30) UNIQUE NOT NULL, -- CTX2024011500001
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
    approved_by VARCHAR(36), -- admin_id
    approved_at TIMESTAMP,
    valid_till DATE, -- Credit repayment due date
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 3.4 PAYMENTS Table
**Purpose:** Payment gateway transactions

```sql
CREATE TABLE payments (
    payment_id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36),
    wallet_transaction_id VARCHAR(36),
    agent_id VARCHAR(36) NOT NULL,

    -- Payment Reference
    payment_reference VARCHAR(30) UNIQUE NOT NULL, -- PAY2024011500001
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

    -- Card Details (encrypted/tokenized)
    card_last_4_digits VARCHAR(4),
    card_holder_name VARCHAR(100),
    card_type VARCHAR(50), -- Visa, Mastercard, Amex

    -- Bank Details
    bank_name VARCHAR(100),
    bank_transaction_id VARCHAR(100),

    -- Status
    status ENUM('Initiated', 'Pending', 'Completed', 'Failed', 'Refunded', 'Partially_Refunded') DEFAULT 'Initiated',

    -- Response
    gateway_response JSON, -- Full response from payment gateway
    failure_reason TEXT,

    -- Refund Details
    refund_amount DECIMAL(15,2) DEFAULT 0.00,
    refund_reference VARCHAR(100),
    refund_status ENUM('None', 'Initiated', 'Pending', 'Completed', 'Failed') DEFAULT 'None',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. MARKUP & PRICING MANAGEMENT

### 4.1 GLOBAL_MARKUPS Table
**Purpose:** Platform-wide markup rules for B2C

```sql
CREATE TABLE global_markups (
    markup_id VARCHAR(36) PRIMARY KEY,

    -- Markup Configuration
    markup_name VARCHAR(255) NOT NULL,
    markup_type ENUM('Flight', 'Hotel') NOT NULL,
    rule_type ENUM('Default', 'Route', 'Airline', 'Hotel_Criteria') NOT NULL,

    -- Applicability
    market_type ENUM('B2C', 'B2B_Default') NOT NULL DEFAULT 'B2C',
    status ENUM('Active', 'Inactive') DEFAULT 'Active',

    -- Priority (higher = applied first)
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
    created_by VARCHAR(36), -- admin_id
    updated_by VARCHAR(36),

    INDEX idx_markup_type (markup_type),
    INDEX idx_rule_type (rule_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 4.2 AGENT_MARKUPS Table
**Purpose:** Agent-specific markup configurations

```sql
CREATE TABLE agent_markups (
    agent_markup_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,

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
    is_admin_override BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36), -- admin_id or agent_user_id
    updated_by VARCHAR(36),

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    INDEX idx_agent_id (agent_id),
    INDEX idx_markup_type (markup_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. REPORTS & ANALYTICS

### 5.1 BOOKING_REPORTS Table (Materialized View or Summary Table)
**Purpose:** Pre-computed booking statistics for faster reporting

```sql
CREATE TABLE booking_reports (
    report_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36),

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 5.2 FINANCIAL_STATEMENTS Table
**Purpose:** Monthly financial statements for agents

```sql
CREATE TABLE financial_statements (
    statement_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,

    -- Statement Period
    statement_period VARCHAR(7) NOT NULL, -- YYYY-MM
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
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,

    FOREIGN KEY (agent_id) REFERENCES agents(agent_id),

    UNIQUE KEY unique_agent_period (agent_id, statement_period),
    INDEX idx_agent_id (agent_id),
    INDEX idx_statement_period (statement_period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. AUDIT & LOGGING

### 6.1 AUDIT_LOGS Table
**Purpose:** Track all critical actions for compliance and debugging

```sql
CREATE TABLE audit_logs (
    audit_id VARCHAR(36) PRIMARY KEY,

    -- Actor
    actor_id VARCHAR(36) NOT NULL,
    actor_type ENUM('Admin', 'Agent', 'Agent_User', 'System') NOT NULL,
    actor_email VARCHAR(255),

    -- Action
    action VARCHAR(100) NOT NULL, -- LOGIN, CREATE_BOOKING, UPDATE_MARKUP, APPROVE_PAYMENT
    action_category ENUM('Authentication', 'Booking', 'Financial', 'Configuration', 'User_Management', 'System') NOT NULL,

    -- Target
    target_entity VARCHAR(50) NOT NULL, -- Agent, Booking, Wallet, Markup
    target_id VARCHAR(36),

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### 6.2 SYSTEM_LOGS Table
**Purpose:** Application logs and error tracking

```sql
CREATE TABLE system_logs (
    log_id VARCHAR(36) PRIMARY KEY,

    -- Log Level
    log_level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,

    -- Log Details
    log_category VARCHAR(100) NOT NULL, -- API, Database, PaymentGateway, EmailService
    message TEXT NOT NULL,
    details JSON,

    -- Context
    request_id VARCHAR(50),
    user_id VARCHAR(36),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 7. NOTIFICATIONS & COMMUNICATIONS

### 7.1 NOTIFICATIONS Table
**Purpose:** User notifications

```sql
CREATE TABLE notifications (
    notification_id VARCHAR(36) PRIMARY KEY,

    -- Recipient
    recipient_id VARCHAR(36) NOT NULL,
    recipient_type ENUM('Admin', 'Agent', 'Agent_User') NOT NULL,

    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('Booking', 'Payment', 'System', 'Promotion', 'Alert') NOT NULL,

    -- Reference
    reference_type VARCHAR(50), -- Booking, Wallet, Agent
    reference_id VARCHAR(36),

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    -- Delivery
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 8. SETTINGS & CONFIGURATION

### 8.1 SYSTEM_SETTINGS Table
**Purpose:** Application-wide settings

```sql
CREATE TABLE system_settings (
    setting_id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('String', 'Number', 'Boolean', 'JSON') NOT NULL,
    category VARCHAR(100), -- Payment, Email, SMS, General, Booking
    description TEXT,
    is_editable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Settings
INSERT INTO system_settings (setting_id, setting_key, setting_value, setting_type, category, description) VALUES
('UUID1', 'default_currency', 'INR', 'String', 'General', 'Default currency for bookings'),
('UUID2', 'min_booking_amount', '100', 'Number', 'Booking', 'Minimum booking amount'),
('UUID3', 'max_login_attempts', '5', 'Number', 'Security', 'Maximum failed login attempts'),
('UUID4', 'session_timeout', '1800', 'Number', 'Security', 'Session timeout in seconds'),
('UUID5', 'maintenance_mode', 'false', 'Boolean', 'General', 'Maintenance mode status');
```

---

## DATABASE INDEXES SUMMARY

### Performance Optimization Indexes

```sql
-- Composite Indexes for Common Queries

-- Agent dashboard queries
CREATE INDEX idx_agent_dashboard ON bookings(agent_id, created_at, booking_status);

-- Wallet transaction history
CREATE INDEX idx_wallet_history ON wallet_transactions(agent_id, created_at, transaction_type);

-- Booking search
CREATE INDEX idx_booking_search ON bookings(booking_reference, agent_id, booking_status);

-- Financial reports
CREATE INDEX idx_financial_reports ON wallet_transactions(agent_id, transaction_type, created_at);

-- Agent markup lookup
CREATE INDEX idx_agent_markup_lookup ON agent_markups(agent_id, markup_type, status, priority);
```

---

## DATABASE VIEWS

### View: AGENT_WALLET_SUMMARY
```sql
CREATE VIEW agent_wallet_summary AS
SELECT
    a.agent_id,
    a.agency_name,
    a.email,
    w.current_balance,
    w.blocked_balance,
    w.available_balance,
    w.credit_limit,
    w.available_credit,
    w.status
FROM agents a
LEFT JOIN wallets w ON a.agent_id = w.agent_id
WHERE a.deleted_at IS NULL;
```

### View: BOOKING_FINANCIAL_SUMMARY
```sql
CREATE VIEW booking_financial_summary AS
SELECT
    b.booking_id,
    b.booking_reference,
    b.agent_id,
    a.agency_name,
    b.booking_type,
    b.total_amount,
    b.markup_amount,
    b.commission_amount,
    b.payment_status,
    b.booking_status,
    b.created_at,
    wt.transaction_reference as payment_txn_ref
FROM bookings b
JOIN agents a ON b.agent_id = a.agent_id
LEFT JOIN wallet_transactions wt ON b.booking_id = wt.booking_id;
```

---

## SAMPLE DATA

### Sample Admin Role
```sql
INSERT INTO admin_roles (role_id, role_name, role_code, description, permissions, hierarchy_level) VALUES
('ROLE-001', 'Super Admin', 'SUPER_ADMIN', 'Full system access', '{
    "dashboard": {"view": true},
    "agents": {"view": true, "create": true, "edit": true, "delete": true},
    "bookings": {"view": true, "edit": true, "delete": true},
    "pricing": {"view": true, "edit": true, "delete": true},
    "users": {"view": true, "create": true, "edit": true, "delete": true},
    "reports": {"view": true, "export": true},
    "financial": {"view": true, "manage": true, "approve": true}
}', 1);
```

---

## MIGRATION NOTES

### Version Control
- Use migration tools: Flyway, Liquibase, or Prisma
- Maintain versioned migration scripts
- Always test migrations on staging first

### Rollback Strategy
- Keep rollback scripts for each migration
- Backup database before major migrations
- Use transactions for schema changes

---

## SECURITY CONSIDERATIONS

### 1. Sensitive Data Protection
- Password hashes: Use bcrypt/Argon2
- PII: Encrypt at rest for sensitive fields
- Use prepared statements to prevent SQL injection

### 2. Access Control
- Implement Row-Level Security (RLS)
- Use views to restrict data access
- Audit all financial transactions

### 3. Data Retention
- Define retention policies for logs
- Archive old bookings after 3 years
- Anonymize PII after regulatory period

---

## PERFORMANCE TUNING

### 1. Partitioning Strategy
```sql
-- Partition bookings by year for better performance
ALTER TABLE bookings PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pfuture VALUES LESS THAN MAXVALUE
);
```

### 2. Caching Strategy
- Cache agent permissions (Redis)
- Cache markup rules (Redis)
- Cache wallet balances (Redis with TTL)

---

## SUMMARY

**Total Tables:** 18 core tables
**Total Views:** 2
**Total Indexes:** 50+ (including composite)

**Key Features:**
- ✅ Multi-tenant B2B agent management
- ✅ Sub-user management under agents
- ✅ RBAC for admin users
- ✅ Wallet & credit management
- ✅ Flexible markup system (global + agent-specific)
- ✅ Flight & Hotel booking support
- ✅ Comprehensive audit logging
- ✅ Financial reporting
- ✅ Payment gateway integration
- ✅ Notification system
