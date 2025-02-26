import {
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Enrollment } from 'src/schemas/Enrollments.schema';
import {
  CreateEnrollmentDto,
  EnrollmentsByLevelOrProductDTO,
  UpdateEnrollmentDto,
} from './dto/enrollment.dto';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<Enrollment>,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  async createEnrollment(
    createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<any> {
    const product = await this.productsService.getProduct(
      new Types.ObjectId(`${createEnrollmentDto.product}`),
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const pipeline = {
      webinar: new Types.ObjectId(`${createEnrollmentDto.webinar}`),
      attendee: createEnrollmentDto.attendee,
      product: new Types.ObjectId(`${createEnrollmentDto.product}`),
    };
    const isExist = await this.enrollmentModel.findOne(pipeline);

    if (isExist) throw new NotAcceptableException('Enrollment already exists');

    const result = await this.enrollmentModel.create({
      ...createEnrollmentDto,
      price: product.price,
    });
    return result;
  }

  async getEnrollment(
    adminId: string,
    webinar: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          webinar: new Types.ObjectId(`${webinar}`),
          adminId: new Types.ObjectId(`${adminId}`),
        },
      },
      {
        $lookup: {
          from: 'webinars',
          localField: 'webinar',
          foreignField: '_id',
          as: 'webinar',
        },
      },
      {
        $lookup: {
          from: 'attendees',
          let: { email: '$attendee' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$email', '$$email'] },
                    { $eq: ['$webinar', new Types.ObjectId(`${webinar}`)] },
                  ],
                },
              },
            },
          ],
          as: 'attendee',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$webinar' },
      { $unwind: '$attendee' },
      {
        $addFields: {
          attendee: '$attendee.email',
          attendeeId: '$attendee._id',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          webinar: {
            _id: 1,
            webinarName: 1,
            webinarDate: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          attendee: 1,
          attendeeId: 1,
          product: {
            _id: 1,
            name: 1,
            level: 1,
            price: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const totalEnrollments = await this.enrollmentModel.countDocuments({
      webinar: new Types.ObjectId(`${webinar}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });

    const totalPages = Math.ceil(totalEnrollments / limit);

    const result = await this.enrollmentModel.aggregate(pipeline);
    return { page, totalPages, result };
  }

  async getAttendeeEnrollments(
    adminId: string,
    attendeeEmail: string,
    page: number,
    limit: number,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const pipeline = {
      attendee: attendeeEmail,
      adminId: new Types.ObjectId(`${adminId}`),
    };

    const totalEnrollments =
      await this.enrollmentModel.countDocuments(pipeline);

    const totalPages = Math.ceil(totalEnrollments / limit);

    const result = await this.enrollmentModel
      .find(pipeline)
      .populate('webinar attendee product')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    return { page, totalPages, result };
  }

  async updateEnrollment(
    id: string,
    adminId: string,

    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<any> {
    const result = await this.enrollmentModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(`${id}`),
        adminId: new Types.ObjectId(`${adminId}`),
      },
      updateEnrollmentDto,
      { new: true },
    );
    return result;
  }

  async deleteEnrollment(id: string, adminId: string): Promise<any> {
    const result = await this.enrollmentModel.findOneAndDelete({
      _id: new Types.ObjectId(`${id}`),
      adminId: new Types.ObjectId(`${adminId}`),
    });
    return result;
  }

  async checkProductAssociation(id: string): Promise<any> {
    const result = await this.enrollmentModel.findOne({
      product: new Types.ObjectId(`${id}`),
    });
    return result;
  }

  async getProductLevelCounts(adminId: string, email: string) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(`${adminId}`),
          attendee: email,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
        },
      },
      {
        $group: {
          _id: '$product.level',
          count: {
            $sum: 1,
          },
        },
      },
    ];

    const result = await this.enrollmentModel.aggregate(pipeline);
    return result;
  }

  async getEnrollmentsByProductLevel(
    adminId: string,
    email: string,
    productLevel: number,
  ) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(`${adminId}`),
          attendee: email,
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
        },
      },
      {
        $match: {
          $expr: {
            $eq: ['$product.level', productLevel],
          },
        },
      },
      {
        $lookup: {
          from: 'webinars',
          localField: 'webinar',
          foreignField: '_id',
          as: 'webinar',
        },
      },
      {
        $unwind: {
          path: '$webinar',
        },
      },
      {
        $project: {
          _id: 1,
          webinarName: '$webinar.webinarName',
          webinarDate: '$webinar.webinarDate',
          productName: '$product.name',
          productLevel: '$product.level',
          productPrice: '$product.price',
          enrollmentDate: '$createdAt',
        },
      },
      {
        $sort: {
          enrollmentDate: -1,
        },
      },
    ];

    const result = await this.enrollmentModel.aggregate(pipeline);
    return result;
  }

  async getEnrollmentByWebinarAndAttendee(
    adminId: string,
    webinar: string,
    attendee: string,
    product: string,
  ) {
    const result = await this.enrollmentModel.findOne({
      adminId: new Types.ObjectId(`${adminId}`),
      webinar: new Types.ObjectId(`${webinar}`),
      attendee: attendee,
      product: new Types.ObjectId(`${product}`),
    });
    return result;
  }

  async getEnrollmentsByLevelOrProduct(
    productData: EnrollmentsByLevelOrProductDTO,
    adminId: string,
  ) {
    const page = parseInt(productData.page) || 1;
    const limit = parseInt(productData.limit) || 10;
    const level = parseInt(productData.productLevel) || undefined;

    console.log(page,limit, level, productData.productId)
    const skip = (page - 1) * limit;

    const basePipeline: PipelineStage[] = [
      {
        $match: {
          adminId: new Types.ObjectId(`${adminId}`),
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData',
        },
      },
      { $unwind: '$productData' },
      {
        $match: {
          ...(isNaN(level)
            ? {}
            : {
              'productData.level': level,
            }),
          ...(productData?.productId
            ? {
                'productData._id': new Types.ObjectId(productData?.productId),
              }
            : {}),
        },
      },
      {
        $sort: {
          attendee: 1
        }
      }
    ];
    const countPipeline: PipelineStage[] = [
      ...basePipeline,
      { $count: 'total' },
    ];
    const mainPipeline: PipelineStage[] = [
      ...basePipeline,
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'webinars',
          localField: 'webinar',
          foreignField: '_id',
          as: 'webinarDetails',
        },
      },
      { $unwind: '$webinarDetails' },
      {
        $project: {
          attendee: 1,
          webinarName: '$webinarDetails.webinarName',
          productName: '$productData.name',
          productLevel: '$productData.level',
          createdAt: 1,
          price: 1
        },
      },
    ];

    const [countResult, mainResult] = await Promise.all([
      this.enrollmentModel.aggregate(countPipeline).exec(),
      this.enrollmentModel.aggregate(mainPipeline).exec(),
    ]);
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const pagination = { page, totalPages, total };
    console.log(pagination, limit);
    return { data: mainResult || [], pagination };
  }
}
