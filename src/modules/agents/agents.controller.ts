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
} from '@nestjs/swagger';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get agent dashboard' })
  async getDashboard(@CurrentUser() user: any) {
    return this.agentsService.getDashboard(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  async getStats() {
    return this.agentsService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents (Admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: AgentStatus })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('status') status?: AgentStatus,
    @Query('search') search?: string,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    return this.agentsService.findAll(status, page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update agent status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AgentStatus,
  ) {
    return this.agentsService.updateStatus(id, status);
  }

  @Patch(':id/verification')
  @ApiOperation({ summary: 'Update verification status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body('status') status: VerificationStatus,
  ) {
    return this.agentsService.updateVerificationStatus(id, status);
  }

  @Patch(':id/credit')
  @ApiOperation({ summary: 'Update credit limit (Admin only)' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  async updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
  ) {
    return this.agentsService.updateCreditLimit(id, creditLimit);
  }
}
