import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserInfoDto } from './dto/update-user.dto';
import { AdminId, Id, Role } from 'src/decorators/custom.decorator';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { GetClientsFilterDto } from './dto/filters.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { EmployeeFilterDTO } from './dto/employee-filter.dto';

@Controller('users') // @route => /users
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getUsers() {
    const users = this.usersService.getUsers();
    return users;
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Patch()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document' }]))
  async updateUser(
    @UploadedFiles() files: { document: Express.Multer.File[] },
    @Id() id: string,
    @Role() role: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<any> {
    // console.log(files, '================== files ======================');
    if (files?.document && role === this.configService.get('appRoles').ADMIN) {
      console.log(files.document);
      updateUserInfoDto.documents = files.document;
    }
    const client = await this.usersService.updateUser(id, updateUserInfoDto);
    return client;
  }

  @Delete('document/:filename')
  async deleteDocument(
    @Param('filename') filename: string,
    @Id() id: string,
  ): Promise<any> {
    const result = await this.usersService.deleteDocument(id, filename);
    return result;
  }

  @Patch('password')
  async updatePassword(
    @Id() id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ): Promise<any> {
    const client = await this.usersService.updatePassword(
      id,
      updatePasswordDto,
    );
    return client;
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
    const client = await this.usersService.getClient(id);
    return client;
  }

  @Patch('/clients/:id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document' }]))
  async updateClient(
    @UploadedFiles() documents: { document: Express.Multer.File[] },
    @Param('id') id: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<any> {
    console.log(
      documents,
      '==================== documents ============================',
    );

    const client = await this.usersService.updateClient(id, updateUserInfoDto);
    return client;
  }

  @Post('/employee')
  getEmployees(
    @Id() id: string,
    @Query() query: { page: string; limit: string },
    @Body() body: { filters: EmployeeFilterDTO },
  ) {
    let page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    let limit = Number(query?.limit) > 0 ? Number(query?.limit) : 25;
    return this.usersService.getEmployees(id, page, limit, body.filters);
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
    @Body() body: { isActive: boolean },
  ): Promise<any> {
    console.log(userId, id, body?.isActive);
    return this.usersService.changeEmployeeStatus(userId, id, body?.isActive);
  }

  @Get('/employee/:id')
  async getEmployee(@Param('id') id: string): Promise<any> {
    const client = await this.usersService.getEmployee(id);
    return client;
  }

  @Get('/super-admin')
  async getSuperAdminDetails(){
    return await this.usersService.getSuperAdminDetails();
  }
}
