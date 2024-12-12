import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SchemaTypes, Types } from 'mongoose';
import { StatusDropdown } from '../schemas/StatusDropdown.schema';
import { Roles } from 'src/schemas/Roles.schema';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class StatusDropdownService {
  constructor(
    @InjectModel(StatusDropdown.name)
    private readonly statusDropdownModel: Model<StatusDropdown>,
    private readonly rolesService: RolesService,
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
    createdBy,
  });

  if (existingUserLabel) {
    throw new BadRequestException(
      `The label already exists for this user.`,
    );
  }

  // Determine if the label should be marked as default
  const roleName = await this.rolesService.getRoleNameById(role);
  const isDefault = roleName === 'SUPER_ADMIN';

  // Create and save the new status
  const newStatus = new this.statusDropdownModel({
    label,
    createdBy,
    isDefault,
  });

  return await newStatus.save();
}

  

  // Get all statuses
  async findAll(
    role: string,
    createdBy: string,
    adminId: string,
  ): Promise<StatusDropdown[]> {
    const roleName = await this.rolesService.getRoleNameById(role);
    const query: any = {};
  
    if (roleName === 'SUPER_ADMIN') {
      // Only return documents where isDefault is true
      query['isDefault'] = true;
    } else {
      // Include isDefault documents and additional conditions based on the role
      query['$or'] = [
        { isDefault: true }, // Always include isDefault documents
      ];
  
      if (['EMPLOYEE_SALES', 'EMPLOYEE_REMINDER'].includes(roleName)) {
        query['$or'].push({ createdBy: adminId.toString() });
      } else {
        query['$or'].push({ createdBy: createdBy });
      }
    }
  
    console.log(query);
    return await this.statusDropdownModel.find(query).exec();
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
      .findOneAndDelete({ _id: id, createdBy: userId })
      .exec();

    if (!deletedStatus) {
      throw new NotFoundException(`Status with ID "${id}" not found.`);
    }

    return deletedStatus;
  }
}
