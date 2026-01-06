import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerConfigService } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', 'docs'],
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
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
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Swagger documentation
  const config = SwaggerConfigService.getBuilder().build();
  const document = SwaggerModule.createDocument(app, config);

  // Use custom options for better Vercel compatibility
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'B2B Travel Portal API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   🚀 B2B Travel Portal API                                          │
│                                                                      │
│   📍 Local:            http://localhost:${port}                         │
│   📚 Documentation:    http://localhost:${port}/api/docs                   │
│   🗄️  Database:         ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Not configured'}   │
│                                                                      │
│   Environment:        ${process.env.NODE_ENV || 'development'}                          │
│   Version:            1.0.0                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
  `);
  }
}

bootstrap();
