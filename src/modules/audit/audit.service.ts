import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActorType, ActionCategory, AuditStatus } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: {
    actorId: string;
    actorType: ActorType;
    actorEmail: string;
    action: string;
    actionCategory: ActionCategory;
    targetEntity: string;
    targetId?: string;
    actionDescription: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
    status: AuditStatus;
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
