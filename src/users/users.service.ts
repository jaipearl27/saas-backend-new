import { BadRequestException, Injectable, NotAcceptableException, NotFoundException, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from 'src/auth/dto/createEmployee.dto';

import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
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
    const user = await this.userModel.create({ ...createEmployeeDto }) 
    return user
  }
}
