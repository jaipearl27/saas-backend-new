import {
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Products } from 'src/schemas/Products.schema';
import { CreateProductsDto, UpdateProductsDto } from './dto/products.dto';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Products.name) private readonly productsModel: Model<Products>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
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

  async deleteProduct(id: string, adminId: string): Promise<any> {
    const isExisting =
      await this.enrollmentsService.checkProductAssociation(id);
    if (isExisting)
      throw new NotAcceptableException('Enrolled products cannot be deleted.');
    const result = await this.productsModel.findOneAndDelete({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });
    return 'Product Deleted Successfully!'
  }
}
