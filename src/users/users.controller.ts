import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,

} from '@nestjs/common';
import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';


@Controller('users') // @route => /users
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
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
  async getClients(@Query() query: { page: string; limit: string }): Promise<any> {
    let page = Number(query.page);
    let limit = Number(query.limit);
    if (page <= 0) page = 1;
    if (limit <= 0) limit = 25;

    const skip: number = (page - 1) * Number(query.limit);
    const clients = await this.usersService.getClients(skip, Number(query.limit));
    clients.page = page
    return clients;
  }

  @Get('/clients/:id')
  async getClient(@Param('id') id: string): Promise<any> {
    const client = await this.usersService.getClient(id)
    return client
  }

  @Get('/employees')
  getEmployees() {
    return this.usersService.getEmployees();
  }
}
