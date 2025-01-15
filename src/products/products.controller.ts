import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { CreateProductsDto, UpdateProductsDto } from './dto/products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async createProduct(
    @Id() adminId: string,
    @Body() createProductsDto: CreateProductsDto,
  ): Promise<any> {
    createProductsDto.adminId = adminId;
    const product = await this.productsService.createProduct(createProductsDto);
    return product;
  }

  @Get()
  async getProducts(
    @Query() query: { page?: string; limit?: string },
    @AdminId() adminId: string,
  ): Promise<any> {
    const page = Number(query?.page) ? Number(query?.page) : 1;

    const limit = Number(query?.limit) ? Number(query?.limit) : 25;
    const products = await this.productsService.getProducts(
      adminId,
      page,
      limit,
    );

    return products;
  }

  @Get('all')
  async getAllProductsByAdminId(@AdminId() adminId: string): Promise<any> {
    const products = await this.productsService.getAllProductsByAdminId(
      adminId
    );

    return products;
  }

  @Patch(':id')
  async updateProduct(
    @Param('id') id: string,
    @Id() adminId: string,
    @Body() updateProductDto: UpdateProductsDto,
  ): Promise<any> {
    const product = await this.productsService.updateProduct(
      id,
      adminId,
      updateProductDto,
    );
    return product;
  }

  @Delete(':id')
  async deleteProduct(
    @Param('id') id: string,
    @Id() adminId: string,
  ): Promise<any> {
    const result = await this.productsService.deleteProduct(id, adminId);
    return result;
  }
}
