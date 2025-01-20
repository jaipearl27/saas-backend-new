import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsMongoId, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum BooleanString {
  True = 'true',
  False = 'false',
}

class CallDurationDto {
  @IsOptional()
  @IsString()
  hr: string;

  @IsOptional()
  @IsString()
  min: string;

  @IsOptional()
  @IsString()
  sec: string;
}

export class CreateNoteDto {

  @IsString()
  @IsNotEmpty({ message: 'Attendee ID is required' })
  attendee: string;

  @IsString()
  @IsNotEmpty({ message: 'E-Mail is required' })
  email: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ValidateNested()
  @Type(() => CallDurationDto)
  @IsOptional()
  callDuration: CallDurationDto;

  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  status: string;

  @IsEnum(BooleanString, { message: 'isWorked must be either "true" or "false"' })
  isWorked: BooleanString;

  @IsOptional()
  image: any;
}
