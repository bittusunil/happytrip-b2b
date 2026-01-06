import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalAgents,
      activeAgents,
      totalBookings,
      confirmedBookings,
      totalRevenue,
      pendingApprovals,
    ] = await Promise.all([
      this.prisma.agent.count(),
      this.prisma.agent.count({ where: { status: 'Active' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { bookingStatus: 'Confirmed' } }),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { bookingStatus: 'Confirmed' },
      }),
      this.prisma.agent.count({ where: { status: 'Pending' } }),
    ]);

    return {
      totalAgents,
      activeAgents,
      totalBookings,
      confirmedBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingApprovals,
    };
  }

  async getRecentActivity(limit = 10) {
    const bookings = await this.prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        agent: {
          select: {
            id: true,
            agencyName: true,
            agencyCode: true,
          },
        },
      },
    });

    return bookings;
  }
}
