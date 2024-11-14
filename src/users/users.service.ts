import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService
  ) {}

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto)
    return newUser.save()
  }

  getClients(){
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({role: new mongoose.Types.ObjectId(`${clientRoleId}`)})
  }
}
