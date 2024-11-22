import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { CreateEmployeeDto } from './dto/createEmployee.dto';
import { Id, Plan, Role } from 'src/decorators/custom.decorator';
import { CreateClientDto } from './dto/createClient.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

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

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(this.configService.get('ACCESS_TOKEN_NAME')); // Unset the access token cookie
    return { message: 'Successfully logged out' };
  }

  @Post('refresh')
  async refreshToken(
    @Body() body: { userName: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refreshToken(body.userName);
    console.log(this.configService.get('NODE_ENV') === 'production', "--- log ---", this.configService.get('NODE_ENV'))
    if (result.access_token) {
      response.cookie(
        this.configService.get('ACCESS_TOKEN_NAME'),
        result.access_token,
        {
          httpOnly: true,
          secure: this.configService.get('NODE_ENV') === 'production',
          sameSite: 'strict',
        },
      );
      
    }

    return {
      status: true,
      message: 'Refresh token generated',
    };
  }

  @Post('/employee')
  async createEmployee(
    @Body() createEmplyeeDto: CreateEmployeeDto,
    @Id() id: string,
    @Role() role: string,
    @Plan() plan: string,
  ) {
    const creatorDetailsDto = { id: id, role: role, plan: plan };

    const employee = await this.authService.createEmployee(
      createEmplyeeDto,
      creatorDetailsDto,
    );

    return employee;
  }


  @Post('/client')
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @Id() id: string,
    @Role() role: string,
    @Plan() plan: string,
  ){
    const creatorDetailsDto = { id: id, role: role, plan: plan };

    return this.authService.createClient(createClientDto,creatorDetailsDto)
  }
}
