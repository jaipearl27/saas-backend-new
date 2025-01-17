import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BillingHistory } from 'src/schemas/BillingHistory.schema';
import {
  BillingHistoryDto,
  UpdateBillingHistory,
} from './dto/bililngHistory.dto';

@Injectable()
export class BillingHistoryService {
  constructor(
    @InjectModel(BillingHistory.name)
    private BillingHistoryModel: Model<BillingHistory>,
  ) {}

  private generateInvoiceNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let invoiceNumber = '';
    for (let i = 0; i < 6; i++) {
      invoiceNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return invoiceNumber;
  }

  private async isInvoiceNumberUnique(invoiceNumber: string): Promise<boolean> {
    const existing = await this.BillingHistoryModel.findOne({ invoiceNumber });
    return !existing;
  }

  async addBillingHistory(billingHistoryDto: BillingHistoryDto): Promise<any> {
    let invoiceNumber = this.generateInvoiceNumber();

    while (!(await this.isInvoiceNumberUnique(invoiceNumber))) {
      invoiceNumber = this.generateInvoiceNumber();
    }

    const result = await this.BillingHistoryModel.create({
      ...billingHistoryDto,
      invoiceNumber,
    });
    return result;
  }

  async updateBillingHistory(
    id: string,
    updateBillingHistory: UpdateBillingHistory,
  ): Promise<any> {
    const result =
      this.BillingHistoryModel.findByIdAndUpdate(updateBillingHistory);
  }

  async addOneBillingHistory(
    adminId: string,
    addOnId: string,
    amount: number,
  ): Promise<BillingHistory> {
    let invoiceNumber = this.generateInvoiceNumber();

    while (!(await this.isInvoiceNumberUnique(invoiceNumber))) {
      invoiceNumber = this.generateInvoiceNumber();
    }

    const billingHistory = new this.BillingHistoryModel({
      admin: new Types.ObjectId(`${adminId}`),
      date: new Date(),
      addOn: new Types.ObjectId(`${addOnId}`),
      amount,
      invoiceNumber,
    });
    return billingHistory.save();
  }
  async getBillingHistory(
    adminId: string,
    page: number,
    limit: number,
  ): Promise<{
    page: number;
    totalPages: number;
    data: BillingHistory[];
  }> {
    const skip = (page - 1) * limit;
    const result = await this.BillingHistoryModel.find({
      admin: new Types.ObjectId(`${adminId}`),
    })
      .populate({
        path: 'addOn',
        select: 'addonName _id',
      })
      .populate({
        path: 'plan',
        select: 'name _id',
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.BillingHistoryModel.countDocuments({
      admin: new Types.ObjectId(`${adminId}`),
    });

    return {
      totalPages: Math.ceil(total / limit),
      data: result || [],
      page,
    };
  }
}
