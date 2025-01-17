import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateLandingDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subTitle: string;

  @IsObject()
  @IsNotEmptyObject()
  @IsOptional()
  file?: any;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  videoControls: string;

  @IsOptional()
  @IsString()
  buttonName?: string;

  @ValidateIf((o) => o.buttonName)
  @IsString()
  @IsNotEmpty({ message: 'button name is required when buttonName is provided.' })
  link?: string;

  @ValidateIf((o) => o.buttonName)
  @IsString()
  @IsNotEmpty({ message: 'button height is required when buttonName is provided.' })
  buttonHeight?: number;

  @ValidateIf((o) => o.buttonName)
  @IsString()
  @IsNotEmpty({ message: 'button width is required when buttonName is provided.' })
  buttonWidth?: number;
}
