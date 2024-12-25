import { Controller, Delete } from '@nestjs/common';

import { DeleteDataService } from './delete-data.service';
import { Id } from 'src/decorators/custom.decorator';

@Controller('delete-data')
export class DeleteDataController {
    constructor(private readonly deleteDataService: DeleteDataService) {}
    @Delete()
    async deleteData(@Id() id: string): Promise<any> {
        const result = await this.deleteDataService.deleteData(id)
        return result
    }
}
