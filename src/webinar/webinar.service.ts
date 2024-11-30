import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Webinar } from 'src/schemas/Webinar.schema';
import { CreateWebinarDto } from './dto/createWebinar.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebinarService {
    constructor(
        @InjectModel(Webinar.name) private webinarModel: Model<Webinar>,
        private readonly configService: ConfigService,
    ){}

    async createWebiar(createWebinarDto: CreateWebinarDto):Promise<any> {
        //create webinar

    }

    async getWebinars(userId: string):Promise<any> {
        //get all webinars for adminas per user id
    }

    async getWebinar(id: string, userId: string):Promise<any> {
        //get all webinars as per user id
    }

    async updateWebinar():Promise<any> {
        //update webinar
    }
}
