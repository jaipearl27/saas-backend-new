import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { Location } from 'src/schemas/location.schema';
import { NotificationService } from 'src/notification/notification.service';
import {
  notificationActionType,
  notificationType,
} from 'src/schemas/notification.schema';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name) private readonly locationModel: Model<Location>,
    private readonly notificationService: NotificationService,
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

  async getLocationRequests(
    isVerified: boolean,
    admin?: string,
    isAdminVerified?: boolean,
  ): Promise<any> {
    const pipeline = { isVerified };
    if (admin) {
      pipeline['admin'] = new Types.ObjectId(`${admin}`);
    }
    if (isAdminVerified) {
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

    //notification to admin and employee
    
    if (result?.admin) {
      await this.notificationService.createNotification({
        recipient: result.admin.toString(),
        title: 'Location request approved.',
        message: `Your request to add location ${result?.name} has been approved.`,
        type: notificationType.INFO,
        actionType: notificationActionType.LOCATION_REQUEST,
      });
    }

    if (result?.employee) {
      await this.notificationService.createNotification({
        recipient: result?.admin.toString(),
        title: 'Location request approved.',
        message: `Your request to add location ${result?.name} has been approved.`,
        type: notificationType.INFO,
        actionType: notificationActionType.LOCATION_REQUEST,
      });
    }

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

    if (result?.admin) {
      await this.notificationService.createNotification({
        recipient: result.admin.toString(),
        title: 'Location request rejected.',
        message: `Your request to add location ${result?.name} has been rejected.`,
        type: notificationType.INFO,
        actionType: notificationActionType.LOCATION_REQUEST,
      });
    }

    if (result?.employee) {
      await this.notificationService.createNotification({
        recipient: result?.admin.toString(),
        title: 'Location request rejected.',
        message: `Your request to add location ${result?.name} has been rejected.`,
        type: notificationType.INFO,
        actionType: notificationActionType.LOCATION_REQUEST,
      });
    }


    return result;
  }
}
