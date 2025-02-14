import {
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Products } from 'src/schemas/Products.schema';
import { CreateProductsDto, UpdateProductsDto } from './dto/products.dto';
import { EnrollmentsService } from 'src/enrollments/enrollments.service';
import { ProductLevel } from 'src/schemas/product-level.schema';
import {
  CreateProductLevelDto,
  UpdateProductLevelDto,
} from './dto/product-level.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Products.name) private readonly productsModel: Model<Products>,
    @Inject(forwardRef(() => EnrollmentsService))
    private enrollmentsService: EnrollmentsService,
    @InjectModel(ProductLevel.name)
    private readonly productLevelModel: Model<ProductLevel>,
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

  async getAllProductsByAdminId(adminId: string): Promise<any> {
    const pipeline = { adminId: new Types.ObjectId(`${adminId}`) };

    const result = await this.productsModel.find(pipeline).sort({ name: 1 });
    return result;
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
    return 'Product Deleted Successfully!';
  }

  async createProductLevel(
    createProductLevelDto: CreateProductLevelDto,
    adminId: string,
  ): Promise<any> {
    const isExisting = await this.productLevelModel.findOne({
      $or: [
        { label: createProductLevelDto.label },
        { level: createProductLevelDto.level },
      ],
      adminId: new Types.ObjectId(`${adminId}`),
    });
    if (isExisting)
      throw new NotAcceptableException(
        'Product Level or label already exists.',
      );

    const result = await this.productLevelModel.create({
      ...createProductLevelDto,
      adminId: new Types.ObjectId(`${adminId}`),
    });

    return result;
  }

  async updateProductLevel(
    id: string,
    updateProductLevelDto: UpdateProductLevelDto,
    adminId: string,
  ): Promise<any> {

    const isExisting = await this.productLevelModel.findOne({
      label: updateProductLevelDto.label,
      adminId: new Types.ObjectId(`${adminId}`),
      _id: { $ne: new Types.ObjectId(`${id}`) },
    });
    if (isExisting)
      throw new NotAcceptableException('Product label already exists.');


    const result = await this.productLevelModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      { label: updateProductLevelDto.label},
      { new: true },
    );
    if (!result) {
      throw new NotFoundException('Product Level not found.');
    }
    return result;
  }


  async deleteProductLevel(id: string, adminId: string): Promise<any> {
    const result = await this.productLevelModel.findOneAndDelete({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });
    if (!result) {
      throw new NotFoundException('Product Level not found.');
    }
    return result;
  }


  async getProductLevels(adminId: string): Promise<any> {
    const result = await this.productLevelModel.find({
      adminId: new Types.ObjectId(`${adminId}`),
    }).sort({ level: 1 });
    return result;
  }
}
