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
    const { filters = {}, columns = [], fieldName = '' } = req.body;
    const userId = req.id;
    const subscription = await this.subService.getSubscription(userId);

    if (!subscription) {
      throw new BadRequestException('No Subscription Found with the given ID.');
    }
    const tableConfig: Map<string, any> =
      subscription?.plan?.[fieldName] || new Map();

    const allowedFilters = Object.keys(filters).reduce(
      (acc, key) => {
        if (tableConfig.has(key)) {
          const columnConfig = tableConfig.get(key);
          if (columnConfig?.filterable) acc[key] = filters[key];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
    const allowedColumns = columns.filter((column) => {
      if (tableConfig.has(column)) {
        const columnConfig = tableConfig.get(column);
        if (columnConfig?.downloadable) return true;
      }

      return false;
    });

    // Replace the original body with the filtered one
    req.body = {
      ...req.body,
      filters: allowedFilters,
      columns: allowedColumns,
    };

    // Proceed to the next middleware or route handler
    next();
  }
}
