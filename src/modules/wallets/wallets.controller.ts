import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AddFundsDto, WalletResponseDto } from './dto/wallet.dto';

@ApiTags('Wallets 💰')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
@ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get agent wallet',
    description: 'Retrieve the wallet details including balances and credit information for the authenticated agent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully',
    type: WalletResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@CurrentUser() user: any): Promise<WalletResponseDto> {
    return this.walletsService.getWallet(user.id);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get wallet transactions',
    description: 'Retrieve paginated transaction history for the authenticated agent\'s wallet.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              transactionReference: { type: 'string', example: 'TXN-1704287200000' },
              transactionType: { type: 'string', enum: ['Credit', 'Debit'], example: 'Credit' },
              transactionCategory: { type: 'string', example: 'Recharge' },
              amount: { type: 'number', example: 10000 },
              openingBalance: { type: 'number', example: 5000 },
              closingBalance: { type: 'number', example: 15000 },
              status: { type: 'string', enum: ['Pending', 'Completed', 'Failed'], example: 'Completed' },
              createdAt: { type: 'string', example: '2025-01-15T10:30:00Z' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async getTransactions(
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.walletsService.getTransactions(user.id, page, limit);
  }

  @Post('add-funds')
  @ApiOperation({
    summary: 'Add funds to wallet',
    description: 'Add funds to the authenticated agent\'s wallet. This creates a credit transaction and updates the available balance.',
  })
  @ApiResponse({
    status: 201,
    description: 'Funds added successfully',
    schema: {
      properties: {
        id: { type: 'string' },
        transactionReference: { type: 'string', example: 'TXN-1704287200000' },
        transactionType: { type: 'string', example: 'Credit' },
        transactionCategory: { type: 'string', example: 'Recharge' },
        amount: { type: 'number', example: 10000 },
        openingBalance: { type: 'number', example: 5000 },
        closingBalance: { type: 'number', example: 15000 },
        status: { type: 'string', example: 'Completed' },
        completedAt: { type: 'string', example: '2025-01-15T10:30:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async addFunds(
    @CurrentUser() user: any,
    @Body() addFundsDto: AddFundsDto,
  ) {
    return this.walletsService.addFunds(
      user.id,
      addFundsDto.amount,
      addFundsDto.paymentMethod,
    );
  }
}
