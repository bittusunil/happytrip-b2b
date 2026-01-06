import { IsNumber, IsString, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddFundsDto {
  @ApiProperty({
    description: 'Amount to add',
    example: 10000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'Bank Transfer',
    enum: ['Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Payment Gateway', 'Cash', 'Cheque'],
  })
  @IsString()
  @IsEnum(['Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Payment Gateway', 'Cash', 'Cheque'])
  paymentMethod: string;
}

export class WalletResponseDto {
  @ApiProperty({
    description: 'Wallet ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Current wallet balance',
    example: 50000.50,
  })
  currentBalance: number;

  @ApiProperty({
    description: 'Blocked balance',
    example: 5000.00,
  })
  blockedBalance: number;

  @ApiProperty({
    description: 'Available balance',
    example: 45000.50,
  })
  availableBalance: number;

  @ApiProperty({
    description: 'Credit limit',
    example: 100000.00,
  })
  creditLimit: number;

  @ApiProperty({
    description: 'Used credit',
    example: 20000.00,
  })
  usedCredit: number;

  @ApiProperty({
    description: 'Available credit',
    example: 80000.00,
  })
  availableCredit: number;

  @ApiProperty({
    description: 'Wallet status',
    enum: ['Active', 'Frozen', 'Blocked'],
    example: 'Active',
  })
  status: string;

  @ApiProperty({
    description: 'Is credit enabled',
    example: true,
  })
  isCreditEnabled: boolean;
}
