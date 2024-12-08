import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,

} from '@nestjs/common';
import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserInfoDto } from './dto/update-user.dto';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { GetClientsFilterDto } from './dto/filters.dto';


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

  @Patch()
  async updateUser(
    @Id() id: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto 
  ): Promise<any> {
    const client = await this.usersService.updateUser(id, updateUserInfoDto)
    return client
  }

  @Patch('password')
  async updatePassword(
    @Id() id: string,
    @Body() updatePasswordDto: UpdatePasswordDto  
  ): Promise<any> {
    const client = await this.usersService.updatePassword(id, updatePasswordDto)
    return client
  }



  @Post('/clients')
  async getClients(
    @Query() query: { page: string; limit: string },
    @Body() filters: GetClientsFilterDto,
  ): Promise<any> {
    let page = Number(query.page);
    let limit = Number(query.limit);
    if (page <= 0) page = 1;
    if (limit <= 0) limit = 25;

    const skip: number = (page - 1) * Number(query.limit);
    const clients = await this.usersService.getClients(
      skip,
      Number(query.limit),
      filters,
    );
    clients.page = page;
    return clients;
  }

  @Get('/clients/:id')
  async getClient(@Param('id') id: string): Promise<any> {
    const client = await this.usersService.getClient(id)
    return client
  }

  
  @Patch('/clients/:id')
  async updateClient(
    @Param('id') id: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto 
  ): Promise<any> {
    const client = await this.usersService.updateClient(id, updateUserInfoDto)
    return client
  }

  
  @Get('/employee')
  getEmployees(
    @Id() id: string,
  ) {
    console.log('id ------> ', id)
    return this.usersService.getEmployees(id);
  }

  @Patch('/employee/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<any> {
    const employee = await this.usersService.updateEmployee(
      id,
      updateEmployeeDto,
    );
    return employee;
  }

  @Patch('/employee/status/:id')
  async updateEmployeeStatus(
    @Param('id') userId: string,
    @Id() id: string,
    @Body() body: {isActive: boolean},
  ): Promise<any> {
    console.log(userId, id, body?.isActive)
    return this.usersService.changeEmployeeStatus(userId,id,body?.isActive)
  }

  @Get('/employee/:id')
  async getEmployee(@Param('id') id: string): Promise<any> {
    const client = await this.usersService.getEmployee(id)
    return client
  }
}
