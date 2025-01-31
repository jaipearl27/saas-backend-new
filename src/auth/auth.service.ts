import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { Model, Types } from 'mongoose';
import { CreatorDetailsDto } from './dto/creatorDetails.dto';
import { PlansService } from 'src/plans/plans.service';
import { CreateClientDto } from './dto/createClient.dto';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly subscriptionService: SubscriptionService,
    private readonly whatsappService: WhatsappService,
    private readonly mailerService: MailerService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async generateTokens(id: Types.ObjectId) {
    try {
      const user: User = await this.userModel.findById(id).exec();

      const payload = {
        id: user._id,
        role: user.role,
        adminId: user.adminId,
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('ACCESS_TOKEN_SECRET'),
        expiresIn: '1h',
      });

      const refreshToken = await this.jwtService.signAsync(
        { id: user._id },
        {
          secret: this.configService.get('REFRESH_TOKEN_SECRET'),
          expiresIn: '1d',
        },
      );

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
      return { accessToken, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Something went wrong during token generation',
      );
    }
  }

  async signIn(signInDto: SignInDto): Promise<any> {
    const user = await this.usersService.getUser(signInDto.email);

    if (!user) {
      throw new NotFoundException('Incorrect E-Mail');
    }

    const matchPassword = await bcrypt.compare(
      signInDto.password,
      user.password,
    );

    if (!matchPassword) {
      throw new NotFoundException('Incorrect Password');
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
        expiresIn: '1h',
      }),
    };
  }

  async refreshToken(email: string): Promise<any> {
    const user = await this.usersService.getUser(email);

    console.log(email, '<--- user ---> ', user?._id);

    if (!user) {
      throw new NotFoundException('Incorrect E-Mail');
    }

    const result = user.toObject();
    delete result['password'];

    const payload = {
      id: user?._id,
      role: user?.role,
      adminId: user?.adminId,
      plan: user?.plan,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('ACCESS_TOKEN_SECRET'),
      expiresIn: '1h',
    });
    return { access_token, user };
  }

  async createEmployee(
    createEmployeeDto: CreateEmployeeDto,
    creatorDetailsDto: CreatorDetailsDto,
  ): Promise<any> {
    const subscription = await this.subscriptionService.getSubscription(
      creatorDetailsDto.id,
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (new Date(subscription.expiryDate) < new Date()) {
      throw new NotAcceptableException('Subscription Expired');
    }

    const totalEmployeeLimit =
      (subscription.employeeLimit ?? 0) +
      (subscription.employeeLimitAddon ?? 0);

    const isUserExists = await this.userModel.findOne({
      email: createEmployeeDto.email,
    });

    if (isUserExists) {
      throw new BadRequestException('User already exists');
    }

    const employeeCount = await this.userModel.countDocuments({
      adminId: new Types.ObjectId(`${creatorDetailsDto.id}`),
      isActive: true,
    });

    if (employeeCount < totalEmployeeLimit) {
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

  async generateOtp(email: string): Promise<any> {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('No user found with the given email.');
    }
    user.oneTimePassword = newOtp;
    console.log(newOtp, user.phone, user.email, user.userName);
    await this.whatsappService.sendAlarmMsg({
      phone: user.phone.trim(),
      note: String(newOtp),
      userName: user.userName.trim(),
      attendeeEmail: user.email.trim(),
    });

    await user.save();
  }

  async pabblyToken(id: string): Promise<any> {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException('No user found with the given ID.');

    const payload = {
      id: user?._id,
      role: user?.role,
      adminId: user?.adminId,
    };

    //create jwt with payload here
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('PABBLY_CLIENT_ACCESS_TOKEN_SECRET'),
    });

    return token;
  }

  async getCurrentUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('No user found with the given ID.');
    }

    return user;
  }

  async generateOtp(email: string): Promise<{ success: boolean }> {
    const newOtp = await this.generateSecureOtp();

    const user = await this.userModel
      .findOne({ email })
      .select('+oneTimePassword +otpExpiration')
      .exec();

    if (!user) {
      throw new NotFoundException('No user found with the given email.');
    }

    if (user.otpExpiration && user.otpExpiration > new Date()) {
      throw new ConflictException('Valid OTP already exists');
    }

    user.oneTimePassword = await this.hashOtp(newOtp); // Store hashed OTP
    user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your One-Time Password (OTP)',
        html: this.generateOtpEmailTemplate(newOtp),
      });

      await user.save();

      this.logger.log(`OTP generated for user: ${user.id}`);

      return { success: true };
    } catch (error) {
      this.logger.error('OTP generation failed', error.stack);
      throw new InternalServerErrorException('Failed to process OTP request');
    }
  }

  private async generateSecureOtp(): Promise<string> {
    const crypto = await import('crypto');
    const buffer = crypto.randomBytes(3);
    return (buffer.readUIntBE(0, 3) % 1000000).toString().padStart(6, '0');
  }

  private generateOtpEmailTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">OTP Verification</h2>
        <p>Your One-Time Password is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #059669;">${otp}</div>
        <p style="margin-top: 20px;">This code will expire in 10 minutes.</p>
        <hr style="border: 1px solid #e5e7eb;">
        <p style="color: #6b7280;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
  }

  private async hashOtp(otp: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  async validateOTP(email: string, otp: string): Promise<{ success: boolean }> {
    const user = await this.userModel
      .findOne({ email })
      .select(
        '+oneTimePassword +otpExpiration +failedOtpAttempts +accountLockedUntil',
      )
      .exec();

    if (!user) {
      throw new NotFoundException('No user found with the given email.');
    }

    if (user.accountLockedUntil && user.accountLockedUntil < new Date()) {
      throw new ForbiddenException(
        'Account temporarily locked. Try again later.',
      );
    }

    if (!user.oneTimePassword || !user.otpExpiration) {
      throw new ForbiddenException('No active OTP found');
    }

    if (new Date() > user.otpExpiration) {
      await this.clearOtp(user);
      throw new ForbiddenException('OTP has expired');
    }

    
    const hashedOtp = await this.hashOtp(otp);
    const isValid = this.compareOtp(hashedOtp, user.oneTimePassword);

    if (!isValid) {
      user.failedOtpAttempts = (user.failedOtpAttempts || 0) + 1;

      if (user.failedOtpAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        await user.save();
        throw new ForbiddenException(
          'Too many failed attempts. Account locked for 15 minutes.',
        );
      }

      await user.save();
      throw new ForbiddenException('Invalid OTP');
    }

    await this.clearOtp(user);
    return { success: true };
  }

  private async clearOtp(user: User): Promise<void> {
    user.oneTimePassword = undefined;
    user.otpExpiration = undefined;
    user.failedOtpAttempts = 0;
    user.accountLockedUntil = undefined;
    await user.save();
  }

  private compareOtp(inputHash: string, storedHash: string): boolean {
    const crypto = require('crypto');
    return crypto.timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(storedHash),
    );
  }
}
