import { Body, Controller, Get, Post } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) {}

    @Get()
    getRoles() {
      const result = this.rolesService.getRoles();
      return result;
    }


    @Post()
    addRole(@Body() name: string) {
      const result = this.rolesService.addRole(name);
      return result;
    }
}
