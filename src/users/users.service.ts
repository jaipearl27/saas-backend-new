import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { User } from 'src/schemas/User.schema';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from 'src/auth/dto/createEmployee.dto';
import { CreatorDetailsDto } from 'src/auth/dto/creatorDetails.dto';
import { CreateClientDto } from 'src/auth/dto/createClient.dto';
import { Plans } from 'src/schemas/Plans.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private configService: ConfigService,
  ) {}

  getUsers() {
    return this.userModel.find();
  }

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  getClients() {
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({
      role: new mongoose.Types.ObjectId(`${clientRoleId}`),
    });
  }

  getEmployees() {
    const clientRoleId = this.configService.get('appRoles').ADMIN;
    return this.userModel.find({
      role: new mongoose.Types.ObjectId(`${clientRoleId}`),
    });
  }

 async getUser(userName: string): Promise<any> {
    const user = await this.userModel.findOne({ userName: userName });
    return user
  }

  getUserById(id: string) {
    return this.userModel.findById(id);
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const user = await this.userModel.create({
      ...createEmployeeDto,
      adminId: creatorDetailsDto.id,
    });
    return user;
  }

  async createClient(
    createClientDto: CreateClientDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const plan = await this.plansModel.findOne({
      _id: new Types.ObjectId(`${createClientDto.plan}`),
    });

    if (!plan) throw new NotFoundException('No Plans Found with the given ID.');

    let date = new Date();
    let currentPlanExpiry = date.setDate(date.getDate() + plan.planDuration);
    createClientDto.currentPlanExpiry = currentPlanExpiry;

    /**
    // * test for date in frontend to be in IST
     * let date = new Date('2024-12-02T06:14:48.287Z')
      console.log(date.toLocaleString('en-IN'))
     */

    // Check if a user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { userName: createClientDto.userName },
        { email: createClientDto.email },
      ],
    });
    if (existingUser) {
      throw new BadRequestException(
        'User with this UserName/E-Mail already exists.',
      );
    }
    
    const user = await this.userModel.create({
      ...createClientDto,
      adminId: creatorDetailsDto.id,
    });

    return user;
  }
}
