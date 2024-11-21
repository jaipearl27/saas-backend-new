import { PartialType } from "@nestjs/mapped-types";
import { CreatePlansDto } from "./createPlans.dto";

export class UpdatePlansDto extends PartialType(CreatePlansDto){}