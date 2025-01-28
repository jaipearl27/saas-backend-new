import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { Location } from 'src/schemas/location.schema';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name) private readonly locationModel: Model<Location>,
  ) {}

  async addLocation(createLocationDto: CreateLocationDto): Promise<any> {
    const isExisting = await this.locationModel.findOne({
      name: createLocationDto.name,
    });
    if (isExisting)
      throw new NotAcceptableException(
        'Location or request to add it already exists, Kindly contact administrator to know more about this issue.',
      );

    const result = await this.locationModel.create(createLocationDto);
    return result;
  }

  async getLocations(): Promise<any> {
    const result = await this.locationModel
      .find({ isVerified: true, deactivated: false })
      .sort({ name: 1 });
    return result;
  }

  async getLocationRequests(isVerified: boolean, admin?: string, isAdminVerified?: boolean): Promise<any> {
    const pipeline = { isVerified };
    if (admin) {
      pipeline['admin'] = new Types.ObjectId(`${admin}`);
    }
    if(isAdminVerified){
      pipeline['isAdminVerified'] = isAdminVerified;
    }
    const result = await this.locationModel
      .find(pipeline)
      .sort({ createdAt: -1 });
    return result;
  }

  async approveRequest(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<any> {
    const result = await this.locationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(`${id}`), deactivated: false },
      updateLocationDto,
      { new: true },
    );
    return result;
  }

  async disapproveRequest(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<any> {
    const result = await this.locationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
      },
      { deactivated: true, ...updateLocationDto },
      { new: true },
    );




    return result;
  }
}
