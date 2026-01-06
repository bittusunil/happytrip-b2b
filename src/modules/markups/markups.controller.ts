import { Controller, Get, UseGuards } from '@nestjs/common';
import { MarkupsService } from './markups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Markups')
@Controller('markups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MarkupsController {
  constructor(private markupsService: MarkupsService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global markups' })
  async getGlobalMarkups() {
    return this.markupsService.getGlobalMarkups();
  }

  @Get('agent')
  @ApiOperation({ summary: 'Get agent markups' })
  async getAgentMarkups() {
    // For current agent
    return this.markupsService.getAgentMarkups('agent-id');
  }
}
