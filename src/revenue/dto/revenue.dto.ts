import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class RevenueDto {
  @IsDateString()
  start: string;
  
  @IsDateString()
  end: string;
}

export class RevenueTrendDto extends RevenueDto {
  @IsIn(['day', 'month'])
  @IsOptional()
  interval: 'day' | 'month' = 'day';
}

export class TopItemsDto extends RevenueDto {
  @IsString()
  @IsOptional()
  limit: string;
}
