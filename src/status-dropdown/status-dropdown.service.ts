import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SchemaTypes, Types } from 'mongoose';
import { StatusDropdown } from '../schemas/StatusDropdown.schema';
import { Roles } from 'src/schemas/Roles.schema';
import { RolesService } from 'src/roles/roles.service';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class StatusDropdownService {
  constructor(
    @InjectModel(StatusDropdown.name)
    private readonly statusDropdownModel: Model<StatusDropdown>,
    private readonly rolesService: RolesService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // Create a new statusimport { BadRequestException } from '@nestjs/common';

  async create(
    label: string,
    createdBy: string,
    role: string,
  ): Promise<StatusDropdown> {
    // Check if the label exists as a default option
    const existingDefault = await this.statusDropdownModel.findOne({
      label,
      isDefault: true,
    });

    if (existingDefault) {
      throw new BadRequestException(
        `The label is already marked as a default and cannot be created.`,
      );
    }

    // Check if the user already has the same label
    const existingUserLabel = await this.statusDropdownModel.findOne({
      label,
      createdBy: new Types.ObjectId(`${createdBy}`),
    });

    if (existingUserLabel) {
      throw new BadRequestException(`The label already exists for this user.`);
    }

    // Determine if the label should be marked as default
    const roleName = await this.rolesService.getRoleNameById(role);
    const isDefault = roleName === 'SUPER_ADMIN';

    // Create and save the new status
    const newStatus = new this.statusDropdownModel({
      label,
      createdBy: new Types.ObjectId(`${createdBy}`),
      isDefault,
    });

    return await newStatus.save();
  }

  // Get all statuses
  async findAll(role: string, adminId: string): Promise<StatusDropdown[]> {
    const roleName = await this.rolesService.getRoleNameById(role);
    let subscription = null;

    const query: any = {};
    const defaultOptions = [];

    if (roleName === 'SUPER_ADMIN') {
      query['isDefault'] = true;
    } else {
      subscription = await this.subscriptionService.getSubscription(adminId);
      if (!subscription) {
        throw new BadRequestException('Subscription not found');
      }
      const tableConfig = subscription?.plan?.attendeeTableConfig || {};

      query['$or'] = [
        { isDefault: true },
      ];

      if (tableConfig.get('isCustomOptionsAllowed'))
        query['$or'].push({ createdBy: new Types.ObjectId(`${adminId}`) });
    }

    const statuses = await this.statusDropdownModel.find(query).exec();
    return statuses;
  }

  async getStatusesForFilterDropdown(adminId: string) {
    const subscription: any =
      await this.subscriptionService.getSubscription(adminId);

    const tableConfig = subscription?.plan?.attendeeTableConfig || {};
    const query: any = {};

    query['$or'] = [{ isDefault: true }];
    if (tableConfig.get('customOptions')?.filterable)
      query['$or'].push({ createdBy: new Types.ObjectId(`${adminId}`) });

    const defaultOptions = [];
    const defaultOptionsObject = tableConfig.get('defaultOptions');
    if (defaultOptionsObject) {
      const arr = Object.keys(defaultOptionsObject).filter(
        (key) => defaultOptionsObject[key],
      );
      console.log(arr);
      defaultOptions.push(...arr);
    }

    const statuses = await this.statusDropdownModel.find(query).exec();
    if (Array.isArray(statuses)) {
      return statuses.filter((status) => defaultOptions.includes(status.label));
    }
    return statuses;
  }

  // Update a status by ID
  async update(id: string, label: string): Promise<StatusDropdown> {
    const updatedStatus = await this.statusDropdownModel
      .findByIdAndUpdate(id, { label }, { new: true })
      .exec();
    if (!updatedStatus) {
      throw new NotFoundException(`Status with ID "${id}" not found.`);
    }
    return updatedStatus;
  }

  // Delete a status by ID
  async remove(
    id: string,
    userId: string,
    role: string,
  ): Promise<StatusDropdown> {
    const roleName = await this.rolesService.getRoleNameById(role);

    if (roleName === 'SUPER_ADMIN') {
      const deletedStatus = await this.statusDropdownModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedStatus) {
        throw new NotFoundException(`Status with ID "${id}" not found.`);
      }

      return deletedStatus;
    }

    const deletedStatus = await this.statusDropdownModel
      .findOneAndDelete({ _id: id, createdBy: new Types.ObjectId(`${userId}`) })
      .exec();

    if (!deletedStatus) {
      throw new NotFoundException(`Status with ID "${id}" not found.`);
    }

    return deletedStatus;
  }
}
