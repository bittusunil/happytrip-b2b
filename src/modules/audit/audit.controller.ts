import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getLogs() {
    return this.auditService.getLogs();
  }
}
