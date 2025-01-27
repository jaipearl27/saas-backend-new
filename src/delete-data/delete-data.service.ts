import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from 'rxjs';
import { AddOn } from 'src/schemas/addon.schema';
import { Alarm } from 'src/schemas/Alarm.schema';
import { AttendeeAssociation } from 'src/schemas/attendee-association.schema';
import { Attendee } from 'src/schemas/Attendee.schema';
import { BillingHistory } from 'src/schemas/BillingHistory.schema';
import { CustomLeadType } from 'src/schemas/custom-lead-type.schema';
import { Enrollment } from 'src/schemas/Enrollments.schema';
import { FilterPreset } from 'src/schemas/FilterPreset.schema';
import { LandingPage } from 'src/schemas/LandingPage.schema';
import { Location } from 'src/schemas/location.schema';
import { Notes } from 'src/schemas/Notes.schema';
import { NoticeBoard } from 'src/schemas/notice-board.schema';
import { Notification } from 'src/schemas/notification.schema';
import { Plans } from 'src/schemas/Plans.schema';
import { Products } from 'src/schemas/Products.schema';
import { StatusDropdown } from 'src/schemas/StatusDropdown.schema';
import { User } from 'src/schemas/User.schema';
import { UserActivity } from 'src/schemas/UserActivity.schema';
import { Webinar } from 'src/schemas/Webinar.schema';

@Injectable()
export class DeleteDataService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<User>,
        @InjectModel(Webinar.name) private readonly webinarModel: Model<Webinar>,
        @InjectModel(Notes.name) private readonly notesModel: Model<Notes>,
        @InjectModel(Attendee.name) private readonly attendeeModel: Model<Attendee>,
        @InjectModel(AttendeeAssociation.name) private readonly attendeeAssociationModel: Model<AttendeeAssociation>,
        @InjectModel(BillingHistory.name) private readonly billingHistoryModel: Model<BillingHistory>,
        @InjectModel(CustomLeadType.name) private readonly customLeadTypeModel: Model<CustomLeadType>,
        @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<Enrollment>,
        @InjectModel(Products.name) private readonly productsModel: Model<Products>,
        @InjectModel(StatusDropdown.name) private readonly statusDropdownModel: Model<StatusDropdown>,
        @InjectModel(Subscription.name) private readonly subscriptionModel: Model<Subscription>,

        @InjectModel(Alarm.name) private readonly alarmModel: Model<Alarm>,
        @InjectModel(NoticeBoard.name) private readonly noticeBoardModel: Model<NoticeBoard>,
        @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
        @InjectModel(UserActivity.name) private readonly userActivityModel: Model<UserActivity>,
        @InjectModel(FilterPreset.name) private readonly filterPresetModel: Model<FilterPreset>,
        
    ) { }

    async deleteData(id: string): Promise<any> {
        try {
            // Delete all data except for User and StatusDropdown where adminId equals the provided id
            await Promise.all([
                // Delete all records in the following models
                this.webinarModel.deleteMany({}),
                this.notesModel.deleteMany({}),
                this.attendeeModel.deleteMany({}),
                this.attendeeAssociationModel.deleteMany({}),
                this.billingHistoryModel.deleteMany({}),
                this.customLeadTypeModel.deleteMany({}),
                this.enrollmentModel.deleteMany({}),
                this.productsModel.deleteMany({}),
                this.subscriptionModel.deleteMany({}),
                this.alarmModel.deleteMany({}),
                this.noticeBoardModel.deleteMany({}),
                this.notificationModel.deleteMany({}),
                this.userActivityModel.deleteMany({}),
                this.filterPresetModel.deleteMany({}),
                

                // Delete records in User and StatusDropdown but exclude those with adminId equal to provided id
                this.userModel.deleteMany({ _id: { $ne: new Types.ObjectId(`${id}`) } }), // Do not delete users with adminId == id
                this.statusDropdownModel.deleteMany({ createdBy: { $ne: id } }) // Do not delete StatusDropdown with adminId == id
            ]);

            return { success: true, message: 'All data has been deleted from all models.' };
        } catch (error) {
            console.error('Error deleting data:', error);
            throw new Error('An error occurred while deleting data from the models.');
        }
    }

}
