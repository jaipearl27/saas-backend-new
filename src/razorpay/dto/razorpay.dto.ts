import { IsEnum, IsMongoId } from 'class-validator';
import { DurationType } from 'src/schemas/BillingHistory.schema';

export class RazorPayUpdatePlanDTO {
  @IsMongoId()
  planId: string;

  @IsMongoId()
  adminId: string;

  @IsEnum(DurationType, {
    message: 'Duration type must be one of the allowed values.',
  })
  durationType: DurationType;
}

export class RazorPayAddOnDTO {
  @IsMongoId()
  addonId: string;

  @IsMongoId()
  adminId: string;
}
