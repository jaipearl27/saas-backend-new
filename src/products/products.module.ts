import { MiddlewareConsumer, Module, Req, RequestMethod } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { Products, ProductsSchema } from 'src/schemas/Products.schema';
import { GetAdminIdMiddleware } from 'src/middlewares/get-admin-id.middleware';
import { AuthTokenMiddleware } from 'src/middlewares/authToken.Middleware';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Products.name, schema: ProductsSchema },
    ]),
    UsersModule
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthAdminTokenMiddleware)
      .exclude({ path: 'products', method: RequestMethod.GET })
      .forRoutes({ path: 'products*', method: RequestMethod.ALL });

    consumer
      .apply(AuthTokenMiddleware, GetAdminIdMiddleware)
      .forRoutes({ path: 'products', method: RequestMethod.GET });
  }
}