import { Injectable } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

@Injectable()
export class SwaggerConfigService {
  static getBuilder() {
    return new DocumentBuilder()
      .setTitle('B2B Travel Portal API')
      .setDescription(
        `
# B2B Travel Portal API Documentation

## Overview
A comprehensive RESTful API for managing B2B travel bookings, including agent management, wallet transactions, flight & hotel bookings, and administrative functions.

## Base URL
\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication
This API uses JWT (JSON Web Token) authentication. To access protected endpoints:

1. **Register** or **Login** to receive an access token
2. Include the token in the Authorization header:
   \`\`\`
   Authorization: Bearer YOUR_ACCESS_TOKEN
   \`\`\`

## Response Format
All API responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Success",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
\`\`\`

## Error Handling
The API uses standard HTTP status codes:

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required or invalid
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate email)
- **500 Internal Server Error** - Server error

## Rate Limiting
- **Register**: 3 requests per minute
- **Login**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

## Pagination
For list endpoints, use these query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 10, max: 100)

## Enums Reference

### AgentStatus
- \`Pending\` - Account awaiting activation
- \`Active\` - Account is active
- \`Inactive\` - Account is inactive
- \`Suspended\` - Account temporarily suspended
- \`Blocked\` - Account blocked

### BookingStatus
- \`Pending\` - Booking pending confirmation
- \`Confirmed\` - Booking confirmed
- \`Processing\` - Booking being processed
- \`Failed\` - Booking failed
- \`Cancelled\` - Booking cancelled
- \`Refunded\` - Booking refunded

### PaymentStatus
- \`Pending\` - Payment pending
- \`Partial\` - Partially paid
- \`Completed\` - Payment completed
- \`Failed\` - Payment failed
- \`Refunded\` - Payment refunded

### BusinessType
- \`OTA\` - Online Travel Agency
- \`TravelAgency\` - Traditional Travel Agency
- \`Corporate\` - Corporate travel
- \`Individual\` - Individual agent

### BookingType
- \`Flight\` - Flight booking
- \`Hotel\` - Hotel booking
- \`FlightPlusHotel\` - Combined booking

### TransactionType
- \`Credit\` - Money added
- \`Debit\` - Money deducted
- \`CreditAdjustment\` - Manual credit adjustment
- \`DebitAdjustment\` - Manual debit adjustment
- \`Refund\` - Money refunded

### TransactionCategory
- \`Recharge\` - Wallet recharge
- \`Booking\` - Booking payment
- \`Cancellation\` - Cancellation refund
- \`Refund\` - Refund transaction
- \`Commission\` - Commission earned
- \`Adjustment\` - Manual adjustment
- \`Fee\` - Fee charged
- \`CreditUsed\` - Credit utilized
- \`CreditRepayment\` - Credit repaid

### PaymentMethod
- \`Wallet\` - Paid from wallet
- \`Credit\` - Paid from credit line
- \`PaymentGateway\` - Paid via payment gateway
- \`Mixed\` - Multiple payment methods

### PaymentGateway
- \`Razorpay\` - Razorpay
- \`Stripe\` - Stripe
- \`Paytm\` - Paytm
- \`PhonePe\` - PhonePe
- \`PayU\` - PayU
- \`CCAvenue\` - CCAvenue

### CabinClass
- \`Economy\` - Economy class
- \`PremiumEconomy\` - Premium Economy
- \`Business\` - Business class
- \`First\` - First class

### MealPlan
- \`RoomOnly\` - Room only
- \`Breakfast\` - Breakfast included
- \`HalfBoard\` - Half board (breakfast + dinner)
- \`FullBoard\` - Full board (all meals)
- \`AllInclusive\` - All-inclusive

## Changelog
### v1.0.0 (2025-01-15)
- Initial release
- Authentication endpoints
- Agent management
- Wallet system
- Booking management
- Admin dashboard
- Reports & analytics
- Markup configuration
- Notifications
- Audit logging
      `.trim(),
      )
      .setVersion('1.0.0')
      .setContact(
        'HappyTrip B2B Team',
        'https://happytrip.com',
        'support@happytrip.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer('http://localhost:3000', 'Local Development')
      .addServer('https://api-staging.happytrip.com', 'Staging')
      .addServer('https://api.happytrip.com', 'Production')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token',
          name: 'Authorization',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', '🔐 User authentication and authorization')
      .addTag('Agents', '👥 Agent management operations')
      .addTag('Wallets', '💰 Wallet and credit management')
      .addTag('Bookings', '✈️🏨 Flight and hotel bookings')
      .addTag('Payments', '💳 Payment processing')
      .addTag('Admin', '🛡️ Administrative operations')
      .addTag('Reports', '📊 Reports and analytics')
      .addTag('Markups', '🏷️ Markup and pricing rules')
      .addTag('Notifications', '🔔 User notifications')
      .addTag('Audit', '📝 Audit logs');
  }

  static getCustomOptions(): SwaggerCustomOptions {
    return {
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: false,
        filter: true,
        showRequestDuration: true,
        docExpansion: 'none',
        maxDisplayedTags: 10,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        tryItOutEnabled: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
        validatorUrl: null,
        apisSorter: 'alpha',
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
        deepLinking: true,
      },
      customSiteTitle: 'B2B Travel Portal API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #4299e1; }
        .swagger-ui .topbar-wrapper .link { color: white; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #4299e1; font-size: 32px; }
        .swagger-ui .opblock { margin: 10px 0; border-radius: 6px; }
        .swagger-ui .opblock.get { border-color: #4299e1; }
        .swagger-ui .opblock.post { border-color: #48bb78; }
        .swagger-ui .opblock.patch { border-color: #ed8936; }
        .swagger-ui .opblock.delete { border-color: #f56565; }
      `,
    };
  }
}
