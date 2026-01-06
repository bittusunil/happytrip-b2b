import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessType } from '@prisma/client';

export class RegisterAgentDto {
  @ApiProperty({ example: 'Happy Travels Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  agencyName: string;

  @ApiProperty({ example: 'HAPPY001' })
  @IsString()
  @IsNotEmpty()
  agencyCode: string;

  @ApiProperty({ enum: BusinessType, example: BusinessType.TravelAgency })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  contactPersonName: string;

  @ApiProperty({ example: 'john@happytravels.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123, MG Road' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty({ example: 'Mumbai', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Maharashtra', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ example: 'ABCDE1234F', required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ example: '29ABCDE1234F1Z5', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}
