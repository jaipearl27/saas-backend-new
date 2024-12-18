import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Products } from 'src/schemas/Products.schema';
import { CreateProductsDto, UpdateProductsDto } from './dto/products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Products.name) private readonly productsModel: Model<Products>,
  ) {}

  async createProduct(createProductsDto: CreateProductsDto): Promise<any> {
    const result = await this.productsModel.create(createProductsDto);
    return result;
  }

  async getProducts(
    adminId: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline = { adminId: new Types.ObjectId(`${adminId}`) };

    const totalProducts = await this.productsModel.countDocuments(pipeline);

    const totalPages = Math.ceil(totalProducts / limit);

    const result = await this.productsModel
      .find(pipeline)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    return { page, totalPages, result };
  }

  async updateProduct(
    id: string,
    adminId: string,
    updateProductsDto: UpdateProductsDto,
  ): Promise<any> {
    const result = await this.productsModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateProductsDto,
      { new: true },
    );
    return result;
  }
}
