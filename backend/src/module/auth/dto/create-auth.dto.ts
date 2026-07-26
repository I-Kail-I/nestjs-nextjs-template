import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @ApiProperty()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @ApiPropertyOptional()
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  password!: string;
}
