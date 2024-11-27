import {IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    companyName: string

    @IsString()
    @IsNotEmpty()
    userName: string

    @IsEmail()
    @IsOptional()
    email: string

    @IsOptional()
    @IsString()
    phone?: string

    @IsOptional()
    @IsString()
    role?: string

    @IsString()
    @IsOptional()
    plan?: string

    @IsNumber()
    @IsOptional()
    currentPlanExpiry?: Number    
}