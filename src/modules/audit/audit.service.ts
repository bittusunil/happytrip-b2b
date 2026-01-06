import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: {
    actorId: string;
    actorType: string;
    actorEmail: string;
    action: string;
    actionCategory: string;
    targetEntity: string;
    targetId?: string;
    actionDescription: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    status: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  async getLogs(actorId?: string) {
    return this.prisma.auditLog.findMany({
      where: actorId ? { actorId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
