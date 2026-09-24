import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for initiating Google OAuth flow
 */
export class GoogleOAuthInitDto {
  @ApiProperty({
    required: false,
    example: 'http://localhost:3000/dashboard',
    description: 'Frontend URL to redirect to after successful Google authentication',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  redirectUrl?: string;
}

/**
 * DTO for Google OAuth callback
 */
export class GoogleOAuthCallbackDto {
  @ApiProperty({
    example: '4/0AY0e-g7...',
    description: 'Authorization code returned from Google OAuth server',
  })
  @IsString()
  code: string;

  @ApiProperty({
    example: 'random_state_string',
    description: 'Anti-CSRF state token sent during initiation',
  })
  @IsString()
  state: string;
}
