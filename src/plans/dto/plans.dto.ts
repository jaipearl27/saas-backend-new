import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class planDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsNumber()
    @IsNotEmpty()
    employeeCount: number
    
    @IsNumber()
    @IsNotEmpty()
    contactLimit: number

    @IsOptional()
    @IsBoolean()
    incrementContact?: boolean

    @IsNumber()
    @IsNotEmpty()
    planDuration: number

}