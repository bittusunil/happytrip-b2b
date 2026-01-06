import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAgentDto, LoginDto, AuthResponseDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication 🔐')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new B2B agent',
    description: `Register a new B2B travel agency. The account will be created with 'Pending' status and requires admin approval before activation.

**Important Notes:**
- Agency code must be unique
- Email must be unique
- Password must be at least 8 characters
- Account will be created with Pending status
- A wallet will be automatically created with zero balance`,
  })
  @ApiResponse({
    status: 201,
    description: 'Agent registered successfully',
    type: AuthResponseDto,
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          agencyName: 'Happy Travels Pvt Ltd',
          agencyCode: 'HAPPY001',
          email: 'john@happytravels.com',
          phone: '+919876543210',
          status: 'Pending',
          verificationStatus: 'Unverified',
          createdAt: '2025-01-15T10:30:00Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email or agency code already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() dto: RegisterAgentDto): Promise<AuthResponseDto> {
    return this.authService.registerAgent(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agent login',
    description: `Authenticate an agent and receive JWT tokens.

**Requirements:**
- Email must be registered
- Password must match
- Account status must be 'Active'

**Returns:**
- Access token (valid for 7 days)
- Refresh token (valid for 30 days)
- User profile data`,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john@happytravels.com',
          agencyName: 'Happy Travels Pvt Ltd',
          agencyCode: 'HAPPY001',
          status: 'Active',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account not active' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current agent profile',
    description: 'Retrieve the complete profile of the authenticated agent including wallet information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        agencyName: 'Happy Travels Pvt Ltd',
        agencyCode: 'HAPPY001',
        businessType: 'TravelAgency',
        email: 'john@happytravels.com',
        phone: '+919876543210',
        status: 'Active',
        verificationStatus: 'Verified',
        walletBalance: 50000.50,
        creditLimit: 100000.00,
        availableCredit: 100000.00,
        wallet: {
          id: 'wallet-id',
          currentBalance: 50000.50,
          availableBalance: 45000.50,
          blockedBalance: 5000.00,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change agent password',
    description: `Change the password for the authenticated agent.

**Requirements:**
- Old password must match current password
- New password must be at least 8 characters`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['oldPassword', 'newPassword'],
      properties: {
        oldPassword: { type: 'string', minLength: 8, description: 'Current password' },
        newPassword: { type: 'string', minLength: 8, description: 'New password' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async changePassword(
    @CurrentUser() user: any,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(user.id, oldPassword, newPassword);
  }
}
