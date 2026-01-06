# 📘 B2B Travel Portal - Swagger API Documentation Guide

## Overview

The B2B Travel Portal API includes comprehensive Swagger/OpenAPI documentation that is automatically generated from your code annotations.

## Accessing the Documentation

Once your application is running, access the Swagger UI at:

```
http://localhost:3000/api/docs
```

## What's Included

### 1. **API Information**
- Title, description, version
- Contact information
- License information
- Multiple server environments (local, staging, production)

### 2. **Authentication**
- JWT Bearer authentication
- Click "Authorize" button and enter your JWT token
- Format: `Bearer YOUR_TOKEN`

### 3. **API Tags (Modules)**

| Tag | Emoji | Description |
|-----|-------|-------------|
| Authentication | 🔐 | User authentication and authorization |
| Agents | 👥 | Agent management operations |
| Wallets | 💰 | Wallet and credit management |
| Bookings | ✈️🏨 | Flight and hotel bookings |
| Admin | 🛡️ | Administrative operations |
| Reports | 📊 | Reports and analytics |
| Markups | 🏷️ | Markup and pricing rules |
| Notifications | 🔔 | User notifications |
| Audit | 📝 | Audit logs |

### 4. **Response Documentation**

Every endpoint includes:
- **Summary** - Brief description
- **Description** - Detailed explanation with notes
- **Parameters** - Request parameters with types and validation
- **Response Schema** - Response structure with examples
- **Error Responses** - Possible error codes and messages

### 5. **Data Models**

Complete documentation for all DTOs:
- Request body schemas
- Response schemas
- Enum values
- Validation rules

## How to Use Swagger UI

### Step 1: Open the Documentation
Navigate to `http://localhost:3000/api/docs`

### Step 2: Authenticate
1. Click the **"Authorize"** button (🔓) at the top right
2. Enter your JWT token (obtained from `/auth/login`)
3. Click "Authorize"
4. Close the dialog

### Step 3: Explore Endpoints
- Browse by tag/category
- Click on any endpoint to expand details
- View request/response schemas

### Step 4: Try It Out
1. Scroll down to "Try it out" section
2. Fill in required parameters
3. Click "Execute"
4. View the response

## Example: Complete Flow

### 1. Register a New Agent

**Endpoint:** `POST /api/auth/register`

```json
{
  "agencyName": "Happy Travels",
  "agencyCode": "HAPPY001",
  "businessType": "TravelAgency",
  "contactPersonName": "John Doe",
  "email": "john@happytravels.com",
  "phone": "+919876543210",
  "password": "SecurePass123!",
  "addressLine1": "123, MG Road",
  "city": "Mumbai",
  "country": "India",
  "postalCode": "400001",
  "panNumber": "ABCDE1234F"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agencyName": "Happy Travels",
    "agencyCode": "HAPPY001",
    "email": "john@happytravels.com",
    "status": "Pending"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**Endpoint:** `POST /api/auth/login`

```json
{
  "email": "john@happytravels.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@happytravels.com",
    "agencyName": "Happy Travels",
    "status": "Active"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Get Dashboard

**Endpoint:** `GET /api/agents/dashboard`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "agent": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "agencyName": "Happy Travels",
    "email": "john@happytravels.com",
    "status": "Active"
  },
  "wallet": {
    "currentBalance": 50000.50,
    "availableBalance": 45000.50,
    "creditLimit": 100000.00
  },
  "statistics": {
    "totalBookings": 150,
    "confirmedBookings": 120,
    "pendingBookings": 10,
    "cancelledBookings": 20
  }
}
```

## Rate Limiting

| Endpoint | Limit | Duration |
|----------|-------|----------|
| POST /auth/register | 3 | 1 minute |
| POST /auth/login | 5 | 1 minute |
| Other endpoints | 100 | 1 minute |

## Enum Reference

### AgentStatus
```
Pending   - Account awaiting activation
Active    - Account is active
Inactive  - Account is inactive
Suspended - Account temporarily suspended
Blocked   - Account blocked
```

### BookingStatus
```
Pending    - Booking pending confirmation
Confirmed  - Booking confirmed
Processing - Booking being processed
Failed     - Booking failed
Cancelled  - Booking cancelled
Refunded   - Booking refunded
```

### PaymentStatus
```
Pending   - Payment pending
Partial   - Partially paid
Completed - Payment completed
Failed    - Payment failed
Refunded  - Payment refunded
```

### BusinessType
```
OTA            - Online Travel Agency
TravelAgency  - Traditional Travel Agency
Corporate      - Corporate travel
Individual     - Individual agent
```

### BookingType
```
Flight           - Flight booking
Hotel            - Hotel booking
FlightPlusHotel  - Combined booking
```

### PaymentMethod
```
Wallet          - Paid from wallet
Credit           - Paid from credit line
PaymentGateway  - Paid via payment gateway
Mixed           - Multiple payment methods
```

### PaymentGateway
```
Razorpay  - Razorpay
Stripe    - Stripe
Paytm     - Paytm
PhonePe   - PhonePe
PayU      - PayU
CCAvenue  - CCAvenue
```

### CabinClass
```
Economy         - Economy class
PremiumEconomy  - Premium Economy
Business        - Business class
First           - First class
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error - Server error |

