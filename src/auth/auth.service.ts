import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

import { SignInDto } from './dto/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from './dto/createEmployee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/User.schema';
import { Model } from 'mongoose';
import { Plans } from 'src/schemas/Plans.schema';
import { CreatorDetailsDto } from './dto/creatorDetails.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Plans.name) private plansModel: Model<Plans>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<any> {
    const user = await this.usersService.getUser(signInDto.userName);

    if (!user) {
      throw new NotFoundException('Incorrect Username');
    }

    if (!user?.isActive) {
      throw new UnauthorizedException(
        'Access denied: User account is inactive. Please contact your administrator.',
      );
    }

    const matchPassword = await bcrypt.compare(
      signInDto.password,
      user.password,
    );

    if (!matchPassword) {
      throw new UnauthorizedException('Incorrect Password');
    }

    const result = user.toObject();
    delete result['password'];

    const payload = { id: user?._id, role: user?.role, adminId: user?.adminId };

    return {
      userData: result,
      access_token: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      }),
    };
  }

  async refreshToken(userName: string): Promise<any> {
    const user = await this.usersService.getUser(userName);

    if (!user) {
      throw new NotFoundException('Incorrect Username');
    }

    const result = user.toObject();
    delete result['password'];

    const payload = { id: user?._id, role: user?.role, adminId: user?.adminId };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: '15d',
    });
    return { access_token, user };
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    let plan;
    if (creatorDetailsDto?.plan) {
      plan = await this.plansModel.findById(creatorDetailsDto?.plan);
    } else {
      throw new NotFoundException('No plan found for this user.');
    }

    const isUserExists = await this.userModel.findOne({
      email: createEmployeeDto.email,
    });

    if (isUserExists) {
      throw new BadRequestException('User already exists');
    }

    const employeeCount = await this.userModel.countDocuments({
      adminId: creatorDetailsDto.id,
      isActive: true,
    });

    if (employeeCount < plan.employeesCount) {
      const hashPassword = await bcrypt.hash(createEmployeeDto.password, 10);
      createEmployeeDto.password = hashPassword;

      return this.usersService.createEmployee(
        createEmployeeDto,
        creatorDetailsDto,
      );
    } else {
      throw new NotAcceptableException(
        'Employee creation limit reached for your plan.',
      );
    }
  }
}
