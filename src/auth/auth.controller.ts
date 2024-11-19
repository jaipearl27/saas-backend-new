import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from './dto/createEmployee.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(signInDto);

    if (result.access_token) {
      response.cookie(
        this.configService.get('ACCESS_TOKEN_NAME'),
        result.access_token,
      );
    }

    return result.userData;
  }


  @Post('refresh')
  async refreshToken(
    @Body() body: { userName: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refreshToken(body.userName);

    if (result.access_token) {
      response.cookie(
        this.configService.get('ACCESS_TOKEN_NAME'),
        result.access_token,
      );
    }

    return {
      status: true,
      message: 'Refresh token generated'
    };
  }

  @Post('/employee')
  async createEmployee(
    @Body() createEmplyeeDto: CreateEmployeeDto,
    @Req() req
  ) {
    const creatorDetails = { id: req.id, role: req.role, plan: req.plan }
    return this.authService.createEmployee(createEmplyeeDto, creatorDetails)
  }
}
