import { Controller, Get, Post, Param, Query, ParseIntPipe, UseGuards, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/booking.dto';
import { BookingStatus } from '@prisma/client';

@ApiTags('Bookings ✈️🏨')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@ApiResponse({ status: 401, description: 'Unauthorized' })
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all bookings for agent',
    description: `Retrieve a paginated list of bookings for the authenticated agent.

**Query Parameters:**
- \`status\`: Filter by booking status
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 10)

**Booking Status:**
- \`Pending\`: Booking pending confirmation
- \`Confirmed\`: Booking confirmed
- \`Processing\`: Booking being processed
- \`Failed\`: Booking failed
- \`Cancelled\`: Booking cancelled
- \`Refunded\`: Booking refunded`,
  })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by booking status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string' },
              bookingReference: { type: 'string', example: 'HTB2025011500001' },
              bookingType: { type: 'string', enum: ['Flight', 'Hotel', 'FlightPlusHotel'] },
              bookingStatus: { type: 'string', enum: BookingStatus },
              paymentStatus: { type: 'string' },
              totalAmount: { type: 'number' },
              currency: { type: 'string', example: 'INR' },
              createdAt: { type: 'string' },
              flightBookings: { type: 'array', items: {} },
              hotelBookings: { type: 'array', items: {} },
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
    @CurrentUser() user: any,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.findAll(user.id, page, limit, status);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get booking by ID',
    description: `Retrieve detailed information about a specific booking including:
- Booking details
- Agent information
- Flight bookings with passengers
- Hotel bookings`,
  })
  @ApiParam({ name: 'id', description: 'Booking ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Booking retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        bookingReference: 'HTB2025011500001',
        bookingType: 'Flight',
        bookingStatus: 'Confirmed',
        paymentStatus: 'Completed',
        totalAmount: 15000.00,
        currency: 'INR',
        agent: {
          id: 'agent-id',
          agencyName: 'Happy Travels',
          agencyCode: 'HAPPY001',
        },
        flightBookings: [
          {
            airlineName: 'Air India',
            flightNumber: 'AI-302',
            originCity: 'Mumbai',
            destCity: 'Delhi',
            departureDate: '2025-02-01T10:30:00Z',
            arrivalDate: '2025-02-01T12:30:00Z',
            passengers: [],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new booking',
    description: `Create a new flight, hotel, or combined booking.

**Process:**
1. Validates customer information
2. Checks wallet balance/credit
3. Creates booking with unique reference
4. Processes payment
5. Returns booking details

**Payment Methods:**
- \`Wallet\`: Deduct from wallet balance
- \`Credit\`: Use credit line
- \`PaymentGateway\`: Process via payment gateway
- \`Mixed\`: Combine multiple payment methods`,
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        bookingReference: 'HTB2025011500001',
        bookingType: 'Flight',
        bookingStatus: 'Pending',
        paymentStatus: 'Pending',
        totalAmount: 15000.00,
        createdAt: '2025-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 402, description: 'Insufficient balance' })
  async create(@CurrentUser() user: any, @Body() createBookingDto: CreateBookingDto) {
    // Implementation to be added
    return { message: 'Booking endpoint to be implemented' };
  }
}
