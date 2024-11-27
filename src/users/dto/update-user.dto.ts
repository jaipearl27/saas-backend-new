import {IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

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
    
}