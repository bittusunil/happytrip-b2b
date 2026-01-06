import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getBookingReports(agentId?: string) {
    // This is a simplified version - implement full reporting logic
    return this.prisma.bookingReport.findMany({
      where: agentId ? { agentId } : undefined,
      orderBy: { reportDate: 'desc' },
      take: 30,
    });
  }
}
