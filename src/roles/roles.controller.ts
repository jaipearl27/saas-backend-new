import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) {}

    @Get()
    getUsers() {
      const users = this.rolesService.getRoles();
      return users;
    }
}
