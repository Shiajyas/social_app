import { IUser } from './IUser';
import { Request} from 'express';


export interface AuthenticatdRequest extends Request {
  admin: any;
  user?: IUser;
}
