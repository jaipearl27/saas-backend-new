import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users') // @route => /users
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  // @UsePipes(new ValidationPipe()) // or you can use validatoin pipe for a specific endpoint like this
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto)
  }

  @Get('/clients')
  getClients(){
    return this.usersService.getClients()
  }


  @Get('/employees')
  getEmployees(@Req() request:Request){
    return this.usersService.getEmployees(request)
  }


}
