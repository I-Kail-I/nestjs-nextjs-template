import { AuthResponseSchema } from '@template/schema';
import { createZodDto } from 'nestjs-zod';

export class AuthResponseDto extends createZodDto(AuthResponseSchema) {}
