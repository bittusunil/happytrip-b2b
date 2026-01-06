import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarkupsService {
  constructor(private prisma: PrismaService) {}

  async getGlobalMarkups() {
    return this.prisma.globalMarkup.findMany({
      where: { status: 'Active' },
      orderBy: { priority: 'desc' },
    });
  }

  async getAgentMarkups(agentId: string) {
    return this.prisma.agentMarkup.findMany({
      where: { agentId, status: 'Active' },
      orderBy: { priority: 'desc' },
    });
  }
}
