import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'John' })
  first_name!: string;

  @ApiProperty({ example: 'Doe' })
  last_name!: string;

  @ApiProperty({ example: 'john.doe@gmail.com' })
  email!: string;

  @ApiProperty({ example: true })
  is_active!: boolean;

  @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
  role!: 'user' | 'admin';

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  created_at!: Date;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  updated_at!: Date;
}

export class LoginSuccessDto extends AuthResponseDto {
  @ApiProperty()
  expires_at!: Date;
}
