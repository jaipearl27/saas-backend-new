import {IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateClientDto {
    @IsString()
    @IsNotEmpty()
    userName: string

    @IsString()
    @IsNotEmpty()
    password: string

    @IsEmail()
    @IsNotEmpty()
    email: string

    @IsOptional()
    @IsString()
    phone?: string

    @IsOptional()
    @IsString()
    role: string

    @IsString()
    @IsNotEmpty()
    plan: string

    
    @IsNumber()
    @IsOptional()
    currentPlanExpiry?: Number
    
}