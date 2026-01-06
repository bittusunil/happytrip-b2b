import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('B2B Travel Portal API')
    .setDescription(
      `API documentation for B2B Travel Portal

## Authentication

This API uses JWT authentication. To access protected endpoints:
1. Register or login to get an access token
2. Include the token in the Authorization header: \`Bearer YOUR_TOKEN\`

## Response Format

All responses follow this format:

\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Success"
}
\`\`\`

## Error Handling

Errors return appropriate HTTP status codes:

- 400: Bad Request - Validation errors
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server error`,
    )
    .setVersion('1.0')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Agents', 'Agent management')
    .addTag('Wallets', 'Wallet and credit management')
    .addTag('Bookings', 'Flight and hotel bookings')
    .addTag('Payments', 'Payment processing')
    .addTag('Admin', 'Admin panel endpoints')
    .addTag('Reports', 'Reports and analytics')
    .addTag('Markups', 'Markup configuration')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'B2B Travel Portal API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🚀 B2B Travel Portal API is running!                     │
│                                                             │
│   📍 Local:            http://localhost:${port}                   │
│   📚 Documentation:    http://localhost:${port}/api/docs           │
│   🗄️  Prisma Studio:   npx prisma studio                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
  `);
}

bootstrap();
