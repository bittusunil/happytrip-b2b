import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Bad Request',
  })
  message: string;

  @ApiProperty({
    description: 'Validation errors',
    example: ['email must be an email', 'password must be longer than 8 characters'],
    required: false,
  })
  error?: string[];
}

export class SuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: true;

  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
    required: false,
  })
  message?: string;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;
}
