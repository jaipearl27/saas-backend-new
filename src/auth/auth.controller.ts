import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.signIn(signInDto);

    if (result.access_token) {
      response.cookie('SAASCRM_TOKEN', result.access_token);
    }

    return result.userData;
  }


  @Post('refresh')
  async refreshToken(
    @Body() userName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refreshToken(userName);

    if (result.access_token) {
      response.cookie('SAASCRM_TOKEN', result.access_token);
    }

    return result.userData;
  }


}
