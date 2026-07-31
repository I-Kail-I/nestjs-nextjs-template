import { RegisterSchema } from '@template/schema';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterSchema) {}
