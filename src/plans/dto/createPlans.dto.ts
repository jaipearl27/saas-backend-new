import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreatePlansDto {
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

    @IsObject()
    @IsNotEmpty()
    attendeeTableConfig: Map<string, any>;

}