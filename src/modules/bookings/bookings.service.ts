import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingType, BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(agentId: string, page = 1, limit = 10, status?: BookingStatus) {
    const where = { agentId, ...(status && { bookingStatus: status }) };

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          flightBookings: true,
          hotelBookings: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        agent: {
          select: {
            id: true,
            agencyName: true,
            agencyCode: true,
            email: true,
            phone: true,
          },
        },
        flightBookings: {
          include: { passengers: true },
        },
        hotelBookings: true,
      },
    });
  }

  async generateBookingReference(): Promise<string> {
    const prefix = 'HTB';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    // Find last booking of the day
    const lastBooking = await this.prisma.booking.findFirst({
      where: {
        bookingReference: { startsWith: `${prefix}${dateStr}` },
      },
      orderBy: { bookingReference: 'desc' },
    });

    let sequence = 1;
    if (lastBooking) {
      const lastSequence = parseInt(lastBooking.bookingReference.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${dateStr}${String(sequence).padStart(4, '0')}`;
  }
}