## Pagination

For list endpoints, use these query parameters:

```
GET /api/agents?page=1&limit=10
```

**Response Structure:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Custom Features

### 1. **Persist Authorization**
Your JWT token is saved in browser storage for convenience.

### 2. **Request Duration**
Each API call shows the response time in milliseconds.

### 3. **Filtering**
Filter displayed operations by tags or keywords.

### 4. **Deep Linking**
Share direct links to specific endpoints.

### 5. **Syntax Highlighting**
JSON payloads are syntax-highlighted for readability.

### 6. **Custom Styling**
- Color-coded operation blocks (GET=blue, POST=green, PATCH=orange, DELETE=red)
- Color-coded status responses
- Clean, modern UI
- Responsive design

## Exporting Documentation

### Option 1: JSON Export
```
http://localhost:3000/api/docs-json
```

### Option 2: YAML Export
```
http://localhost:3000/api/docs-yaml
```

## Best Practices

### 1. **Document as You Code**
- Add `@ApiOperation` to all endpoints
- Include `@ApiResponse` for all possible responses
- Add example values in `@ApiProperty`

### 2. **Use Descriptive Names**
- Clear endpoint names
- Meaningful parameter names
- Descriptive response examples

### 3. **Include Examples**
- Request body examples
- Response examples
- Error examples

### 4. **Document Enums**
- Add all enum values
- Include descriptions for each value
- Use `@ApiProperty` with enum property

### 5. **Validation Rules**
- Document minimum/maximum values
- Specify required fields
- Add format constraints

## Common Patterns

### Creating DTO with Validation

```typescript
export class CreateBookingDto {
  @ApiProperty({ description: 'Booking type', example: 'Flight' })
  @IsEnum(['Flight', 'Hotel', 'FlightPlusHotel'])
  bookingType: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName: string;
}
```

### Adding Response Documentation

```typescript
@ApiResponse({
  status: 200,
  description: 'Success',
  type: ResponseDto,
  schema: {
    example: {
      id: '123',
      name: 'Example',
    }
  }
})
```

### Documenting Query Parameters

```typescript
@ApiQuery({ name: 'status', required: false, enum: AgentStatus })
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
async findAll(@Query('status') status?: AgentStatus) {
  // ...
}
```

## Next Steps

1. **Run the Application**
   ```bash
   npm run start:dev
   ```

2. **Access Swagger UI**
   ```
   http://localhost:3000/api/docs
   ```

3. **Test Endpoints**
   - Register a new agent
   - Login
   - Explore the dashboard

4. **Add More Documentation**
   - Document new endpoints
   - Add response examples
   - Include error cases

## Additional Resources

- [Swagger Documentation](https://swagger.io/docs/)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)

---

**Version:** 1.0.0
**Last Updated:** 2025-01-15
