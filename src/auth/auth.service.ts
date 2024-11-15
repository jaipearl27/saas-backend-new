import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

import { SignInDto } from './dto/signIn.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async signIn(signInDto: SignInDto): Promise<any> {
    const user = await this.usersService.getUser(signInDto.userName);

    if (!user) {
      throw new NotFoundException('Incorrect Username');
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
        expiresIn: '15s'
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
        expiresIn: '15d'
    })
    return access_token

  }
}
