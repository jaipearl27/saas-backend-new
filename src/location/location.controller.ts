import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { LocationService } from './location.service';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
// import { create } from 'domain';

@Controller('location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async addLocation(
    @Body() createLocationDto: CreateLocationDto,
    @Id() id: string,
    @AdminId() adminId: string,
    @Role() role: string,
  ): Promise<any> {
    console.log(createLocationDto);

    if (this.configService.get('appRoles').SUPER_ADMIN === role) {
      createLocationDto.isVerified = true;
      const result = await this.locationService.addLocation(createLocationDto);
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      createLocationDto.isVerified = false;
      createLocationDto.isAdminVerified = true;
      createLocationDto.admin = id;
      const result = await this.locationService.addLocation(createLocationDto);

      //create notification

      return result;
    } else if (
      [
        this.configService.get('appRoles').EMPLOYEE_SALES,
        this.configService.get('appRoles').EMPLOYEE_REMINDER,
      ].includes(role)
    ) {
      createLocationDto.isVerified = false;
      createLocationDto.isAdminVerified = false;
      createLocationDto.admin = adminId;
      createLocationDto.employee = id;
      const result = await this.locationService.addLocation(createLocationDto);
      return result;
    } else {
      throw new UnauthorizedException(
        'Only Admin or Super admin are authorised to Add/Request locations',
      );
    }
  }

  @Get()
  async getLocations(): Promise<any> {
    const result = await this.locationService.getLocations();
    return result;
  }

  @Get('requests')
  async getLocationRequests(
    @Id() id: string,
    @Role() role: string,
  ): Promise<any> {
    if (role === this.configService.get('appRoles').SUPER_ADMIN) {
      const result = await this.locationService.getLocationRequests(
        false,
        null,
        true,
      );
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      const result = await this.locationService.getLocationRequests(false, id);
      return result;
    } else {
      throw new UnauthorizedException(
        'Only Admin or Super admin are authorised to see all requested locations',
      );
    }
  }

  @Patch('/approve/:id')
  async approveLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Param('id') id: string,
    @Role() role: string,
  ): Promise<any> {
    if (!id) throw new NotAcceptableException('Location ID not provided.');

    if (role === this.configService.get('appRoles').SUPER_ADMIN) {
      delete updateLocationDto.isAdminVerified;
      updateLocationDto.isVerified = true;
      const result = await this.locationService.approveRequest(
        id,
        updateLocationDto,
      );
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      delete updateLocationDto.isVerified;
      delete updateLocationDto.name;
      updateLocationDto.isAdminVerified = true;
      const result = await this.locationService.approveRequest(
        id,
        updateLocationDto,
      );
      return result;
    } else {
      throw new UnauthorizedException(
        'Only Admin or Super admin are authorised to approve locations',
      );
    }
  }

  @Patch('/disapprove/:id')
  async disapproveLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Param('id') id: string,
    @Role() role: string,
  ): Promise<any> {
    if (!id) throw new NotAcceptableException('Location ID not provided.');

    if (role === this.configService.get('appRoles').SUPER_ADMIN) {
      delete updateLocationDto.isAdminVerified;
      const result = await this.locationService.disapproveRequest(
        id,
        updateLocationDto,
      );
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      delete updateLocationDto.isVerified;
      delete updateLocationDto.name;
      const result = await this.locationService.disapproveRequest(
        id,
        updateLocationDto,
      );
      return result;
    } else {
      throw new UnauthorizedException(
        'Only Admin or Super admin are authorised to disapprove locations',
      );
    }
  }
}
