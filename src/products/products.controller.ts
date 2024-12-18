import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminId, Id } from 'src/decorators/custom.decorator';
import { CreateProductsDto } from './dto/products.dto';

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
    const page = Number(query.page) ? Number(query.page) : 1;

    const limit = Number(query.limit) ? Number(query.limit) : 25;
    const products = await this.productsService.getProducts(
      adminId,
      page,
      limit,
    );

    return products
  }
}
