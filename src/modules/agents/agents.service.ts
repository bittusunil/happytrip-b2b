import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentStatus, VerificationStatus } from '@prisma/client';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private prisma: PrismaService) {}

  async getDashboard(agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        wallet: true,
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Get booking statistics
    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
    ] = await Promise.all([
      this.prisma.booking.count({ where: { agentId } }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Confirmed' },
      }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Pending' },
      }),
      this.prisma.booking.count({
        where: { agentId, bookingStatus: 'Cancelled' },
      }),
    ]);

    return {
      agent: {
        id: agent.id,
        agencyName: agent.agencyName,
        agencyCode: agent.agencyCode,
        email: agent.email,
        phone: agent.phone,
        status: agent.status,
        verificationStatus: agent.verificationStatus,
      },
      wallet: agent.wallet,
      statistics: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
      },
      recentBookings: agent.bookings,
    };
  }

  async findAll(
    status?: AgentStatus,
    page = 1,
    limit = 10,
    search?: string,
  ) {
    const where = status ? { status } : {};

    if (search) {
      Object.assign(where, {
        OR: [
          { agencyName: { contains: search, mode: 'insensitive' as const } },
          { agencyCode: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      });
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        select: {
          id: true,
          agencyName: true,
          agencyCode: true,
          email: true,
          phone: true,
          status: true,
          verificationStatus: true,
          walletBalance: true,
          creditLimit: true,
          availableCredit: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      data: agents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        wallet: true,
        _count: {
          select: {
            bookings: true,
            users: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const { passwordHash, resetPasswordToken, ...result } = agent;
    return result;
  }

  async updateStatus(id: string, status: AgentStatus) {
    return this.prisma.agent.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        agencyName: true,
        agencyCode: true,
        status: true,
      },
    });
  }

  async updateVerificationStatus(id: string, status: VerificationStatus) {
    return this.prisma.agent.update({
      where: { id },
      data: { verificationStatus: status },
      select: {
        id: true,
        agencyName: true,
        agencyCode: true,
        verificationStatus: true,
      },
    });
  }

  async updateCreditLimit(id: string, creditLimit: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const usedCredit = agent.wallet?.usedCredit || 0;
    const availableCredit = creditLimit - usedCredit;

    await this.prisma.agent.update({
      where: { id },
      data: { creditLimit },
    });

    return this.prisma.wallet.update({
      where: { agentId: id },
      data: {
        creditLimit,
        availableCredit,
        creditApproved: true,
        creditApprovedAt: new Date(),
      },
    });
  }

  async getStats() {
    const [
      totalAgents,
      activeAgents,
      pendingAgents,
      totalBookings,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.agent.count(),
      this.prisma.agent.count({ where: { status: 'Active' } }),
      this.prisma.agent.count({ where: { status: 'Pending' } }),
      this.prisma.booking.count(),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalAgents,
      activeAgents,
      pendingAgents,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }
}
