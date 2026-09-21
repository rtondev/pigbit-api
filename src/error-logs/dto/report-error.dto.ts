import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReportErrorDto {
  @IsOptional()
  @IsIn(['frontend', 'backend'])
  source?: 'frontend' | 'backend';

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
