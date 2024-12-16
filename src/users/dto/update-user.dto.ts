import {IsArray, IsBoolean, IsEmail, IsNotEmpty, IsNotEmptyObject, IsObject, IsOptional, IsString, ValidateIf } from "class-validator";

export class UpdateUserInfoDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    companyName?: string

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    userName?: string

    @IsEmail()
    @IsOptional()
    email?: string

    @IsOptional()
    @IsString()
    phone?: string

    @IsOptional()
    @IsString()
    password?: string

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @ValidateIf((o) => o.isActive !== undefined)
    @IsString()
    @IsNotEmpty({message: "Status change note is required when isActive is provided."})
    statusChangeNote?: string
      
    @IsOptional()
    @IsArray()
    documents?: any;

    @IsOptional()
    @IsString()
    gst?: string
  
}


