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
import { CreatorDetailsDto } from './dto/creatorDetails.dto';
import { PlansService } from 'src/plans/plans.service';
import { CreateClientDto } from './dto/createClient.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly plansService: PlansService,
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

    const admin = await this.usersService.getUserById(user._id);

    if (!admin.isActive) {
      throw new UnauthorizedException(
        'Access denied: Admin account is inactive. Please contact your administrator.',
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

    const payload = {
      id: user?._id,
      role: user?.role,
      adminId: user?.adminId,
      plan: user?.plan,
    };

    return {
      userData: result,
      access_token: await this.jwtService.signAsync(payload, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        expiresIn: '60s',
      }),
    };
  }

  async refreshToken(userName: string): Promise<any> {
    const user = await this.usersService.getUser(userName);

    console.log(userName, '<--- user ---> ', user?._id);

    if (!user) {
      throw new NotFoundException('Incorrect Username');
    }

    const result = user.toObject();
    delete result['password'];

    const payload = { id: user?._id, role: user?.role, adminId: user?.adminId, plan: user?.plan };

    console.log('access token --> ', this.configService.get('ACCESS_TOKEN_SECRET'))
    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: '15s',
    });
    return { access_token, user };
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const plan = await this.plansService.getPlan(creatorDetailsDto?.plan);

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

    if (employeeCount < plan.employeeCount) {
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

  async createClient(
    createClientDto: CreateClientDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const roleId = await this.configService.get('appRoles')['ADMIN'];
    if (roleId) {
      createClientDto.role = roleId;
    }

    const hashPassword = await bcrypt.hash(createClientDto.password, 10);
    createClientDto.password = hashPassword;

    return this.usersService.createClient(createClientDto, creatorDetailsDto);
  }

  async pabblyToken(id: string): Promise<any> {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException('No user found with the given ID.');

    const payload = {
      id: user?._id,
      role: user?.role,
      adminId: user?.adminId,
      plan: user?.plan,
    };

    //create jwt with payload here
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('PABBLY_ACCESS_TOKEN_SECRET'),
    });

    return token;
  }
}
