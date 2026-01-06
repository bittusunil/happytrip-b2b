import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsEnum, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class AgentStatusQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by agent status',
    enum: ['Pending', 'Active', 'Inactive', 'Suspended', 'Blocked'],
  })
  @IsOptional()
  @IsEnum(['Pending', 'Active', 'Inactive', 'Suspended', 'Blocked'])
  status?: string;
}

export class BookingQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: ['Pending', 'Confirmed', 'Processing', 'Failed', 'Cancelled', 'Refunded'],
  })
  @IsOptional()
  @IsEnum(['Pending', 'Confirmed', 'Processing', 'Failed', 'Cancelled', 'Refunded'])
  bookingStatus?: string;
}

export class SearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search keyword',
    example: 'Happy Travels',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class MetaResponseDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: MetaResponseDto,
  })
  meta: MetaResponseDto;
}
