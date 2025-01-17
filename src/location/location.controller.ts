import {
  Body,
  Controller,
  Get,
  NotAcceptableException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { LocationService } from './location.service';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';
import { ConfigService } from '@nestjs/config';
import { create } from 'domain';

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
    if (this.configService.get('appRoles').SUPER_ADMIN === role) {
      createLocationDto.isVerified = true;
      const result = await this.locationService.addLocation(createLocationDto);
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      createLocationDto.isVerified = false;
      createLocationDto.isAdminVerified = true;
      createLocationDto.admin = id;
      const result = await this.locationService.addLocation(createLocationDto);
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
      const result = await this.locationService.getLocationRequests(false);
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      const result = await this.locationService.getLocationRequests(
        false,
        id,
      );
      return result;
    } else {
      throw new UnauthorizedException(
        'Only Admin or Super admin are authorised to see all requested locations',
      );
    }
  }

  @Patch(':id')
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Param('id') id: string,
  ): Promise<any> {
    if (!id) throw new NotAcceptableException('Location ID not provided.');

    const result = await this.locationService.updateLocation(
      id,
      updateLocationDto,
    );

    return result;
  }
}
