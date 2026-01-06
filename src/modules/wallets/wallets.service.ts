import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getWallet(agentId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { agentId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Convert Decimal fields to numbers
    return {
      ...wallet,
      currentBalance: Number(wallet.currentBalance),
      availableBalance: Number(wallet.availableBalance),
      blockedBalance: Number(wallet.blockedBalance),
      creditLimit: Number(wallet.creditLimit),
      availableCredit: Number(wallet.availableCredit),
      usedCredit: Number(wallet.usedCredit),
    };
  }

  async getTransactions(agentId: string, page = 1, limit = 10) {
    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { agentId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { agentId } }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addFunds(agentId: string, amount: number, method: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { agentId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          agentId,
          transactionReference: `TXN-${Date.now()}`,
          transactionType: 'Credit',
          transactionCategory: 'Recharge',
          amount,
          openingBalance: wallet.currentBalance,
          closingBalance: Number(wallet.currentBalance) + amount,
          paymentMethod: method,
          status: 'Completed',
          completedAt: new Date(),
        },
      });

      await tx.wallet.update({
        where: { agentId },
        data: {
          currentBalance: { increment: amount },
          availableBalance: { increment: amount },
        },
      });

      return txn;
    });

    return transaction;
  }
}
