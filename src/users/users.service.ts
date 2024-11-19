import { BadRequestException, Injectable, NotAcceptableException, NotFoundException, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from 'src/auth/dto/createEmployee.dto';
import { Plans } from 'src/schemas/Plans.schema';

import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plans.name) private plansModel: Model<User>,
    private configService: ConfigService
  ) { }

  getUsers() {
    return this.userModel.find()
  }

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto)
    return newUser.save()
  }

  getClients(adminId: string) {
    console.log(adminId, "Admin ID........")
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({ role: new mongoose.Types.ObjectId(`${clientRoleId}`) })
  }

  getEmployees() {
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({ role: new mongoose.Types.ObjectId(`${clientRoleId}`) })
  }

  getUser(userName: string) {
    return this.userModel.findOne({ userName: userName })
  }


  getUserById(id: string) {
    return this.userModel.findById(id)
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto, creatorDetails): Promise<any> {

    let plan;
    if (creatorDetails?.plan) {
      plan = await this.plansModel.findById(creatorDetails?.plan);
    } else {
      throw new NotFoundException('No plan found with this id')
    }

    const isUserExists = await this.userModel.findOne({ email: createEmployeeDto.email });

    if (isUserExists) {
      throw new BadRequestException('User already exists')
    }

    const employeeCount = await this.userModel.countDocuments({ adminId: creatorDetails.id, isActive: true });

    if (employeeCount < plan.employeesCount) {
      const hashPassword = await bcrypt.hash(createEmployeeDto.password, 10);
      createEmployeeDto.password = hashPassword

      const user = this.userModel.create({ ...createEmployeeDto })
      return user
    } else {
      throw new NotAcceptableException('Employee creation limit reached for your plan.')
    }
  }
}
