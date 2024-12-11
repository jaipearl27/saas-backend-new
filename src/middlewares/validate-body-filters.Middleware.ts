import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from 'src/subscription/subscription.service';

@Injectable()
export class ValidateBodyFilters implements NestMiddleware {
  constructor(private readonly subService: SubscriptionService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const body = req.body;
    const userId = req.id;
    const subscription = await this.subService.getSubscription(userId);

    if (!subscription) {
      throw new BadRequestException('No Subscription Found with the given ID.');
    }
    const tableConfig: Map<string, any> =
      subscription?.plan?.attendeeTableConfig || new Map();

    const filteredBody = Object.keys(body).reduce(
      (acc, key) => {
        if (tableConfig.has(key)) {
          acc[key] = body[key];
        }
        return acc;
      },
      {} as Record<string, any>,
    );

    // Replace the original body with the filtered one
    req.body = filteredBody;


    // Proceed to the next middleware or route handler
    next();
  }
}
