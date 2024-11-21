import { IsString, IsNotEmpty, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateSidebarLinkDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Title is too short' })
  @MaxLength(50, { message: 'Title is too long' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid URL format' })
  @MinLength(1, { message: 'Link is too short' })
  @MaxLength(2048, { message: 'Link is too long' })
  link: string;
}

export class UpdateSidebarLinkDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Title is too short' })
  @MaxLength(50, { message: 'Title is too long' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid URL format' })
  @MinLength(1, { message: 'Link is too short' })
  @MaxLength(2048, { message: 'Link is too long' })
  link: string;
}
