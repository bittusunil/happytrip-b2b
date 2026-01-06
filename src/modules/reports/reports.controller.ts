import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'Get booking reports' })
  async getBookingReports() {
    return this.reportsService.getBookingReports();
  }
}
