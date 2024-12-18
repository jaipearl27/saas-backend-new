import { IsOptional, IsString, IsObject, IsMongoId } from 'class-validator';
import { RangeNumberDto } from './filters.dto';


export class EmployeeFilterDTO {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  isActive?: string;

  @IsOptional()
  @IsMongoId()
  role?: string;

  @IsOptional()
  @IsObject()
  validCallTime?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  dailyContactLimit?: RangeNumberDto;
}
