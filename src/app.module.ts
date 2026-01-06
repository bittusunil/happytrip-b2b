import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AgentsModule } from './modules/agents/agents.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MarkupsModule } from './modules/markups/markups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', `.env.${process.env.NODE_ENV}`],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per ttl
      },
    ]),

    // Core modules
    PrismaModule,

    // Feature modules
    AuthModule,
    AgentsModule,
    WalletsModule,
    BookingsModule,
    AdminModule,
    ReportsModule,
    MarkupsModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
