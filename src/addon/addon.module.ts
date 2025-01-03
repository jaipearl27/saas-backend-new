import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AddonController } from './addon.controller';
import { AddOnService } from './addon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AddOn, AddOnSchema } from 'src/schemas/addon.schema';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AddOn.name, schema: AddOnSchema }]),
  ],
  controllers: [AddonController],
  providers: [AddOnService,],
  exports: [AddOnService,],
})
export class AddonModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(
      AuthSuperAdminMiddleware
    ).forRoutes(AddonController);
  }
}
