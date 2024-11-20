import { Request } from 'express';

export interface CustomRequest extends Request {
  id?: string;
  role?: string;
  plan?: string;
}