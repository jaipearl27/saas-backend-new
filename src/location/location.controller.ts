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
import { Id, Role } from 'src/decorators/custom.decorator';
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
    @Role() role: string,
  ): Promise<any> {
    if (this.configService.get('appRoles').SUPER_ADMIN === role) {
      const result = await this.locationService.addLocation(createLocationDto);
      return result;
    } else if (this.configService.get('appRoles').ADMIN === role) {
      createLocationDto.isVerified = false;
      createLocationDto.admin = id;
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
  async getLocationRequests(): Promise<any> {
    const result = await this.locationService.getLocationRequests();
    return result;
  }

  @Patch(':id')
  async updateLocation(
    @Body() updateLocationDto: UpdateLocationDto,
    @Param('id') id: string,
  ): Promise<any> {

    if(!id) throw new NotAcceptableException('Location ID not provided.')

    const result = await this.locationService.updateLocation(
      id,
      updateLocationDto,
    );

    return result
  }
}
