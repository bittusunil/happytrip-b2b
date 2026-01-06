import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AgentStatus, VerificationStatus } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Agents 👥')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get agent dashboard',
    description: `Retrieve the authenticated agent's dashboard including statistics, wallet information, and recent bookings.

**Dashboard includes:**
- Agent information
- Wallet balances
- Booking statistics (total, confirmed, pending, cancelled)
- Recent bookings (last 5)`,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retrieved successfully',
    schema: {
      example: {
        agent: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          agencyName: 'Happy Travels',
          agencyCode: 'HAPPY001',
          email: 'john@happytravels.com',
          phone: '+919876543210',
          status: 'Active',
          verificationStatus: 'Verified',
        },
        wallet: {
          id: 'wallet-id',
          currentBalance: 50000.50,
          availableBalance: 45000.50,
          creditLimit: 100000.00,
          availableCredit: 100000.00,
        },
        statistics: {
          totalBookings: 150,
          confirmedBookings: 120,
          pendingBookings: 10,
          cancelledBookings: 20,
        },
        recentBookings: [],
      },
    },
  })
  async getDashboard(@CurrentUser() user: any) {
    return this.agentsService.getDashboard(user.id);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get platform statistics',
    description: 'Retrieve overall platform statistics. **Admin access required.**',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        totalAgents: 150,
        activeAgents: 120,
        pendingAgents: 10,
        totalBookings: 5000,
        totalRevenue: 2500000.00,
      },
    },
  })
  async getStats() {
    return this.agentsService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'List all agents',
    description: `Retrieve a paginated list of all agents. **Admin access required.**

**Query Parameters:**
- \`status\`: Filter by agent status
- \`search\`: Search by name, code, or email
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 10)`,
  })
  @ApiQuery({ name: 'status', required: false, enum: AgentStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              agencyName: { type: 'string', example: 'Happy Travels' },
              agencyCode: { type: 'string', example: 'HAPPY001' },
              email: { type: 'string', example: 'john@happytravels.com' },
              phone: { type: 'string', example: '+919876543210' },
              status: { type: 'string', enum: Object.values(AgentStatus) },
              verificationStatus: { type: 'string' },
              walletBalance: { type: 'number' },
              creditLimit: { type: 'number' },
              createdAt: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async findAll(
    @Query('status') status?: AgentStatus,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.agentsService.findAll(status, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get agent by ID',
    description: 'Retrieve detailed information about a specific agent. **Admin access required.**',
  })
  @ApiParam({ name: 'id', description: 'Agent ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Agent retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        agencyName: 'Happy Travels',
        agencyCode: 'HAPPY001',
        businessType: 'TravelAgency',
        email: 'john@happytravels.com',
        phone: '+919876543210',
        status: 'Active',
        wallet: {
          currentBalance: 50000.50,
          availableBalance: 45000.50,
          creditLimit: 100000.00,
        },
        _count: {
          bookings: 150,
          users: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update agent status',
    description: `Update the status of an agent. **Admin access required.**

**Possible statuses:**
- \`Pending\`: Account awaiting activation
- \`Active\`: Account is active
- \`Inactive\`: Account is inactive
- \`Suspended\`: Account temporarily suspended
- \`Blocked\`: Account blocked`,
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        agencyName: 'Happy Travels',
        agencyCode: 'HAPPY001',
        status: 'Active',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
  ) {
    return this.agentsService.updateStatus(id, status);
  }

  @Patch(':id/verification')
  @ApiOperation({
    summary: 'Update verification status',
    description: `Update the verification status of an agent. **Admin access required.**

**Possible statuses:**
- \`Unverified\`: Initial state
- \`Submitted\`: Documents submitted
- \`UnderReview\`: Verification in progress
- \`Verified\`: Verification complete
- \`Rejected\`: Verification failed`,
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({
    status: 200,
    description: 'Verification status updated',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        agencyName: 'Happy Travels',
        verificationStatus: 'Verified',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body('status') status: VerificationStatus,
  ) {
    return this.agentsService.updateVerificationStatus(id, status);
  }

  @Patch(':id/credit')
  @ApiOperation({
    summary: 'Update credit limit',
    description: `Update the credit limit for an agent. **Admin access required.**

**Note:** Available credit is automatically calculated as \`creditLimit - usedCredit\`.`,
  })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit limit updated',
    schema: {
      example: {
        agentId: '550e8400-e29b-41d4-a716-446655440000',
        creditLimit: 100000.00,
        availableCredit: 100000.00,
        usedCredit: 0.00,
        isCreditEnabled: true,
        creditApproved: true,
        creditApprovedAt: '2025-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
  ) {
    return this.agentsService.updateCreditLimit(id, creditLimit);
  }
}
