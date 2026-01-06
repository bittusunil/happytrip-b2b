import { Controller, Get, Post, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Get agent wallet' })
  async getWallet(@CurrentUser() user: any) {
    return this.walletsService.getWallet(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.walletsService.getTransactions(user.id, page, limit);
  }

  @Post('add-funds')
  @ApiOperation({ summary: 'Add funds to wallet' })
  async addFunds(
    @CurrentUser() user: any,
    @Body('amount') amount: number,
    @Body('method') method: string,
  ) {
    return this.walletsService.addFunds(user.id, amount, method);
  }
}
