import { Body, Controller, Post } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';

@Controller('razorpay')
export class RazorpayController {
  constructor(private razorpayService: RazorpayService) {}

  @Post()
  async createOrder(@Body('amount') amount: number): Promise<any> {
    const result = await this.razorpayService.createOrder(amount);
    return result;
  }
}
