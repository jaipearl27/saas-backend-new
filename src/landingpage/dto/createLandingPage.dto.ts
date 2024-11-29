import {
  IsBoolean,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateLandingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subTitle: string;

  @IsObject()
  @IsNotEmptyObject()
  @IsOptional()
  file?: any;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  videoControls: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  link?: string;

  @ValidateIf((o) => o.link !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'button name is required when link is provided.' })
  buttonName?: string;

  @ValidateIf((o) => o.link !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'button height is required when link is provided.' })
  buttonHeight?: number;

  @ValidateIf((o) => o.link !== undefined)
  @IsString()
  @IsNotEmpty({ message: 'button width is required when link is provided.' })
  buttonWidth?: number;
}
