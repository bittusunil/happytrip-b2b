import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as any, (e: any) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('error' as any, (e: any) => {
      this.logger.error(`Database error: ${e.message}`);
    });

    this.$on('warn' as any, (e: any) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });

    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Run in transaction for safety
    return this.$transaction([
      this.notification.deleteMany(),
      this.systemLog.deleteMany(),
      this.auditLog.deleteMany(),
      this.walletTransaction.deleteMany(),
      this.creditTransaction.deleteMany(),
      this.payment.deleteMany(),
      this.flightPassenger.deleteMany(),
      this.flightBooking.deleteMany(),
      this.hotelBooking.deleteMany(),
      this.booking.deleteMany(),
      this.agentMarkup.deleteMany(),
      this.globalMarkup.deleteMany(),
      this.bookingReport.deleteMany(),
      this.financialStatement.deleteMany(),
      this.wallet.deleteMany(),
      this.agentUser.deleteMany(),
      this.agent.deleteMany(),
      this.adminUser.deleteMany(),
      this.adminRole.deleteMany(),
      this.systemSetting.deleteMany(),
    ]);
  }
}
