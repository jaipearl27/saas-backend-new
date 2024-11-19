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
  

  @Post('refresh')
  async refreshToken(
    @Body() userName: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refreshToken(userName);

    if (result.access_token) {
      response.cookie(
        this.configService.get('ACCESS_TOKEN_NAME'),
        result.access_token,
      );
    }

    return result.userData;
  }

  @Post('/employee')
  async createEmployee(
    @Body() createEmplyeeDto: CreateEmployeeDto,
    @Req() req
  ){
    
  if (req?.plan) {
    plan = await this.plan.findById(req?.plan);
  } else {
    res.status(500).json({ status: false, message: "No Plan Found" });
  }

  const isUserExists = await usersModel.findOne({ email });
  if (isUserExists) {
    res.status(404).json({ status: false, message: "User already Exists" });
    return;
  }

  // const AdminId = new mongoose.Schema.Types.ObjectId(adminId)

  const employeeCount = await usersModel.countDocuments({ adminId: adminId });

  if (employeeCount < plan.employeesCount) {
    const hashPassword = await bcrypt.hash(password, 10);

    // console.log(role,"role")

    const savedUser = await usersModel.create({
      userName,
      email,
      password: hashPassword,
      phone,
      role,
      adminId,
    });

    res.status(200).json({
      status: "SUCCESS",
      message: "User created successfully",
      data: savedUser,
    });
  } else {
    res.status(500).json({
      status: false,
      message: "Employee limit reached for this plan.",
    });
  }
  }
}
