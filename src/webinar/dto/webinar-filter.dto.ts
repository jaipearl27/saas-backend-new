import { IsObject, IsOptional, IsString } from 'class-validator';
import { RangeNumberDto, RangeStringDto } from 'src/users/dto/filters.dto';

export class WebinarFilterDTO {
  @IsOptional()
  @IsString()
  webinarName?: string;

  @IsOptional()
  @IsObject()
  totalParticipants?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  totalRegistrations?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  totalAttendees?: RangeNumberDto;

  @IsOptional()
  @IsObject()
  webinarDate?: RangeStringDto;
}
