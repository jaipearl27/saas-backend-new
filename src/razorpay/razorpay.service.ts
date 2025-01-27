import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import  Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  constructor(private readonly configService: ConfigService) {}

  async createOrder(amount: number) {
    const instance = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });

    const options = {
      amount: amount * 100, // Amount is in currency subunits.
      currency: 'INR',
    };

    const result = instance.orders.create(options);
    return result
   
  }

  
}
