
import {
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class CustomLeadTypeDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}
