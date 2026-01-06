import { IsEnum, IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PassengerDto {
  @ApiProperty({ description: 'Passenger title', enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Inf'] })
  @IsEnum(['Mr', 'Mrs', 'Ms', 'Dr', 'Mstr', 'Inf'])
  title: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Date of birth', type: Date })
  @IsString()
  dateOfBirth: string;

  @ApiProperty({ description: 'Gender', enum: ['Male', 'Female', 'Other'] })
  @IsEnum(['Male', 'Female', 'Other'])
  gender: string;

  @ApiProperty({ description: 'Passport number', required: false })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiProperty({ description: 'Passport expiry date', required: false })
  @IsOptional()
  @IsString()
  passportExpiry?: string;

  @ApiProperty({ description: 'Meal preference', required: false })
  @IsOptional()
  @IsString()
  mealPreference?: string;
}

export class FlightBookingDto {
  @ApiProperty({ description: 'Airline code', example: 'AI' })
  @IsString()
  airlineCode: string;

  @ApiProperty({ description: 'Flight number', example: 'AI-302' })
  @IsString()
  flightNumber: string;

  @ApiProperty({ description: 'Origin airport code', example: 'BOM' })
  @IsString()
  originAirportCode: string;

  @ApiProperty({ description: 'Destination airport code', example: 'DEL' })
  @IsString()
  destinationAirportCode: string;

  @ApiProperty({ description: 'Departure date', example: '2025-02-01T10:30:00Z' })
  @IsString()
  departureDate: string;

  @ApiProperty({ description: 'Cabin class', enum: ['Economy', 'PremiumEconomy', 'Business', 'First'] })
  @IsEnum(['Economy', 'PremiumEconomy', 'Business', 'First'])
  cabinClass: string;

  @ApiProperty({ description: 'Base fare', example: 8500.00 })
  @IsNumber()
  baseFare: number;

  @ApiProperty({ description: 'Taxes and fees', example: 1500.00 })
  @IsNumber()
  taxes: number;

  @ApiProperty({ description: 'Passengers', type: [PassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];
}

export class HotelBookingDto {
  @ApiProperty({ description: 'Hotel ID', example: 'HOT123' })
  @IsString()
  hotelId: string;

  @ApiProperty({ description: 'Hotel name', example: 'Taj Palace' })
  @IsString()
  hotelName: string;

  @ApiProperty({ description: 'Room type', example: 'Deluxe Room' })
  @IsString()
  roomType: string;

  @ApiProperty({ description: 'Number of rooms', example: 2 })
  @IsNumber()
  numberOfRooms: number;

  @ApiProperty({ description: 'Number of adults', example: 4 })
  @IsNumber()
  numberOfAdults: number;

  @ApiProperty({ description: 'Number of children', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  numberOfChildren?: number;

  @ApiProperty({ description: 'Check-in date', example: '2025-02-01T14:00:00Z' })
  @IsString()
  checkInDate: string;

  @ApiProperty({ description: 'Check-out date', example: '2025-02-03T11:00:00Z' })
  @IsString()
  checkOutDate: string;

  @ApiProperty({ description: 'Meal plan', enum: ['Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive'], required: false })
  @IsOptional()
  @IsEnum(['Room Only', 'Breakfast', 'Half Board', 'Full Board', 'All Inclusive'])
  mealPlan?: string;

  @ApiProperty({ description: 'Room rate per night', example: 5000.00 })
  @IsNumber()
  roomRatePerNight: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Booking type', enum: ['Flight', 'Hotel', 'FlightPlusHotel'] })
  @IsEnum(['Flight', 'Hotel', 'FlightPlusHotel'])
  bookingType: string;

  @ApiProperty({ description: 'Customer title', enum: ['Mr', 'Mrs', 'Ms', 'Dr'] })
  @IsEnum(['Mr', 'Mrs', 'Ms', 'Dr'])
  customerTitle: string;

  @ApiProperty({ description: 'Customer first name' })
  @IsString()
  customerFirstName: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsString()
  customerLastName: string;

  @ApiProperty({ description: 'Customer email' })
  @IsString()
  customerEmail: string;

  @ApiProperty({ description: 'Customer phone' })
  @IsString()
  customerPhone: string;

  @ApiProperty({ description: 'Payment method', enum: ['Wallet', 'Credit', 'Payment Gateway', 'Mixed'] })
  @IsEnum(['Wallet', 'Credit', 'Payment Gateway', 'Mixed'])
  paymentMethod: string;

  @ApiProperty({ description: 'Flight details (required for Flight bookings)', type: FlightBookingDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => FlightBookingDto)
  flight?: FlightBookingDto;

  @ApiProperty({ description: 'Hotel details (required for Hotel bookings)', type: HotelBookingDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => HotelBookingDto)
  hotel?: HotelBookingDto;
}
