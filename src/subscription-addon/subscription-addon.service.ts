import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
          subscriptionAddon.addOn?.contactLimit || 0, // Default to 0 if undefined
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

  async updateSubscriptionAddons(){ // boilerplate
    this.SubscriptionAddOnModel.aggregate([
      // Step 1: Filter valid addons (deadline >= current date)
      { $match: { deadline: { $gte: new Date() } } },
    
      // Step 2: Group by userId and sum valid contacts
      { $group: { 
          _id: "$userId", 
          totalContacts: { $sum: "$contacts" } 
      }},
    
      // Step 3: Rename _id to userId (to match subscription's userId field)
      { $project: { 
          userId: "$_id", 
          totalContacts: 1, 
          _id: 0 
      }},
    
      // Step 4: Merge results into the subscription collection
      { $merge: { 
          into: "subscription",
          on: "userId",               // Match subscription.userId = addons.userId
          whenMatched: [{
            $set: { contactAddons: "$totalContacts" } // Update contactAddons
          }],
          whenNotMatched: "insert"
      }}
    ]);
  }
}
