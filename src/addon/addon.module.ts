import { forwardRef, MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AddonController } from './addon.controller';
import { AddOnService } from './addon.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AddOn, AddOnSchema } from 'src/schemas/addon.schema';
import { AuthSuperAdminMiddleware } from 'src/middlewares/authSuperAdmin.Middleware';
import { AuthAdminTokenMiddleware } from 'src/middlewares/authAdmin.Middleware';
import { SubscriptionAddonModule } from 'src/subscription-addon/subscription-addon.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AddOn.name, schema: AddOnSchema }]),
    SubscriptionAddonModule,
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [AddonController],
  providers: [AddOnService],
  exports: [AddOnService],
})
export class AddonModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthAdminTokenMiddleware).forRoutes(
      {
        path: 'addon',
        method: RequestMethod.GET,
      },
      {
        path: 'addon/client/:id',
        method: RequestMethod.GET,
      },
    );

    consumer
      .apply(AuthSuperAdminMiddleware)
      .exclude({
        path: 'addon',
        method: RequestMethod.GET,
      })
      .exclude({
        path: 'addon/client/:id',
        method: RequestMethod.GET,
      })
      .forRoutes(AddonController);
  }
}
