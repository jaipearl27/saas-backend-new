import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttendeeAssociationService } from './attendee-association.service';
import { AttendeeAssociationDto } from './dto/attendee-association.dto';
import { AdminId } from 'src/decorators/custom.decorator';
import { Types } from 'mongoose';

@Controller('attendee-association')
export class AttendeeAssociationController {
  constructor(
    private readonly attendeeAssociationService: AttendeeAssociationService,
  ) {}

  @Post()
  async createLeadTypeAssociation(
    @Body() body: AttendeeAssociationDto,
    @AdminId() adminId: Types.ObjectId,
  ) {
    if (!adminId) {
      throw new BadRequestException('AdminID is required.');
    }
    const association = await this.attendeeAssociationService.createAssociation(
      body.email,
      adminId,
      body.leadType,
    );
    return association;
  }

  @Get(':email')
  async getAssociationByEmail(
    @Param('email') email: string,
    @AdminId() adminId: Types.ObjectId,
  ) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required.');
    }
    const association = await this.attendeeAssociationService.getAssociation(
      adminId,
      email,
    );
    return association;
  }
}
