// user-activity.controller.ts
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminId } from 'src/decorators/custom.decorator';

@Controller('user-activities')
export class UserActivityController {
  @Get()
  getUserActivities(@Req() req: Request, 
  @AdminId() adminId: string,
) {
    // const adminId = req.adminId;  // Extracted adminId from middleware
    console.log('Admin ID:', adminId);

    // You can now use adminId for further processing
    return { message: 'User activities retrieved', adminId };
  }
}
