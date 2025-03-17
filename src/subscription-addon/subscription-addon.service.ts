import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { SubscriptionAddOn } from 'src/schemas/SubscriptionAddon.schema';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class SubscriptionAddonService {
  private readonly logger = new Logger(SubscriptionAddOn.name);

  constructor(
    @InjectModel(SubscriptionAddOn.name)
    private SubscriptionAddOnModel: Model<SubscriptionAddOn>,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting MongoDB Change Stream for subscription addons...');
    this.watchSubscriptionAddons();
  }

  

  private async watchSubscriptionAddons() {
    const pipeline = [{ $match: { operationType: 'delete' } }];

    const changeStream = this.SubscriptionAddOnModel.watch(pipeline, {
      fullDocumentBeforeChange: "whenAvailable"
    });

    changeStream.on('change', async (change) => {
      this.logger.log(`Detected expired add-on: ${JSON.stringify(change)}`);
      
      const deletedDocument = change.fullDocumentBeforeChange;
      if (!deletedDocument) {
        this.logger.error('No document found before deletion');
        return;
      }

      const subscriptionId = deletedDocument.subscription.toString();
      console.log(subscriptionId);
      await this.subscriptionService.updateSingleSubscriptionAddon(subscriptionId);
    });

    changeStream.on('error', (err) => {
      this.logger.error('Change Stream Error:', err);
    });
  }

  async createSubscriptionAddon(
    subscriptionId: string,
    expiryDate: Date,
    addOnId: string,
    employeeLimit: number = 0,
    contactLimit: number = 0,
  ): Promise<SubscriptionAddOn> {
    const subscriptionAddon = new this.SubscriptionAddOnModel({
      subscription: subscriptionId,
      expiryDate,
      addOn: addOnId,
      employeeLimit,
      contactLimit,
    });
    return subscriptionAddon.save();
  }

  async getUserAddons(subscriptionId: string) {
    return await this.SubscriptionAddOnModel.aggregate([
      {
        $match: {
          subscription: new Types.ObjectId(`${subscriptionId}`),
        },
      },
      {
        $lookup: {
          from: 'addons',
          localField: 'addOn',
          foreignField: '_id',
          as: 'addOnDetails',
        },
      },
      {
        $unwind: {
          path: '$addOnDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          addonName: '$addOnDetails.addonName',
          expiryDate: '$expiryDate',
          employeeLimit: '$addOnDetails.employeeLimit',
          contactLimit: '$addOnDetails.contactLimit',
          addOnPrice: '$addOnDetails.addOnPrice',
          addOnId: '$addOnDetails._id',
        },
      },
    ]).exec();
  }
}
