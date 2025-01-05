import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionAddOn } from 'src/schemas/SubscriptionAddon.schema';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class SubscriptionAddonService {
  constructor(
    @InjectModel(SubscriptionAddOn.name)
    private SubscriptionAddOnModel: Model<SubscriptionAddOn>,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async createSubscriptionAddon(
    subscriptionId: string,
    expiryDate: Date,
    addOnId: string,
  ): Promise<SubscriptionAddOn> {
    const subscriptionAddon = new this.SubscriptionAddOnModel({
      subscription: subscriptionId,
      expiryDate,
      addOn: addOnId,
    });
    return subscriptionAddon.save();
  }

  async getExpiredSubscriptionAddons(): Promise<any[]> {
    const session = await this.SubscriptionAddOnModel.db.startSession(); // Start a session
    session.startTransaction(); // Begin transaction

    try {
      // Find all expired subscription add-ons
      const result: any = await this.SubscriptionAddOnModel.find({
        expiryDate: { $lt: new Date() }, // Expired add-ons
      })
        .populate('addOn', 'employeeLimit contactLimit')
        .session(session); // Associate session with this query


      // Loop through the expired subscription add-ons
      for (const subscriptionAddon of result) {
        // Decrement subscription add-ons
        await this.subscriptionService.decrementSubscriptionAddons(
          subscriptionAddon.addOn?.employeeLimit || 0, // Default to 0 if undefined
          subscriptionAddon.addOn?.contactLimit || 0,  // Default to 0 if undefined
          subscriptionAddon.subscription,
          session, // Pass session to the decrement method
        );
      }

      // Delete all expired add-ons after processing
      await this.SubscriptionAddOnModel.deleteMany({
        expiryDate: { $lt: new Date() }, // Delete all expired ones
      }).session(session); // Associate session with this query

      // Commit the transaction
      await session.commitTransaction();
      
      // Return the result for logging or further use
      return result;
    } catch (error) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      throw error; // Rethrow the error
    } finally {
      // End the session, regardless of success or failure
      session.endSession();
    }
  }

}
