import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';

export class CreateTestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  url!: string;

  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method!: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  body?: Record<string, any>;

  @IsNumber()
  @Min(1)
  @Max(1000)
  totalRequests!: number;

  @IsNumber()
  @Min(1)
  @Max(50)
  concurrency!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5000)
  delay?: number;

  @IsString()
  socketId!: string;
}
