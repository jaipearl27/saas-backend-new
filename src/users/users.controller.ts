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
import { AdminId } from 'src/decorators/custom.decorator';

@Controller('users') // @route => /users
export class UsersController {
  constructor(private usersService: UsersService) {}


  @Get('')
  getUsers() {
    const users = this.usersService.getUsers();
    return users;
  }

  @Post()
  // @UsePipes(new ValidationPipe()) // or you can use validation pipe for a specific endpoint like this
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  

  @Get('/clients')
  getClients(@AdminId() adminId) {
    const clients = this.usersService.getClients(adminId);

    return clients;
  }

  @Get('/employees')
  getEmployees() {
    return this.usersService.getEmployees();
  }
}
