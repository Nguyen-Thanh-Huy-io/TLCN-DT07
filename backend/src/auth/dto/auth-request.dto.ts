import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered user email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'A1B2C3',
    description: '6-character OTP verification code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendVerificationEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered user email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Valid JWT refresh token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Valid JWT refresh token to revoke',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ example: 'uuid-user-id', description: 'ID of the user' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class LogoutAllDto {
  @ApiProperty({ example: 'uuid-user-id', description: 'ID of the user' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
